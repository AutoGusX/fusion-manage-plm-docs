#!/usr/bin/env node
// PROTOTYPE 03 — OpenAPI spec
//
// Emits an OpenAPI 3.1 document describing the endpoints documented on this
// site. Makes the doc set machine-consumable: import into Postman/Insomnia,
// generate a typed client, or point an agent at it.
//
// Scope, stated honestly: this is a *path-and-method* spec, not a full schema
// spec. Request/response bodies in these docs are worked examples in prose,
// not formal schemas, and inventing JSON Schema from them would produce
// confident-looking fiction. Every operation therefore carries a description
// and a link to the page that documents it, where the real shapes live.
//
// Output is written to public/ so it ships with the site.
// See prototypes/README.md for enable/disable instructions.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = 'src/content/docs';
const OUT = 'public/openapi.json';
const SITE = 'https://autogusx.github.io/fusion-manage-plm-docs';
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

function frontmatter(txt) {
	const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!m) return {};
	const get = (k) => {
		const r = m[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
		return r ? r[1].trim().replace(/^["']|["']$/g, '') : undefined;
	};
	return { title: get('title'), description: get('description') };
}

/** `/api/v3/workspaces/{ws}/items/{itemId}` -> OpenAPI path + param names. */
function toOpenApiPath(raw) {
	const path = raw.replace(/\?.*$/, '');
	const params = [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
	return { path, params };
}

const paths = {};
const tagSet = new Map();

for (const file of walk(DOCS)) {
	const rel = file.replace(/\\/g, '/').replace(`${DOCS}/`, '');
	if (rel.startsWith('reference/')) continue; // generated index, not a source
	const txt = readFileSync(file, 'utf8');
	const fm = frontmatter(txt);
	const pageUrl = `${SITE}/${rel.replace(/\.mdx?$/, '')}/`;
	const tag = fm.title || rel;
	if (!tagSet.has(tag)) tagSet.set(tag, { name: tag, description: fm.description, pageUrl });

	for (const m of txt.matchAll(
		new RegExp(`\\b(${METHODS})\\b\\s+(/api/[^\\s\`|)>,"']+)`, 'g'),
	)) {
		const method = m[1].toLowerCase();
		const rawPath = m[2].replace(/[.,;:]+$/, '');
		const { path, params } = toOpenApiPath(rawPath);
		if (!path.startsWith('/api/')) continue;

		paths[path] ??= {};
		if (paths[path][method]) continue; // first documenting page wins

		// Query string present in the doc example, surfaced as optional params.
		const queryKeys = [...rawPath.matchAll(/[?&]([A-Za-z][\w.[\]]*)=/g)].map((q) => q[1]);

		paths[path][method] = {
			tags: [tag],
			summary: `${m[1]} ${path}`,
			description: `Documented in **${tag}** — ${pageUrl}`,
			externalDocs: { description: tag, url: pageUrl },
			parameters: [
				...params.map((p) => ({
					name: p,
					in: 'path',
					required: true,
					schema: { type: 'string' },
				})),
				...[...new Set(queryKeys)].map((q) => ({
					name: q,
					in: 'query',
					required: false,
					schema: { type: 'string' },
				})),
			],
			responses: {
				'2XX': {
					description:
						'Success. Status codes vary by operation and are not uniform across this API ' +
						'(e.g. item create returns 201 with an empty body and a Location header; ' +
						'workflow transitions return 303). See the linked page.',
				},
			},
		};
	}
}

const spec = {
	openapi: '3.1.0',
	info: {
		title: 'Autodesk Fusion Manage PLM API (community reference)',
		version: '0.1.0',
		summary: 'Path-and-method spec generated from the Fusion Manage PLM Docs site.',
		description: [
			'Unofficial, community-maintained. Generated from the documented endpoints at',
			`${SITE}.`,
			'',
			'**Scope:** paths, methods, and path/query parameters only. Request and response',
			'bodies are documented as worked examples in prose on the linked pages rather than',
			'as formal schemas — they are deliberately not invented here. Use each operation\'s',
			'`externalDocs` link for the real payload shapes, confirmed status codes, and caveats.',
			'',
			'**Auth:** all endpoints take an OAuth2 bearer token plus an `x-tenant` header.',
		].join('\n'),
		license: { name: 'Community reference — not an Autodesk product' },
	},
	servers: [
		{
			url: 'https://{tenant}.autodeskplm360.net',
			description: 'Fusion Manage tenant. Both v1 and v3 live on this host.',
			variables: { tenant: { default: 'your-tenant' } },
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
		},
		parameters: {
			tenantHeader: {
				name: 'x-tenant',
				in: 'header',
				required: true,
				schema: { type: 'string' },
				description: "The tenant's subdomain.",
			},
		},
	},
	security: [{ bearerAuth: [] }],
	tags: [...tagSet.values()].map((t) => ({
		name: t.name,
		description: t.description,
		externalDocs: { url: t.pageUrl },
	})),
	paths,
};

const opCount = Object.values(paths).reduce((n, ops) => n + Object.keys(ops).length, 0);
writeFileSync(OUT, JSON.stringify(spec, null, 2) + '\n');
console.log(
	`[prototype 03] Wrote ${OUT}: ${Object.keys(paths).length} paths, ${opCount} operations, ${spec.tags.length} tags.`,
);
