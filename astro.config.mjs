// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// GitHub Pages project-site URLs: https://<user>.github.io/<repo>/
const BASE = '/fusion-manage-plm-docs';

/**
 * Rewrite root-relative links (e.g. `/api/v3/items/`) in markdown content so
 * they include the site base.
 *
 * Astro does NOT base-prefix links written inside markdown — a bare
 * `/api/v3/items/` ships as-is and 404s on a project-site deploy. This is the
 * same class of bug that broke the homepage hero buttons. Rather than hardcode
 * the base into every cross-reference, markdown keeps clean root-relative
 * paths and this rewrites them at build time, so the base stays defined once
 * (above) and is impossible to forget.
 *
 * Dependency-free on purpose: a hand-rolled walk avoids adding
 * `unist-util-visit` just for this.
 */
function rehypeBaseLinks() {
	/** @param {any} node */
	const walk = (node) => {
		if (node.type === 'element' && node.tagName === 'a') {
			const href = node.properties?.href;
			if (
				typeof href === 'string' &&
				href.startsWith('/') &&
				!href.startsWith('//') && // protocol-relative external
				href !== BASE &&
				!href.startsWith(`${BASE}/`) // already prefixed
			) {
				node.properties.href = BASE + href;
			}
		}
		if (Array.isArray(node.children)) node.children.forEach(walk);
	};
	return walk;
}

export default defineConfig({
	site: 'https://autogusx.github.io',
	base: BASE,
	markdown: {
		rehypePlugins: [rehypeBaseLinks],
	},
	integrations: [
		starlight({
			title: 'Fusion Manage PLM Docs',
			description:
				'Human- and AI-readable reference for the Autodesk Fusion Manage PLM API (v2 + v3).',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/AutoGusX/fusion-manage-plm-docs',
				},
			],
			sidebar: [
				{
					label: 'Concepts',
					items: [{ autogenerate: { directory: 'concepts' } }],
				},
				{
					label: 'API Reference — v3',
					items: [{ autogenerate: { directory: 'api/v3' } }],
				},
				{
					label: 'API Reference — v2',
					items: [{ autogenerate: { directory: 'api/v2' } }],
				},
				{
					label: 'Guides',
					items: [{ autogenerate: { directory: 'guides' } }],
				},
				// --- PROTOTYPE 01 (endpoint index): remove this group to disable ---
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
				// --- end PROTOTYPE 01 ---
			],
		}),
	],
});
