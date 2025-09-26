import TomSelect from 'tom-select';
import tomSelectStylesheet from 'tom-select/dist/css/tom-select.default.css';

class LucosSearchComponent extends HTMLSelectElement {
	static get observedAttributes() {
		return ['data-api-key','data-types','data-exclude-types'];
	}
	constructor() {
		super();
		const component = this;

		const mainStyle = document.createElement('style');
		mainStyle.textContent = `
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

			/* Default colour to greys, but override based on type */
			.lozenge {
				--lozenge-background: #555;
				--lozenge-border: #6d6d6d;
				--lozenge-text: #fff;
			}
			/*  Items from lucos_eolas have many types.  For now, count any type which isn't specified later as part of eolas. */
			.lozenge[data-type] {
				--lozenge-background: #6a00c2;
				--lozenge-border: #44265d;
			}
			.lozenge[data-type="Track"] {
				--lozenge-background: #000060;
				--lozenge-border: #000020;
			}
			.lozenge[data-type="Person"] {
				--lozenge-background: #044E00;
				--lozenge-border: #033100;
			}
			.lozenge.active {
				--lozenge-border: #b00;
			}
			.type {
				margin: 0 3px;
				padding: 2px 6px;
			}
		`;
		component.appendChild(mainStyle);

		// If webpack is configured with `css-loader` but not `style-loader`, include the tom-select stylesheet here
		// (If `style-loader` is being used, the tom-select stylesheet will be handled by that)
		if (tomSelectStylesheet) {
			const tomStyle = document.createElement('style');
			tomStyle.textContent = tomSelectStylesheet[0][1];
			component.appendChild(tomStyle);
		}

		component.setAttribute("multiple", "multiple");
		new TomSelect(component, {
			valueField: 'id',
			labelField: 'pref_label',
			searchField: [],
			load: async function(query, callback) {
				const queryParams = new URLSearchParams({
					q: query,
				});
				if (component.getAttribute("data-types")) queryParams.set("types",component.getAttribute("data-types"));
				if (component.getAttribute("data-exclude_types")) queryParams.set("exclude_types",component.getAttribute("data-exclude_types"));
				const results = await component.basicSearch(queryParams);
				this.clearOptions();
				callback(results);
			},
			plugins: {
				remove_button:{
					title:'Remove this item',
				}
			},
			onItemAdd: function() { // Workaround until https://github.com/orchidjs/tom-select/issues/854 is merged/released
				this.setTextboxValue('');
				this.clearOptions();
				this.refreshOptions();
			},
			onFocus: function() {
				this.clearOptions();
			},
			// On startup, update any existing options with latest data from search
			onInitialize: async function() {
				const ids = Object.keys(this.options);
				if (ids.length < 1) return;
				const searchParams = new URLSearchParams({
					q: '*',
					ids: ids.join(","),
				});
				const results = await component.basicSearch(searchParams);
				results.forEach(result => {
					this.updateOption(result.id, result);
				});
			},
			render:{
				option: function(data, escape) {
					return `<div>${escape(data.pref_label)}<span class="type lozenge" data-type="${escape(data.type)}">${escape(data.type)}</span></div>`;
				},
				item: function(data, escape) {
					return `<div class="lozenge" data-type="${escape(data.type)}">${escape(data.pref_label)}</div>`;
				},
			},
		});
	}
	async basicSearch(searchParams) {
		const key = this.getAttribute("data-api-key");
		if (!key) throw new Error("No `data-api-key` attribute set on `lucos-search` component");
		const response = await fetch("https://arachne.l42.eu/basic-search?"+searchParams.toString(), {
			headers: { Authorization: `key ${key}` },
			signal: AbortSignal.timeout(900),
		});
		const data = await response.json();
		const results = data.hits.map(result => {
			return {...result, ...result.document}
		});
		return results;
	}
}
customElements.define('lucos-search', LucosSearchComponent, { extends: "select" });