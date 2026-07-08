// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// GitHub Pages project-site URLs: https://<user>.github.io/<repo>/
export default defineConfig({
	site: 'https://autogusx.github.io',
	base: '/fusion-manage-plm-docs',
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
			],
		}),
	],
});
