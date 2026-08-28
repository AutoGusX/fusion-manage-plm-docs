#!/usr/bin/env node
// Validates every internal link in the built site against the pages that
// actually exist in dist/. Run after `astro build`.
//
// This exists because two real bugs shipped before it: homepage hero buttons
// missing the base prefix (404s), and 65 cross-references written as backtick
// code spans that were never links at all. Both were invisible to the build,
// which happily succeeds with dead links.
//
// Exits non-zero on any broken link so CI fails loudly.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const BASE = '/fusion-manage-plm-docs';

if (!existsSync(DIST)) {
	console.error(`No ${DIST}/ directory — run \`npm run build\` first.`);
	process.exit(1);
}

function walk(dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) out.push(...walk(full));
		else out.push(full);
	}
	return out;
}

const allFiles = walk(DIST);
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));

// The set of URL paths the site actually serves.
const served = new Set();
for (const f of allFiles) {
	const rel = relative(DIST, f).split(/[\\/]/).join('/');
	served.add(`${BASE}/${rel}`); // e.g. /base/llms.txt
	if (rel.endsWith('/index.html')) {
		const dir = rel.slice(0, -'index.html'.length); // trailing slash kept
		served.add(`${BASE}/${dir}`);
		served.add(`${BASE}/${dir}`.replace(/\/$/, ''));
	}
}
served.add(`${BASE}/`);
served.add(BASE);

// Both `href` and `src`: a dangling <script src> or <img src> is just as broken
// as a dead link, and checking only href is how the missing favicon shipped.
const refRe = /(?:href|src)="([^"]+)"/g;
let broken = 0;
let checked = 0;

for (const file of htmlFiles) {
	const html = readFileSync(file, 'utf8');
	const page = '/' + relative(DIST, file).split(/[\\/]/).join('/');
	const seen = new Set();

	for (const m of html.matchAll(refRe)) {
		let href = m[1];
		if (seen.has(href)) continue;
		seen.add(href);

		// Skip external, anchors, and non-http schemes.
		if (/^(https?:)?\/\//.test(href)) continue;
		if (/^(#|mailto:|tel:|data:|javascript:)/.test(href)) continue;

		// Strip fragment and query.
		href = href.replace(/[#?].*$/, '');
		if (!href) continue;

		// Only validate absolute in-site paths; relative ones are rare here.
		if (!href.startsWith('/')) continue;

		checked++;

		// Catch the specific bug class: an internal link that forgot the base.
		if (!href.startsWith(`${BASE}/`) && href !== BASE) {
			console.error(`BROKEN (missing base) ${page}\n    -> ${href}`);
			broken++;
			continue;
		}

		if (!served.has(href) && !served.has(href.replace(/\/$/, ''))) {
			console.error(`BROKEN (no such page) ${page}\n    -> ${href}`);
			broken++;
		}
	}
}

console.log(
	`Link check: ${checked} internal links across ${htmlFiles.length} pages, ${broken} broken.`,
);
process.exit(broken ? 1 : 0);
