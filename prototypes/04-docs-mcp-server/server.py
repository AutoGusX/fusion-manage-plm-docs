"""PROTOTYPE 04 — Fusion Manage PLM Docs MCP server.

Exposes this documentation set to an AI agent as MCP tools, so Claude can look
up an endpoint or read a page directly instead of crawling the site or
re-deriving API behaviour from scratch each session — which is the problem
statement in the project spec.

Complements llms.txt: that is a single-fetch snapshot, this is queryable.

Reads the markdown in ../../src/content/docs at runtime, so it always reflects
the working tree. No network access and no tenant credentials — it serves
documentation only.

Deliberately matches the FastMCP/HTTP shape of the existing PLM and MES servers
(see the `plm + mes mcp` playground) so it slots into the same .mcp.json setup.

Run (stdio, for a local Claude Code / desktop client):
    uv run python server.py

Run (HTTP, matching the other servers in this stack):
    PORT=8004 uv run python server.py --http

Register in .mcp.json:
    {"mcpServers": {"fusion-manage-docs": {"command": "uv",
      "args": ["run", "python", "<abs path>/server.py"]}}}
"""

from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from mcp.server.fastmcp import FastMCP

DOCS_DIR = (Path(__file__).resolve().parents[2] / "src" / "content" / "docs").resolve()
SITE = "https://autogusx.github.io/fusion-manage-plm-docs"
METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE")
ENDPOINT_RE = re.compile(rf"\b({'|'.join(METHODS)})\b\s+(/api/[^\s`|)>,\"']+)")


@dataclass(frozen=True)
class Page:
    slug: str          # e.g. "api/v3/items"
    title: str
    description: str
    body: str

    @property
    def url(self) -> str:
        return f"{SITE}/{self.slug}/"


def _frontmatter(raw: str) -> tuple[dict[str, str], str]:
    """Split leading YAML frontmatter from the body.

    Hand-parsed rather than pulling in a YAML dependency: only flat
    `key: value` pairs are needed here.
    """
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n?(.*)$", raw, re.S)
    if not m:
        return {}, raw
    meta: dict[str, str] = {}
    for line in m.group(1).splitlines():
        kv = re.match(r"^(\w+):\s*(.+)$", line)
        if kv:
            meta[kv.group(1)] = kv.group(2).strip().strip("\"'")
    return meta, m.group(2)


@lru_cache(maxsize=1)
def _load_pages() -> tuple[Page, ...]:
    if not DOCS_DIR.is_dir():
        raise RuntimeError(f"Docs directory not found: {DOCS_DIR}")
    pages: list[Page] = []
    for path in sorted(DOCS_DIR.rglob("*")):
        if path.suffix not in {".md", ".mdx"}:
            continue
        meta, body = _frontmatter(path.read_text(encoding="utf-8"))
        slug = path.relative_to(DOCS_DIR).with_suffix("").as_posix()
        if slug == "index":
            slug = ""
        pages.append(
            Page(
                slug=slug,
                title=meta.get("title", slug or "Home"),
                description=meta.get("description", ""),
                body=body,
            )
        )
    return tuple(pages)


mcp = FastMCP(
    "fusion-manage-docs",
    host=os.getenv("HOST", "127.0.0.1"),
    port=int(os.getenv("PORT", "8004")),
    streamable_http_path="/mcp",
)


@mcp.tool()
def list_pages() -> str:
    """List every documentation page with its slug and one-line description.

    Use this first to orient before fetching a specific page.
    """
    lines = [
        f"{p.slug or '(home)'} — {p.title}: {p.description}" for p in _load_pages()
    ]
    return "\n".join(lines)


@mcp.tool()
def get_page(slug: str) -> str:
    """Return the full markdown of one documentation page.

    Args:
        slug: Page slug such as `api/v3/items` or `concepts/authentication`.
              Call `list_pages` if unsure.
    """
    want = slug.strip().strip("/")
    for p in _load_pages():
        if p.slug == want:
            return f"# {p.title}\n\n{p.url}\n\n{p.body}"
    available = ", ".join(p.slug for p in _load_pages() if p.slug)
    return f"No page with slug '{slug}'.\n\nAvailable: {available}"


