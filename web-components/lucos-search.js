import TomSelect from 'tom-select';
import tomSelectStylesheet from 'tom-select/dist/css/tom-select.default.css';

class LucosSearchComponent extends HTMLSpanElement {
	static get observedAttributes() {
		return ['data-api-key','data-types','data-exclude-types','data-no-lang','data-common','data-preload'];
	}
	constructor() {
		super();
		const component = this;
		const shadow = component.attachShadow({mode: 'open'});

		if (tomSelectStylesheet) {
			const tomStyle = document.createElement('style');
			tomStyle.textContent = tomSelectStylesheet;
			shadow.appendChild(tomStyle);
		}

		const errorMessage = document.createElement('div');
		errorMessage.setAttribute('class', 'search-error');
		errorMessage.setAttribute('hidden', '');
		shadow.appendChild(errorMessage);

		const mainStyle = document.createElement('style');
		mainStyle.textContent = `
			.search-error {
				color: #a00;
				font-size: 0.85em;
				margin-top: 4px;
				padding: 4px 6px;
				border: 1px solid #e0a0a0;
				background: #fff5f5;
				border-radius: 3px;
			}
			.lozenge {
				align-items: center;
				vertical-align: baseline;
				border-radius: 3px;
				background-repeat: repeat-x;
				border-style: solid;
				border-width: 1px;
				text-shadow: 0 1px 0 rgba(0, 51, 83, 0.3);
				box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2), inset 0 1px rgba(255, 255, 255, 0.03);

				/** Make the colour settings !important so they override the tom-select default style **/
				background-image: linear-gradient(to bottom, #ffffff63, #24232347) !important;
				background-color: var(--lozenge-background) !important;
				border-color: var(--lozenge-border) !important;
				color: var(--lozenge-text) !important;
			}
			.lozenge .remove {
				border-left-color: var(--lozenge-border) !important;
			}

			/* Default colour to greys, but override based on category */
			.lozenge {
				--lozenge-background: #555;
				--lozenge-border: #6d6d6d;
				--lozenge-text: #fff;
			}
			.lozenge[data-category="Musical"] {
				--lozenge-background: #000060;
				--lozenge-border: #000020;
			}
			.lozenge[data-category="People"] {
				--lozenge-background: #044E00;
				--lozenge-border: #033100;
			}
			.lozenge[data-category="Aquatic"] {
				--lozenge-background: #0085fe;
				--lozenge-border: #0036b1;
			}
			.lozenge[data-category="Terrestrial"] {
				--lozenge-background: #652c17;
				--lozenge-border: #321200;
			}
			.lozenge[data-category="Cosmic"] {
				--lozenge-background: #15163a;
				--lozenge-border: #000000;
				--lozenge-text: #feffe8;
			}
			.lozenge[data-category="Anthropogeographical"] {
				--lozenge-background: #aed0db;
				--lozenge-border: #3f6674;
				--lozenge-text: #0c1a1b;
			}
			.lozenge[data-category="Supernatural"] {
				--lozenge-background: #f1ff5f;
				--lozenge-border: #674800;
				--lozenge-text: #352005;
			}
			.lozenge[data-category="Historical"] {
				--lozenge-background: #740909;
				--lozenge-border: #470202;
			}
			.lozenge[data-category="Mathematical"] {
				--lozenge-background: #f53b0e;
				--lozenge-border: #7e3d2e;
				--lozenge-text: #fff;
			}
			.lozenge[data-category="Temporal"] {
				--lozenge-background: #fffc33;
				--lozenge-border: #7f7e00;
				--lozenge-text: #0f0f00;
			}
			.lozenge[data-category="Anthropological"] {
				--lozenge-background: #8affe7;
				--lozenge-border: #068900;
				--lozenge-text: #000000;
			}
			.lozenge[data-category="Technological"] {
				--lozenge-background: #c70f7a;
				--lozenge-border: #8f125b;
				--lozenge-text: #fff;
			}
			.lozenge[data-category="Meteorological"] {
				--lozenge-background: #fff;
				--lozenge-border: #333;
				--lozenge-text: #000;
			}
			.lozenge[data-category="Literary"] {
				--lozenge-background: #a22400;
				--lozenge-border: #5e1500;
				--lozenge-text: #fff;
			}
			.lozenge[data-category="Dramaturgical"] {
				--lozenge-background: #5f0086;
				--lozenge-border: #59007d;
				--lozenge-text: #fff;
			}

			.lozenge.active {
				--lozenge-border: #b00;
			}
			.type {
				margin: 0 3px;
				padding: 2px 6px;
			}
			.ts-dropdown {
				margin: 0;
			}
			.lozenge a {
				color: inherit;
				text-decoration: none;
			}
		`;
		shadow.appendChild(mainStyle);


		const selector = component.querySelector("select");
		if (!selector) throw new Error("Can't find select element in lucos-search");
		selector.setAttribute("multiple", "multiple");
		new TomSelect(selector, {
			...(component.isLanguageMode || component.getAttribute("data-common") ? { optgroupField: 'lang_family', lockOptgroupOrder: true } : {}),
			valueField: 'id',
			labelField: 'pref_label',
			searchField: [],
			closeAfterSelect: true,
			highlight: false, // Will use typesense's hightlight (as it can consider other fields)
			load: async function(query, callback) {
				// Cancel any in-flight search so stale responses don't overwrite newer results
				if (component._searchAbortController) {
					component._searchAbortController.abort();
				}
				const abortController = new AbortController();
				component._searchAbortController = abortController;

				errorMessage.setAttribute('hidden', '');
				const commonSet = new Set((component._commonOptions || []).map(o => o.id));
				const noLang = component.noLangOption;
				const noLangIsCommon = noLang && commonSet.has(noLang.id);
				// When preloaded, filter locally instead of hitting Typesense
				if (component._preloadedOptions) {
					const q = query.toLowerCase();
					let results = q
						? component._preloadedOptions.filter(r =>
							r.pref_label.toLowerCase().includes(q) ||
							(r.labels && r.labels.some(l => l.toLowerCase().includes(q)))
						  )
						: [...component._preloadedOptions];
					results = results.filter(r => !commonSet.has(r.id));
					this.clearOptions();
					if (component._commonOptions) component._commonOptions.forEach(opt => this.addOption(opt));
					if (noLang && !noLangIsCommon) results.unshift(noLang);
					callback(results);
					return;
				}
				const queryParams = new URLSearchParams({
					q: query,
				});
				if (component.getAttribute("data-types")) {
					queryParams.set("filter_by",`type:=[${component.getAttribute("data-types")}]`);
				} else if (component.getAttribute("data-exclude_types")) {
					queryParams.set("filter_by",`type:!=[${component.getAttribute("data-exclude_types")}]`);
				}
				try {
					let results = await component.searchRequest(queryParams, abortController.signal);
					if (abortController.signal.aborted) return;
					this.clearOptions();
					// Remove common items from results to avoid duplication (they're always shown separately)
					if (component._commonOptions) {
						results = results.filter(r => !commonSet.has(r.id));
						component._commonOptions.forEach(opt => this.addOption(opt));
					}
					// Don't add noLang as standalone if it's already covered by a common item
					if (noLang && !noLangIsCommon) results.unshift(noLang);
					callback(results);
				} catch(err) {
					if (err.name === 'AbortError') return;
					callback([]);
					errorMessage.textContent = err.userMessage || 'Search is currently unavailable — please try again later.';
					errorMessage.removeAttribute('hidden');
				}
			},
			plugins: {
				remove_button:{
					title:'Remove this item',
				},
				drag_drop: {},
			},
			onItemAdd: function() { // Workaround until https://github.com/orchidjs/tom-select/pull/945 is merged/released
				this.setTextboxValue('');
				this.refreshOptions();
			},
			onFocus: function() {
				this.clearOptions();
				const commonSet = new Set((component._commonOptions || []).map(o => o.id));
				// Re-add common items first so they own any shared IDs (e.g. zxx in both data-no-lang and data-common)
				if (component._commonOptions) {
					component._commonOptions.forEach(opt => this.addOption(opt));
				}
				const noLang = component.noLangOption;
				// Skip noLang if its ID is already a common item (would be silently discarded as a duplicate)
				if (noLang && !commonSet.has(noLang.id)) this.addOption(noLang);
				// Re-add preloaded options (excluding common items which are shown separately)
				if (component._preloadedOptions) {
					component._preloadedOptions
						.filter(opt => !commonSet.has(opt.id))
						.forEach(opt => this.addOption(opt));
				}
			},
			// On startup, update any existing options with latest data from search
			onInitialize: async function() {
				const ids = Object.keys(this.options);
				const noLang = component.noLangOption;
				// Fetch and register common items (x-common group goes first)
				const commonIds = component.commonIds;
				if (commonIds.length > 0) {
					this.addOptionGroup('x-common', { label: 'Common' });
					const commonParams = new URLSearchParams({
						q: '*',
						filter_by: `id:[${commonIds.join(",")}]`,
						per_page: commonIds.length,
					});
					const commonResults = await component.searchRequest(commonParams);
					component._commonOptions = commonResults.map(r => ({...r, lang_family: 'x-common'}));
					component._commonOptions.forEach(opt => this.addOption(opt));
				}
				// Add noLang option now (after common items) so we can check for overlap
				const noLangIsCommon = noLang && component._commonOptions && component._commonOptions.some(o => o.id === noLang.id);
				if (noLang && !noLangIsCommon) this.addOption(noLang);
				// In language mode, fetch families and register option groups
				if (component.isLanguageMode) {
					const families = await component.getLanguageFamilies();
					families.forEach(family => {
						this.addOptionGroup(family.code, { label: family.label });
					});
				}
				// Preload all matching options (after groups are registered so options slot correctly)
				if (component.hasAttribute("data-preload")) {
					const filterValue = component.getAttribute("data-types")
						? `type:=[${component.getAttribute("data-types")}]`
						: component.getAttribute("data-exclude_types")
							? `type:!=[${component.getAttribute("data-exclude_types")}]`
							: null;
					// per_page: 250 acts as an upper bound — data-preload is intended for finite datasets
					const preloadParams = new URLSearchParams({ q: '*', per_page: 250 });
					if (filterValue) preloadParams.set("filter_by", filterValue);
					const preloaded = await component.searchRequest(preloadParams);
					component._preloadedOptions = preloaded;
					const commonSet = new Set((component._commonOptions || []).map(o => o.id));
					preloaded.filter(r => !commonSet.has(r.id)).forEach(r => this.addOption(r));
				}
				if (ids.length < 1) return;
				// Fetch real options from Typesense, excluding synthetic/preloaded items
				const preloadedIds = component._preloadedOptions ? new Set(component._preloadedOptions.map(r => r.id)) : new Set();
				const excludeIds = new Set([...(noLang ? [noLang.id] : []), ...commonIds, ...preloadedIds]);
				const idsToFetch = ids.filter(id => !excludeIds.has(id));
				if (idsToFetch.length > 0) {
					const searchParams = new URLSearchParams({
						q: '*',
						filter_by: `id:[${idsToFetch.join(",")}]`,
						per_page: idsToFetch.length,
					});
					const results = await component.searchRequest(searchParams);
					results.forEach(result => {
						this.updateOption(result.id, result);
					});
				}
				// Update any pre-selected no-lang option with the synthetic data
				if (noLang && ids.includes(noLang.id)) {
					this.updateOption(noLang.id, noLang);
				}
				// Update any pre-selected common items with fresh data
				if (component._commonOptions) {
					component._commonOptions.forEach(opt => {
						if (ids.includes(opt.id)) this.updateOption(opt.id, opt);
					});
				}
				// Update any pre-selected preloaded items with fresh data
				if (component._preloadedOptions) {
					component._preloadedOptions.forEach(opt => {
						if (ids.includes(opt.id)) this.updateOption(opt.id, opt);
					});
				}
			},
			onItemSelect: function (item) {
				// Tom-select prevents clicking on link in an item to work as normal, so force it here
				window.open(item.dataset.value, '_blank').focus();
			},
			render:{
				option: function(data, escape) {
					let label = escape(data.pref_label);
					let alt_label = "";
					if (data.highlight.pref_label) {
						label = data.highlight.pref_label.snippet;
					} else if (data.highlight.labels) {
						const matched_label = data.highlight.labels.find(l => l.matched_tokens.length > 0);
						if (matched_label) {
							alt_label = ` <span class="alt-label">(${matched_label.snippet})</span>`;
						}
					}
					label = label.replace(` (${data.type})`,""); // No need to include any type disambiguation in label, as types are always shown
					return `<div>${label}${alt_label}<span class="type lozenge" data-type="${escape(data.type)}" data-category="${escape(data.category)}">${escape(data.type)}</span></div>`;
				},
				item: function(data, escape) {
					return `<div class="lozenge" data-type="${escape(data.type)}" data-category="${escape(data.category)}"><a href="${data.id}" target="_blank">${escape(data.pref_label)}</a></div>`;
				},
			},
		});
		if (selector.nextElementSibling) {
			shadow.append(selector.nextElementSibling);
		}
	}
	connectedCallback() {
		const form = this.closest('form');
		if (!form) return;
		this._form = form;
		this._formdataHandler = (event) => {
			const selector = this.querySelector('select');
			if (!selector || !selector.name) return;
			const ts = selector.tomselect;
			if (!ts) return;
			const name = selector.name;
			const values = ts.getValue();
			const valueArray = Array.isArray(values) ? values : (values ? [values] : []);
			// Remove the native select values so consumers only receive the structured pairs
			event.formData.delete(name);
			valueArray.forEach((id, idx) => {
				const option = ts.options[id];
				if (option) {
					event.formData.append(`${name}[${idx}][uri]`, id);
					event.formData.append(`${name}[${idx}][name]`, option.pref_label);
				}
			});
		};
		form.addEventListener('formdata', this._formdataHandler);
	}
	disconnectedCallback() {
		if (this._form && this._formdataHandler) {
			this._form.removeEventListener('formdata', this._formdataHandler);
			this._form = null;
			this._formdataHandler = null;
		}
	}
	get noLangOption() {
		const label = this.getAttribute("data-no-lang");
		if (!label) return null;
		return {
			id: 'https://eolas.l42.eu/metadata/language/zxx/',
			pref_label: label,
			type: 'Language',
			category: 'Anthropological',
			labels: [],
			highlight: {},
		};
	}
	get isLanguageMode() {
		const types = this.getAttribute("data-types");
		if (!types) return false;
		return types.split(",").map(t => t.trim()).includes("Language");
	}
	get commonIds() {
		const common = this.getAttribute("data-common");
		if (!common) return [];
		return common.split(",").map(s => s.trim()).filter(Boolean);
	}
	async getLanguageFamilies() {
		if (this._langFamilies) return this._langFamilies;
		const key = this.getAttribute("data-api-key");
		if (!key) { this._langFamilies = []; return []; }
		const searchParams = new URLSearchParams({
			q: '*',
			filter_by: 'type:=Language Family',
			query_by: 'pref_label',
			include_fields: 'id,pref_label',
			sort_by: 'pref_label:asc',
			enable_highlight_v1: false,
			per_page: 250,
		});
		try {
			const response = await fetch("https://arachne.l42.eu/search?" + searchParams.toString(), {
				headers: { 'X-TYPESENSE-API-KEY': key },
				signal: AbortSignal.timeout(8000),
			});
			if (!response.ok) { this._langFamilies = []; return []; }
			const data = await response.json();
			this._langFamilies = data.hits.map(hit => ({
				// The lang_family field on Language documents in Typesense stores the last
				// path segment of the Language Family URI (e.g. "gmw" for West Germanic at
				// http://id.loc.gov/vocabulary/iso639-5/gmw). filter(Boolean) strips any
				// trailing slash. This is consistent with lucos-lang's family code extraction.
				code: hit.document.id.split("/").filter(Boolean).pop(),
				label: hit.document.pref_label,
			}));
		} catch (_) {
			this._langFamilies = [];
		}
		return this._langFamilies;
	}
	async searchRequest(searchParams, abortSignal = null) {
		const key = this.getAttribute("data-api-key");
		if (!key) throw new Error("No `data-api-key` attribute set on `lucos-search` component");
		searchParams.set('query_by', "pref_label,labels,description,lyrics");
		searchParams.set('query_by_weights', "10,8,3,1");
		searchParams.set('sort_by', "_text_match:desc,pref_label:asc");
		searchParams.set('prioritize_num_matching_fields', false);
		searchParams.set('include_fields', "id,pref_label,type,category,labels,lang_family");
		searchParams.set('enable_highlight_v1', false);
		searchParams.set('highlight_start_tag', '<span class="highlight">')
		searchParams.set('highlight_end_tag', '</span>');
		const timeoutSignal = AbortSignal.timeout(8000);
		const signal = abortSignal ? AbortSignal.any([timeoutSignal, abortSignal]) : timeoutSignal;
		let response;
		try {
			response = await fetch("https://arachne.l42.eu/search?"+searchParams.toString(), {
				headers: { 'X-TYPESENSE-API-KEY': key },
				signal,
			});
		} catch(err) {
			if (err.name === 'AbortError') throw err; // Pass through so caller can detect cancellation
			const userMessage = err.name === 'TimeoutError'
				? 'Search timed out — please try again later.'
				: 'Search is currently unavailable — please try again later.';
			const error = new Error(`Search request failed: ${err.message}`);
			error.userMessage = userMessage;
			throw error;
		}
		if (!response.ok) {
			let detail;
			try {
				const data = await response.json();
				detail = data["message"];
			} catch(_) {
				// Non-JSON body (e.g. nginx HTML error page) — detail stays undefined
			}
			const error = new Error(`Received ${response.status} error from search endpoint: ${detail}`);
			if (response.status === 502 || response.status === 503) {
				error.userMessage = 'Search backend is currently unavailable — please try again later.';
			} else {
				error.userMessage = 'Search encountered an error — please try again later.';
			}
			throw error;
		}
		const data = await response.json();
		const results = data.hits.map(result => {
			return {...result, ...result.document}
		});
		return results;
	}
}
customElements.define('lucos-search', LucosSearchComponent, { extends: "span" });