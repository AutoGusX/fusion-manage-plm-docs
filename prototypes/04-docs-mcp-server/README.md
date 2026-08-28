# Prototype 04 — Docs MCP server

Exposes this documentation set to Claude (or any MCP client) as queryable tools,
so an agent can look up an endpoint instead of crawling the site or re-deriving
API behaviour from scratch each session — the exact problem named in
`specs/0001-…`.

`llms.txt` already gives an agent a one-shot snapshot of everything. This is the
other half: targeted queries, so the agent spends context on the two pages it
needs rather than all thirty.

## Tools

| Tool | Purpose |
|---|---|
| `list_pages` | Every page with slug + description — orient first |
| `get_page(slug)` | Full markdown of one page |
| `search_docs(query, limit)` | Full-text search, ranked, with context snippets |
| `find_endpoint(path_fragment, method?)` | "Which page documents `bom-items`?" |
| `list_endpoints(surface?)` | All endpoints, optionally filtered to v1/v2/v3 |

Read-only and offline: it reads the markdown in `src/content/docs/` and makes no
network calls. It never touches a tenant and needs no credentials.

## Run it

```bash
cd prototypes/04-docs-mcp-server

# stdio (for Claude Code / Claude Desktop)
uv run python server.py

# HTTP, matching the shape of the PLM/MES servers in the MCP playground
PORT=8004 uv run python server.py --http
```

Register with Claude Code:

```json
{
  "mcpServers": {
    "fusion-manage-docs": {
      "command": "uv",
      "args": ["run", "python",
               "C:/Users/quadeg/fusion-manage-plm-docs/prototypes/04-docs-mcp-server/server.py"]
    }
  }
}
```

## Status

The five tools were exercised directly against the real docs (31 pages loaded;
search, `find_endpoint`, and `list_endpoints` all returning correct results) with
FastMCP stubbed out, so the logic is verified. It has **not** yet been run
against a live MCP client end-to-end — that needs `mcp` installed in a venv here.

Output is deliberately ASCII-only: these strings can surface in a Windows
console (cp1252), where a stray `→` raises `UnicodeEncodeError`.

## Removing it

Delete this directory. Nothing outside it references the server.
