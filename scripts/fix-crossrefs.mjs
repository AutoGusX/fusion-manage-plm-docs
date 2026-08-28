// One-shot maintenance script: convert backtick pseudo-links like
// `api/v3/items` into real markdown links like [Items](/api/v3/items/).
// Skips fenced code blocks. Safe to re-run (already-linked refs are untouched).
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = 'src/content/docs';

// Human-readable link text per target. Deliberately hand-written rather than
// pulled from frontmatter: a few page titles are too long to read well inline.
const TITLES = {
	'concepts/authentication': 'Authentication',
	'concepts/errors': 'Errors',
	'concepts/pagination': 'Pagination',
	'concepts/versioning': 'API Versions',
	'api/v2/classifications': 'Classifications',
	'api/v2/parts-and-classifications': 'Parts and Classifications',
	'api/v2/property-instances': 'Property Instances',
	'api/v3/admin-impersonation': 'Admin Impersonation',
	'api/v3/attachments': 'Attachments',
	'api/v3/bom': 'BOM',
	'api/v3/fusion-components': 'Fusion Components',
	'api/v3/items': 'Items',
	'api/v3/relationships-and-affected-items': 'Relationships and Affected Items',
	'api/v3/reports-dashboards': 'Reports and Dashboards',
	'api/v3/scripts': 'Scripts',
	'api/v3/search': 'Search',
	'api/v3/suppliers': 'Suppliers',
	'api/v3/users-groups-roles': 'Users, Groups, and Roles',
	'api/v3/views-fields-tableaus': 'Views, Fields, and Tableaus',
	'api/v3/webhooks': 'Webhooks',
	'api/v3/workflow': 'Workflow',
	'api/v3/workspaces': 'Workspaces',
	'guides/admin-and-config': 'Admin and Config',
	'guides/authentication-quickstart': 'Authentication Quickstart',
	'guides/change-orders-and-workflow': 'Change Orders and Workflow',
	'guides/scripting': 'Scripting',
	'guides/suppliers': 'Suppliers',
	'guides/working-with-bom': 'Working with BOM',
	'guides/working-with-items': 'Working with Items',
};

function walk(dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) out.push(...walk(full));
		else if (/\.mdx?$/.test(name)) out.push(full);
	}
	return out;
}

const pattern = /`((?:concepts|api|guides)\/[a-z0-9/-]+)`/g;
let totalChanged = 0;
let totalRefs = 0;
const unknown = new Set();

for (const file of walk(DOCS)) {
	const raw = readFileSync(file, 'utf8');
	const lines = raw.split(/\r?\n/);
	let inFence = false;
	let changed = false;

	const outLines = lines.map((line) => {
		if (/^\s*(```|~~~)/.test(line)) {
			inFence = !inFence;
			return line;
		}
		if (inFence) return line;

		return line.replace(pattern, (whole, target) => {
			const title = TITLES[target];
			if (!title) {
				unknown.add(target);
				return whole;
			}
			totalRefs++;
			changed = true;
			return `[${title}](/${target}/)`;
		});
	});

	if (changed) {
		writeFileSync(file, outLines.join('\n'));
		totalChanged++;
	}
}

console.log(`Converted ${totalRefs} cross-references across ${totalChanged} files.`);
if (unknown.size) console.log('UNKNOWN targets (left as-is):', [...unknown]);
