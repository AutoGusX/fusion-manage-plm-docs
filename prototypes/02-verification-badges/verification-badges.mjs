#!/usr/bin/env node
// PROTOTYPE 02 — Verification badges
//
// This doc set's main differentiator is that it distinguishes what was
// *confirmed against a live tenant* from what was merely transcribed out of
// Autodesk's Postman collection or read out of a client's source. Today that
// distinction lives in prose, so you only learn how much to trust a page by
// reading it. This surfaces it as a badge at the top of each page.
//
// Level is inferred from markers already in the prose — no per-page
// frontmatter to maintain, and nothing to keep in sync by hand.
//
// Deliberately writes a plain HTML span with inline styles keyed to Starlight's
// CSS variables: no schema change, no config change, no stylesheet. Adding and
// removing this prototype touches nothing but the marked block in each file.
//
//   node prototypes/02-verification-badges/verification-badges.mjs --apply
//   node prototypes/02-verification-badges/verification-badges.mjs --strip
//   node prototypes/02-verification-badges/verification-badges.mjs          (dry run)
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = 'src/content/docs';
const BEGIN = '<!-- verification-badge:begin -->';
const END = '<!-- verification-badge:end -->';

const mode = process.argv.includes('--apply')
	? 'apply'
	: process.argv.includes('--strip')
		? 'strip'
		: 'dry';

const LEVELS = {
	live: {
		label: 'Verified against a live tenant',
		bg: 'var(--sl-color-green-low)',
		fg: 'var(--sl-color-green-high)',
	},
	official: {
		label: "From Autodesk's official collection — not yet live-verified",
		bg: 'var(--sl-color-blue-low)',
		fg: 'var(--sl-color-blue-high)',
	},
	derived: {
		label: 'Derived from client source — not yet live-verified',
		bg: 'var(--sl-color-orange-low)',
		fg: 'var(--sl-color-orange-high)',
	},
};

/**
 * Verification level per reference page — declared, not inferred.
 *
 * Two automatic approaches were tried and both were wrong in ways that matter:
 * matching body prose badged the webhooks page as verified (it contains the
 * phrase "a confirmed live hook object" while explicitly stating it is *not*
 * live-tested), and matching only structured aside titles under-claimed pages
 * like Items, whose live confirmations are written as prose sections. For a
 * signal whose entire purpose is telling the reader how much to trust a page,
 * a heuristic that is quietly wrong is worse than no badge at all.
 *
 * So this is a curated map, reflecting what was actually exercised against a
 * live tenant. Guides are intentionally absent: they are walkthroughs that
 * defer to the reference pages, so a per-guide trust badge would be noise.
 */
const LEVEL_BY_PAGE = {
	// Confirmed against a live tenant.
	'concepts/authentication.md': 'live',
	'concepts/errors.md': 'live',
	'concepts/pagination.md': 'live',
	'concepts/versioning.md': 'live',
	'api/v3/items.md': 'live',
	'api/v3/bom.md': 'live',
	'api/v3/search.md': 'live',
	'api/v3/workflow.md': 'live',
	'api/v3/workspaces.md': 'live',
	'api/v3/suppliers.md': 'live',
	'api/v3/relationships-and-affected-items.md': 'live',
	'api/v3/views-fields-tableaus.md': 'live',
	'api/v3/users-groups-roles.md': 'live',
	'api/v2/classifications.md': 'live',
	'api/v2/parts-and-classifications.md': 'live',

	// Straight from Autodesk's official collection; endpoint shapes not yet
	// exercised here.
	'api/v3/attachments.md': 'official',
	'api/v3/webhooks.md': 'official',
	'api/v3/fusion-components.md': 'official',

	// Read out of production client source.
	'api/v3/scripts.md': 'derived',
	'api/v3/reports-dashboards.md': 'derived',
	'api/v3/admin-impersonation.md': 'derived',
	'api/v2/property-instances.md': 'derived',
};

function walk(dir) {
	const out = [];
	for (const n of readdirSync(dir)) {
		const f = join(dir, n);
		if (statSync(f).isDirectory()) out.push(...walk(f));
		else if (/\.mdx?$/.test(n)) out.push(f);
	}
	return out;
}

function badgeHtml(level) {
	const { label, bg, fg } = LEVELS[level];
	return (
		`${BEGIN}\n` +
		`<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;` +
		`border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;` +
		`background:${bg};color:${fg}">${label}</span></p>\n` +
		`${END}`
	);
}

/** Remove any previously injected badge, so this is idempotent. */
function stripBadge(text) {
	const re = new RegExp(
		`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n*`,
		'g',
	);
	return text.replace(re, '');
}

let applied = 0;
let stripped = 0;
const summary = { live: 0, official: 0, derived: 0, none: 0 };
const unmapped = [];

for (const file of walk(DOCS)) {
	const raw = readFileSync(file, 'utf8');
	const fmMatch = raw.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)([\s\S]*)$/);
	if (!fmMatch) continue;
	const [, frontmatter, rest] = fmMatch;

	const cleanBody = stripBadge(rest);

	if (mode === 'strip') {
		if (cleanBody !== rest) {
			writeFileSync(file, frontmatter + cleanBody);
			stripped++;
		}
		continue;
	}

	const rel = file.replace(/\\/g, '/').replace(`${DOCS}/`, '');
	const level = LEVEL_BY_PAGE[rel];
	summary[level ?? 'none']++;
	if (!level) {
		// Flag new reference pages so an unbadged page is a visible decision
		// rather than a silent omission. Guides and generated pages are exempt.
		if (rel.startsWith('api/') || rel.startsWith('concepts/')) unmapped.push(rel);
		continue;
	}

	if (mode === 'apply') {
		// The blank line after the badge is required, not cosmetic: without it
		// markdown treats the following paragraph as a continuation of the raw
		// HTML block, so inline code and links in it render as literal text.
		writeFileSync(
			file,
			`${frontmatter}\n${badgeHtml(level)}\n\n${cleanBody.replace(/^\n+/, '')}`,
		);
		applied++;
	}
}

if (mode === 'strip') console.log(`[prototype 02] Stripped badges from ${stripped} files.`);
else if (mode === 'apply') console.log(`[prototype 02] Applied badges to ${applied} files.`);
else console.log('[prototype 02] Dry run — pass --apply to write, --strip to remove.');
if (mode !== 'strip') {
	console.log('  levels:', summary);
	if (unmapped.length)
		console.log(
			`  NOTE: ${unmapped.length} reference page(s) have no declared level:\n    ${unmapped.join('\n    ')}`,
		);
}
