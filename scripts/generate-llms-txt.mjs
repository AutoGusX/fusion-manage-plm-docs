#!/usr/bin/env node
// Walks src/content/docs and emits public/llms.txt + public/llms-full.txt
// per the llms.txt convention (https://llmstxt.org), so an AI agent can
// fetch a compact index (or the full corpus) without crawling the site.
//
// Keep SITE_ORIGIN/BASE_PATH in sync with astro.config.mjs's `site`/`base`.

import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DOCS_DIR = join(ROOT, 'src', 'content', 'docs');
const PUBLIC_DIR = join(ROOT, 'public');

const SITE_ORIGIN = 'https://autogusx.github.io';
const BASE_PATH = '/fusion-manage-plm-docs';

const SITE_TITLE = 'Fusion Manage PLM Docs';
const SITE_SUMMARY =
	'Human- and AI-readable reference for the Autodesk Fusion Manage PLM API (v2 and v3).';

const SECTION_ORDER = [
	{ dir: 'concepts', label: 'Concepts' },
	{ dir: 'api/v3', label: 'API Reference — v3' },
	{ dir: 'api/v2', label: 'API Reference — v2' },
	{ dir: 'guides', label: 'Guides' },
];

function walk(dir) {
	const entries = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) {
			entries.push(...walk(full));
		} else if (name.endsWith('.md') || name.endsWith('.mdx')) {
			entries.push(full);
		}
	}
	return entries;
}

function parseFrontmatter(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) return { frontmatter: {}, body: raw };
	const [, fmBlock, body] = match;
	const frontmatter = {};
	for (const line of fmBlock.split(/\r?\n/)) {
		const kv = line.match(/^(\w+):\s*(.*)$/);
		if (!kv) continue;
		const [, key, rawValue] = kv;
		frontmatter[key] = rawValue.trim().replace(/^["']|["']$/g, '');
	}
	return { frontmatter, body };
}

function urlForFile(filePath) {
	const rel = relative(DOCS_DIR, filePath).split(sep).join('/');
	let slug = rel.replace(/\.mdx?$/, '');
	if (slug === 'index') slug = '';
	else if (slug.endsWith('/index')) slug = slug.slice(0, -'/index'.length);
	const path = slug ? `${BASE_PATH}/${slug}/` : `${BASE_PATH}/`;
	return `${SITE_ORIGIN}${path}`;
}

function sectionFor(filePath) {
	const rel = relative(DOCS_DIR, filePath).split(sep).join('/');
	for (const section of SECTION_ORDER) {
		if (rel === `${section.dir}/index.md` || rel.startsWith(`${section.dir}/`)) {
			return section.label;
		}
	}
	return null; // root index.mdx and anything uncategorized
}

function main() {
	const files = walk(DOCS_DIR).sort();
	const pages = files.map((filePath) => {
		const raw = readFileSync(filePath, 'utf8');
		const { frontmatter, body } = parseFrontmatter(raw);
		if (!frontmatter.title || !frontmatter.description) {
			throw new Error(
				`${relative(ROOT, filePath)} is missing required frontmatter "title" and/or "description" — every page must have both for llms.txt.`,
			);
		}
		return {
			title: frontmatter.title,
			description: frontmatter.description,
			url: urlForFile(filePath),
			section: sectionFor(filePath),
			body: body.trim(),
		};
	});

	const bySection = new Map(SECTION_ORDER.map((s) => [s.label, []]));
	for (const page of pages) {
		if (page.section && bySection.has(page.section)) {
			bySection.get(page.section).push(page);
		}
	}

	const lines = [`# ${SITE_TITLE}`, '', `> ${SITE_SUMMARY}`, ''];
	const fullLines = [`# ${SITE_TITLE}`, '', `> ${SITE_SUMMARY}`, ''];

	for (const section of SECTION_ORDER) {
		const sectionPages = bySection.get(section.label);
		if (sectionPages.length === 0) continue;
		lines.push(`## ${section.label}`, '');
		fullLines.push(`## ${section.label}`, '');
		for (const page of sectionPages) {
			lines.push(`- [${page.title}](${page.url}): ${page.description}`);
			fullLines.push(`### ${page.title}`, '', `${page.url}`, '', page.body, '');
		}
		lines.push('');
	}

	mkdirSync(PUBLIC_DIR, { recursive: true });
	writeFileSync(join(PUBLIC_DIR, 'llms.txt'), lines.join('\n').trimEnd() + '\n');
	writeFileSync(join(PUBLIC_DIR, 'llms-full.txt'), fullLines.join('\n').trimEnd() + '\n');

	console.log(`Generated llms.txt / llms-full.txt from ${pages.length} pages.`);
}

main();
