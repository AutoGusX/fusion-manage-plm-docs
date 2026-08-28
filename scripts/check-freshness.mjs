#!/usr/bin/env node
// Reports how stale each page's live verification is.
//
// The spec names staleness as a standing risk: nothing here syncs
// automatically when Autodesk changes the API, so without a review cadence this
// set quietly rots while still reading as authoritative. That is the worst
// failure mode for a doc set whose selling point is "this was actually tested".
//
// Pages record verification dates inline as `Confirmed live — YYYY-MM-DD`.
// This finds the most recent one per page and flags anything past the
// threshold, so a review cadence has something concrete to work from.
//
//   npm run check:freshness            # default: warn after 180 days
//   node scripts/check-freshness.mjs --days 90
//   node scripts/check-freshness.mjs --strict   # exit 1 if anything is stale
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = 'src/content/docs';
const argv = process.argv.slice(2);
const daysIdx = argv.indexOf('--days');
const THRESHOLD = daysIdx !== -1 ? Number(argv[daysIdx + 1]) : 180;
const STRICT = argv.includes('--strict');

function walk(dir) {
	const out = [];
	for (const n of readdirSync(dir)) {
		const f = join(dir, n);
		if (statSync(f).isDirectory()) out.push(...walk(f));
		else if (/\.mdx?$/.test(n)) out.push(f);
	}
	return out;
}

const DATE_RE = /(\d{4})-(\d{2})-(\d{2})/g;
const today = new Date();
const rows = [];

for (const file of walk(DOCS)) {
	const rel = file.replace(/\\/g, '/').replace(`${DOCS}/`, '');
	if (rel.startsWith('reference/')) continue; // generated
	const txt = readFileSync(file, 'utf8');

	// Only dates attached to a verification claim count. A date inside an
	// example payload (`"effectivity": "2025-09-01..."`) says nothing about
	// when the page was last checked.
	const claims = txt
		.split('\n')
		.filter((l) => /confirmed live|verified live|confirmed .*(?:from|by) Autodesk/i.test(l));

	let newest = null;
	for (const line of claims) {
		for (const m of line.matchAll(DATE_RE)) {
			const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
			if (!Number.isNaN(+d) && (!newest || d > newest)) newest = d;
		}
	}

	rows.push({
		page: rel,
		verified: newest,
		age: newest ? Math.floor((today - newest) / 86_400_000) : null,
	});
}

const dated = rows.filter((r) => r.verified).sort((a, b) => b.age - a.age);
const undated = rows.filter((r) => !r.verified);
const stale = dated.filter((r) => r.age > THRESHOLD);

console.log(`Freshness (threshold ${THRESHOLD} days, ${dated.length} pages carry a verification date)\n`);
for (const r of dated) {
	const flag = r.age > THRESHOLD ? 'STALE ' : 'ok    ';
	console.log(`  ${flag} ${String(r.age).padStart(4)}d  ${r.verified.toISOString().slice(0, 10)}  ${r.page}`);
}
if (undated.length) {
	console.log(`\n  ${undated.length} page(s) carry no verification date (guides and`);
	console.log('  transcribed-only references are expected here):');
	for (const r of undated) console.log(`         ${r.page}`);
}
console.log(
	stale.length
		? `\n${stale.length} page(s) past ${THRESHOLD} days — worth re-checking against a live tenant.`
		: `\nNothing past ${THRESHOLD} days.`,
);

process.exit(STRICT && stale.length ? 1 : 0);
