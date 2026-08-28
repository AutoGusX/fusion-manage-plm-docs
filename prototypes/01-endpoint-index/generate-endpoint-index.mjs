#!/usr/bin/env node
// PROTOTYPE 01 — Endpoint Index
//
// Scans every docs page for HTTP endpoints and emits a single reference page
// listing all of them, grouped by API surface, each linked to the page that
// documents it.
//
// Why: the site is organised by topic, which is right for reading but wrong
// for "I have an endpoint, where is it documented?" and for an agent that
// wants the whole surface in one fetch. This is generated, so it cannot drift
// from the prose.
//
// See prototypes/README.md for enable/disable instructions.
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const DOCS = 'src/content/docs';
const OUT = join(DOCS, 'reference', 'endpoint-index.md');
const METHODS = 'GET|POST|PUT|PATCH|DELETE';

function walk(dir) {
	const out = [];
	for (const n of readdirSync(dir)) {
		const f = join(dir, n);
		if (statSync(f).isDirectory()) out.push(...walk(f));
		else if (/\.mdx?$/.test(n)) out.push(f);
	}
	return out;
}

function frontmatterTitle(txt, fallback) {
	const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!m) return fallback;
	const t = m[1].match(/^title:\s*(.+)$/m);
	if (!t) return fallback;
	return t[1].trim().replace(/^["']|["']$/g, '');
}

/** Which API surface a path belongs to, for grouping. */
function surfaceOf(path) {
	if (path.startsWith('/api/v3/')) return 'v3';
	if (path.startsWith('/api/v2/')) return 'v2';
	if (path.startsWith('/api/rest/v1/')) return 'v1';
	return 'other';
}

/** Coarse resource bucket, for sorting within a surface. */
function resourceOf(path) {
	const seg = path.replace(/^\/api\/(rest\/)?v\d\//, '').split('/')[0] || '—';
	return seg.replace(/[?{].*$/, '');
}

const rows = new Map(); // dedupe key -> row

for (const file of walk(DOCS)) {
	const rel = file.replace(/\\/g, '/').replace(`${DOCS}/`, '');
	if (rel.startsWith('reference/')) continue; // don't index the index
	const txt = readFileSync(file, 'utf8');
	const slug = '/' + rel.replace(/\.mdx?$/, '') + '/';
	const title = frontmatterTitle(txt, rel);

	for (const m of txt.matchAll(
		new RegExp(`\\b(${METHODS})\\b\\s+(/api/[^\\s\`|)>,"']+)`, 'g'),
	)) {
		const method = m[1];
		// Trim trailing punctuation that isn't part of a path/query.
		const path = m[2].replace(/[.,;:]+$/, '');
		// Dedupe on a placeholder-agnostic key so `{classId}` and `{id}` in the
		// same position don't produce two rows for one endpoint. The first
		// spelling encountered is the one displayed.
		const key = `${method} ${path.replace(/\{[^}]*\}/g, '{}')}`;
		if (rows.has(key)) continue;
		rows.set(key, { method, path, title, slug, surface: surfaceOf(path) });
	}
}

const all = [...rows.values()];
const SURFACES = [
	['v3', 'v3 — `/api/v3/…`', 'The primary modern surface.'],
	['v2', 'v2 — `/api/v2/…`', 'The classification / parts-attribute subsystem.'],
	['v1', 'v1 — `/api/rest/v1/…`', 'Legacy, but still load-bearing for several operations.'],
	['other', 'Other', 'Adjacent APIs on different hosts.'],
];

const METHOD_ORDER = { GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4 };

const out = [
	'---',
	'title: Endpoint Index',
	'description: Every documented Fusion Manage endpoint in one table, grouped by API surface and linked to its reference page.',
	'---',
	'',
	'Every endpoint documented on this site, in one place. The topic pages are the',
	'better read; this is for when you already have an endpoint and want to find',
	'where it is explained — or when an agent wants the whole surface in one fetch.',
	'',
	':::note',
	'Generated from the reference pages by `prototypes/01-endpoint-index/generate-endpoint-index.mjs`.',
	"Don't edit by hand — it is rewritten on every build.",
	':::',
	'',
];

for (const [key, heading, blurb] of SURFACES) {
	const group = all.filter((r) => r.surface === key);
	if (!group.length) continue;
	group.sort(
		(a, b) =>
			resourceOf(a.path).localeCompare(resourceOf(b.path)) ||
			a.path.localeCompare(b.path) ||
			(METHOD_ORDER[a.method] ?? 9) - (METHOD_ORDER[b.method] ?? 9),
	);
	out.push(`## ${heading}`, '', blurb, '', '| Method | Path | Documented in |', '|---|---|---|');
	for (const r of group) {
		out.push(`| \`${r.method}\` | \`${r.path}\` | [${r.title}](${r.slug}) |`);
	}
	out.push('');
}

out.push(
	`_${all.length} endpoints across ${SURFACES.filter(([k]) => all.some((r) => r.surface === k)).length} surfaces._`,
	'',
);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out.join('\n'));
console.log(`[prototype 01] Wrote ${OUT} with ${all.length} endpoints.`);
