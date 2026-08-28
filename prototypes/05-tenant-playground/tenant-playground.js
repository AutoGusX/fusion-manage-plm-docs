/**
 * PROTOTYPE 05 — Tenant playground
 *
 * Every code sample on this site is written against `{tenant}`. That is correct
 * for documentation and mildly annoying in practice: to actually run anything
 * you hand-edit each snippet. This lets a reader set their tenant once and have
 * every sample on every page become copy-paste-ready, and adds a copy button to
 * each code block.
 *
 * Useful in a demo too: set the prospect's tenant and the docs are speaking
 * their language rather than a placeholder's.
 *
 * Vanilla JS, no dependencies, no build step. Self-contained and defensive: if
 * anything here throws, the page is still a perfectly good static doc page.
 *
 * See prototypes/README.md for enable/disable instructions.
 */
(() => {
	'use strict';

	const KEY = 'fmpd:tenant';
	const PLACEHOLDER = /\{tenant\}/g;

	/** Only sensible tenant subdomains; keeps injected text harmless. */
	const VALID = /^[a-z0-9][a-z0-9-]{1,62}$/i;

	const read = () => {
		try {
			return localStorage.getItem(KEY) || '';
		} catch {
			return ''; // private mode / storage disabled
		}
	};
	const write = (v) => {
		try {
			v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY);
		} catch {
			/* non-fatal */
		}
	};

	/**
	 * Swap tenant into code blocks.
	 *
	 * The original text is stashed on the node the first time it is touched, so
	 * switching tenants (or clearing the field) always re-derives from the
	 * pristine source rather than substituting into already-substituted text.
	 */
	function applyTenant(tenant) {
		const blocks = document.querySelectorAll('.sl-markdown-content pre code');
		for (const block of blocks) {
			for (const node of textNodesOf(block)) {
				if (node.__fmOriginal === undefined) {
					if (!PLACEHOLDER.test(node.nodeValue)) continue;
					node.__fmOriginal = node.nodeValue;
				}
				node.nodeValue = tenant
					? node.__fmOriginal.replace(PLACEHOLDER, tenant)
					: node.__fmOriginal;
			}
		}
	}

	function textNodesOf(root) {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		const out = [];
		let n;
		while ((n = walker.nextNode())) out.push(n);
		return out;
	}

	function addCopyButtons() {
		for (const pre of document.querySelectorAll('.sl-markdown-content pre')) {
			if (pre.querySelector('[data-fm-copy]')) continue;
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.dataset.fmCopy = '';
			btn.textContent = 'Copy';
			btn.setAttribute('aria-label', 'Copy code to clipboard');
			Object.assign(btn.style, {
				position: 'absolute',
				top: '0.5rem',
				right: '0.5rem',
				padding: '0.15rem 0.5rem',
				fontSize: '0.75rem',
				borderRadius: '0.25rem',
				border: '1px solid var(--sl-color-gray-5)',
				background: 'var(--sl-color-gray-6)',
				color: 'var(--sl-color-white)',
				cursor: 'pointer',
				opacity: '0.75',
			});
			btn.addEventListener('click', async () => {
				const code = pre.querySelector('code');
				try {
					await navigator.clipboard.writeText(code ? code.innerText : pre.innerText);
					btn.textContent = 'Copied';
				} catch {
					btn.textContent = 'Press Ctrl+C';
				}
				setTimeout(() => (btn.textContent = 'Copy'), 1500);
			});
			if (getComputedStyle(pre).position === 'static') pre.style.position = 'relative';
			pre.appendChild(btn);
		}
	}

	function mountControl() {
		const content = document.querySelector('.sl-markdown-content');
		if (!content) return;
		// Only worth showing where there is actually something to substitute.
		if (!/\{tenant\}/.test(content.textContent || '')) return;
		if (document.getElementById('fm-tenant-control')) return;

		const wrap = document.createElement('div');
		wrap.id = 'fm-tenant-control';
		Object.assign(wrap.style, {
			display: 'flex',
			alignItems: 'center',
			gap: '0.5rem',
			flexWrap: 'wrap',
			margin: '0 0 1.25rem',
			padding: '0.6rem 0.75rem',
			borderRadius: '0.5rem',
			border: '1px solid var(--sl-color-gray-5)',
			background: 'var(--sl-color-gray-6)',
			fontSize: '0.875rem',
		});

		const label = document.createElement('label');
		label.textContent = 'Your tenant:';
		label.htmlFor = 'fm-tenant-input';
		label.style.fontWeight = '600';

		const input = document.createElement('input');
		input.id = 'fm-tenant-input';
		input.type = 'text';
		input.placeholder = 'your-tenant';
		input.spellcheck = false;
		input.autocapitalize = 'none';
		input.value = read();
		Object.assign(input.style, {
			padding: '0.2rem 0.45rem',
			borderRadius: '0.25rem',
			border: '1px solid var(--sl-color-gray-5)',
			background: 'var(--sl-color-black)',
			color: 'var(--sl-color-white)',
			minWidth: '12rem',
		});

		const hint = document.createElement('span');
		hint.style.color = 'var(--sl-color-gray-3)';
		const setHint = (v) => {
			hint.textContent = v
				? `Samples now use ${v}.autodeskplm360.net`
				: 'Substitutes {tenant} in the samples below. Stored in this browser only.';
		};
		setHint(input.value);

		input.addEventListener('input', () => {
			const v = input.value.trim();
			const ok = v === '' || VALID.test(v);
			input.style.borderColor = ok ? 'var(--sl-color-gray-5)' : 'var(--sl-color-red)';
			if (!ok) {
				hint.textContent = 'Tenant should be a plain subdomain, e.g. acmecorp';
				return;
			}
			write(v);
			applyTenant(v);
			setHint(v);
		});

		wrap.append(label, input, hint);
		content.prepend(wrap);
	}

	function init() {
		try {
			mountControl();
			applyTenant(read());
			addCopyButtons();
		} catch (err) {
			// Never let an enhancement break the page.
			console.warn('[tenant-playground] disabled:', err);
		}
	}

	document.addEventListener('DOMContentLoaded', init);
	// Starlight ships view transitions; re-run after client-side navigation.
	document.addEventListener('astro:page-load', init);
})();