@mcp.tool()
def search_docs(query: str, limit: int = 5) -> str:
    """Full-text search the documentation.

    Returns matching pages ranked by hit count, each with the surrounding
    context of its best matches.

    Args:
        query: Words to search for, e.g. "workflow transition 303" or
               "absolute URL". All terms are matched case-insensitively.
        limit: Maximum number of pages to return.
    """
    terms = [t for t in re.split(r"\s+", query.strip().lower()) if t]
    if not terms:
        return "Empty query."

    scored: list[tuple[int, Page, list[str]]] = []
    for page in _load_pages():
        hay = f"{page.title}\n{page.description}\n{page.body}".lower()
        if not all(t in hay for t in terms):
            continue
        score = sum(hay.count(t) for t in terms)
        # Title matches are a much stronger signal than body mentions.
        score += 20 * sum(1 for t in terms if t in page.title.lower())

        snippets: list[str] = []
        for line in page.body.splitlines():
            low = line.lower()
            if any(t in low for t in terms) and line.strip():
                snippets.append(line.strip())
            if len(snippets) >= 3:
                break
        scored.append((score, page, snippets))

    if not scored:
        return f"No pages matched all of: {', '.join(terms)}"

    scored.sort(key=lambda s: -s[0])
    out: list[str] = []
    for score, page, snippets in scored[:limit]:
        out.append(f"## {page.title}  ({page.slug})\n{page.url}")
        for s in snippets:
            out.append(f"  … {s}")
        out.append("")
    return "\n".join(out)


@mcp.tool()
def find_endpoint(path_fragment: str, method: str = "") -> str:
    """Find which page documents a given API endpoint.

    Args:
        path_fragment: Any part of the path, e.g. "bom-items", "views/11",
                       or "/api/v3/workspaces".
        method: Optionally narrow by HTTP method (GET, POST, PUT, PATCH, DELETE).
    """
    frag = path_fragment.strip().lower()
    want_method = method.strip().upper()
    hits: list[str] = []
    seen: set[tuple[str, str]] = set()

    for page in _load_pages():
        for m in ENDPOINT_RE.finditer(page.body):
            verb, path = m.group(1), m.group(2).rstrip(".,;:")
            if frag not in path.lower():
                continue
            if want_method and verb != want_method:
                continue
            key = (verb, re.sub(r"\{[^}]*\}", "{}", path))
            if key in seen:
                continue
            seen.add(key)
            # ASCII-only output: these strings can land in Windows consoles
            # (cp1252) where a stray arrow glyph raises UnicodeEncodeError.
            hits.append(f"{verb:6} {path}\n         -> {page.title} ({page.url})")

    if not hits:
        return f"No documented endpoint matching '{path_fragment}'" + (
            f" with method {want_method}." if want_method else "."
        )
    return "\n".join(hits)


@mcp.tool()
def list_endpoints(surface: str = "") -> str:
    """List every documented endpoint, optionally filtered by API surface.

    Args:
        surface: "v1", "v2", or "v3" to filter; empty for all.
    """
    prefix = {
        "v1": "/api/rest/v1/",
        "v2": "/api/v2/",
        "v3": "/api/v3/",
        "": "/api/",
    }.get(surface.strip().lower())
    if prefix is None:
        return "surface must be one of: v1, v2, v3, or empty for all."

    rows: dict[tuple[str, str], str] = {}
    for page in _load_pages():
        for m in ENDPOINT_RE.finditer(page.body):
            verb, path = m.group(1), m.group(2).rstrip(".,;:")
            if not path.startswith(prefix):
                continue
            key = (verb, re.sub(r"\{[^}]*\}", "{}", path))
            rows.setdefault(key, f"{verb:6} {path}   [{page.title}]")

    if not rows:
        return f"No endpoints found for surface '{surface}'."
    return "\n".join(sorted(rows.values(), key=lambda r: r[7:])) + f"\n\n{len(rows)} endpoints."


if __name__ == "__main__":
    if "--http" in sys.argv:
        mcp.run(transport="streamable-http")
    else:
        mcp.run()
