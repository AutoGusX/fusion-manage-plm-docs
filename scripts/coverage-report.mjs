#!/usr/bin/env node
// Compares endpoints in Autodesk's official Postman collection against the
// endpoints actually documented on this site, and reports the gap.
//
// Answers the spec's remaining acceptance criterion ("every endpoint in the
// Postman collection has a corresponding reference page") with a number
// instead of a guess.
//
// Usage: node scripts/coverage-report.mjs [path-to-collection.json]
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const COLLECTION =
	process.argv[2] ||
	'C:\\Users\\quadeg\\Downloads\\Fusion Manage REST API.postman_collection.json';
const DOCS = 'src/content/docs';

/** Reduce a URL to a comparable shape: METHOD /api/v3/workspaces/{}/items */
function normalize(method, rawUrl) {
	let u = String(rawUrl)
		.replace(/^\{\{\s*Base URL\s*\}\}/i, '') // the collection's base-url var
		.replace(/\{\{[^}]+\}\}/g, '{}') // remaining postman vars
		.replace(/^https?:\/\/[^/]+/, '') // origin
		.replace(/\?.*$/, '') // query
		.replace(/\/+$/, '') // trailing slash
		.replace(/^\/api\/\/+/, '/api/'); // collection has one `/api//v3/...` typo
	if (!u.startsWith('/api')) return null; // skip non-PLM (APS webhooks, graphql)
	u = u
		.replace(/\/\d+/g, '/{}') // numeric ids
		.replace(/\/[A-Z][A-Z0-9_]{3,}\b/g, '/{}'); // SCREAMING_CASE ids
	// Opaque IDs directly after a known collection segment (user ids like
	// `c9Ec1`, `asMpd`, `8HVEA` are mixed-case and otherwise unrecognizable).
	u = u.replace(
		/\/(users|groups|roles|items|workspaces|scripts|reports)\/(?!@me\b)[A-Za-z0-9]{3,}\b/g,
		'/$1/{}',
	);
	return `${method.toUpperCase()} ${u}`;
}

// --- collect endpoints from the Postman collection ---
const fromCollection = new Map(); // normalized -> example name
if (!existsSync(COLLECTION)) {
	console.error(`Collection not found: ${COLLECTION}`);
	console.error('Pass a path as the first argument.');
	process.exit(2);
}
const data = JSON.parse(readFileSync(COLLECTION, 'utf8'));
(function walkItems(items) {
	for (const it of items || []) {
		if (it.item) {
			walkItems(it.item);
			continue;
		}
		const req = it.request;
		if (!req) continue;
		const url = typeof req.url === 'object' ? req.url?.raw : req.url;
		if (!url) continue;
		const key = normalize(req.method || 'GET', url);
		if (key && !fromCollection.has(key)) fromCollection.set(key, it.name);
	}
})(data.item);

// --- collect endpoints mentioned anywhere in the docs ---
function walk(dir) {
	const out = [];
	for (const n of readdirSync(dir)) {
		const f = join(dir, n);
		if (statSync(f).isDirectory()) out.push(...walk(f));
		else if (/\.mdx?$/.test(n)) out.push(f);
	}
	return out;
}

const documented = new Set();
const METHODS = 'GET|POST|PUT|PATCH|DELETE';
for (const file of walk(DOCS)) {
	const txt = readFileSync(file, 'utf8');
	// "GET /api/v3/..." possibly inside backticks or a table cell
	for (const m of txt.matchAll(
		new RegExp(`\\b(${METHODS})\\b[\`\\s]*\\s(/api/[^\\s\`|)>,]+)`, 'g'),
	)) {
		const key = normalize(m[1], m[2].replace(/\{[a-zA-Z][^}]*\}/g, '{}'));
		if (key) documented.add(key);
	}
}

const missing = [...fromCollection.entries()].filter(([k]) => !documented.has(k));
const total = fromCollection.size;
const covered = total - missing.length;
const pct = total ? Math.round((covered / total) * 100) : 100;

console.log(
	`Postman endpoints (PLM REST only): ${total}\nDocumented: ${covered} (${pct}%)\nMissing: ${missing.length}\n`,
);
if (missing.length) {
	console.log('Not found in docs:');
	for (const [key, name] of missing.sort()) console.log(`  ${key}\n      (${name})`);
}
