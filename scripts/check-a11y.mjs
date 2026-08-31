#!/usr/bin/env node
// Lightweight accessibility and structure audit of the built site.
//
// Not a substitute for a real axe run in a browser — it checks the handful of
// things that are (a) detectable from static HTML and (b) actually plausible in
// a docs site: missing image alt text, skipped heading levels, and pages with
// no or multiple h1s. Those are the ones authoring mistakes cause.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
if (!existsSync(DIST)) {
	console.error(`No ${DIST}/ — run \`npm run build\` first.`);
	process.exit(1);
}

function walk(dir) {
	const out = [];
	for (const n of readdirSync(dir)) {
		const f = join(dir, n);
		if (statSync(f).isDirectory()) out.push(...walk(f));
		else if (f.endsWith('.html')) out.push(f);
	}
	return out;
}

const problems = [];

for (const file of walk(DIST)) {
	const page = relative(DIST, file).split(/[\\/]/).join('/');
	const html = readFileSync(file, 'utf8');

	// <img> with no alt attribute at all (alt="" is valid for decorative).
	for (const m of html.matchAll(/<img(?![^>]*\balt=)[^>]*>/g)) {
		problems.push(`${page}: <img> without alt — ${m[0].slice(0, 70)}`);
	}

	// Heading hierarchy inside the article body only; Starlight's chrome has its
	// own headings that legitimately sit outside the content's order.
	const body = html.match(/<div class="sl-markdown-content[\s\S]*?(?=<\/article|<footer)/);
	if (body) {
		const levels = [...body[0].matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
		for (let i = 1; i < levels.length; i++) {
			if (levels[i] - levels[i - 1] > 1) {
				problems.push(`${page}: heading level skip h${levels[i - 1]} -> h${levels[i]}`);
			}
		}
	}

	const h1s = [...html.matchAll(/<h1\b/g)].length;
	if (h1s === 0) problems.push(`${page}: no <h1>`);
	if (h1s > 1) problems.push(`${page}: ${h1s} <h1> elements (expected 1)`);

	// Links whose only content is a bare URL read poorly in a screen reader.
	for (const m of html.matchAll(/<a\b[^>]*>\s*(https?:\/\/[^<\s]+)\s*<\/a>/g)) {
		problems.push(`${page}: link text is a bare URL — ${m[1].slice(0, 60)}`);
	}
}

if (problems.length) {
	console.log(`Accessibility audit: ${problems.length} issue(s)\n`);
	for (const p of problems) console.log(`  ${p}`);
} else {
	console.log('Accessibility audit: no issues found.');
}
// Advisory only — does not fail the build.
