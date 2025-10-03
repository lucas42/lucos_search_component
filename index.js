import TomSelect from 'tom-select';
import tomSelectStylesheet from 'tom-select/dist/css/tom-select.default.css';

class LucosSearchComponent extends HTMLSpanElement {
	static get observedAttributes() {
		return ['data-api-key','data-types','data-exclude-types'];
	}
	constructor() {
		super();
		const component = this;
		const shadow = component.attachShadow({mode: 'open'});

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
			/** Aquatic Places **/
			.lozenge[data-type="Ocean"], .lozenge[data-type="Sea"], .lozenge[data-type="Sea Inlet"], .lozenge[data-type="River"], .lozenge[data-type="Lake"] {
				--lozenge-background: #0085fe;
				--lozenge-border: #0036b1;
			}
			/** Terrestrial Places **/
			.lozenge[data-type="Archipelago"], .lozenge[data-type="Area Of Outstanding Natural Beauty"], .lozenge[data-type="Continent"], .lozenge[data-type="Historical Site"], .lozenge[data-type="Island"], .lozenge[data-type="Mountain"] {
				--lozenge-background: #652c17;
				--lozenge-border: #321200;
			}
			/** Cosmic Places **/
			.lozenge[data-type="Galaxy"], .lozenge[data-type="Planetary System"], .lozenge[data-type="Star"], .lozenge[data-type="Planet"], .lozenge[data-type="Natural Satellite"] {
				--lozenge-background: #15163a;
				--lozenge-border: #000000;
				--lozenge-text: #feffe8;
			}
			/** Human Places **/
			.lozenge[data-type="Airport"], .lozenge[data-type="Autonomous Area"], .lozenge[data-type="City"], .lozenge[data-type="Country"], .lozenge[data-type="County"], .lozenge[data-type="Dependent Territory"], .lozenge[data-type="Historical Site"], .lozenge[data-type="Neighbourhood"], .lozenge[data-type="Province"], .lozenge[data-type="Region"], .lozenge[data-type="Road"], .lozenge[data-type="State"], .lozenge[data-type="Town"], .lozenge[data-type="Tribal Nation"], .lozenge[data-type="Village"] {
				--lozenge-background: #aed0db;
				--lozenge-border: #3f6674;
				--lozenge-text: #0c1a1b;
			}
			/** Supernatural Places **/
			.lozenge[data-type="Supernatural Realm"] {
				--lozenge-background: #f1ff5f;
				--lozenge-border: #674800;
				--lozenge-text: #352005;
			}
			.lozenge.active {
				--lozenge-border: #b00;
			}
			.type {
				margin: 0 3px;
				padding: 2px 6px;
			}
		`;
		shadow.appendChild(mainStyle);

		// If webpack is configured with `css-loader` but not `style-loader`, include the tom-select stylesheet here
		// (If `style-loader` is being used, the tom-select stylesheet will be handled by that)
		if (tomSelectStylesheet) {
			const tomStyle = document.createElement('style');
			tomStyle.textContent = tomSelectStylesheet;
			shadow.appendChild(tomStyle);
		}

		const selector = component.querySelector("select");
		if (!selector) throw new Error("Can't find select element in lucos-search");
		shadow.append(selector);
		selector.setAttribute("multiple", "multiple");
		new TomSelect(selector, {
			valueField: 'id',
			labelField: 'pref_label',
			searchField: [],
			load: async function(query, callback) {
				const queryParams = new URLSearchParams({
					q: query,
				});
				if (component.getAttribute("data-types")) {
					queryParams.set("filter_by",`type:[${component.getAttribute("data-types")}]`);
				} else if (component.getAttribute("data-exclude_types")) {
					queryParams.set("filter_by",`type:![${component.getAttribute("data-exclude_types")}]`);
				}
				const results = await component.searchRequest(queryParams);
				this.clearOptions();
				callback(results);
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
			},
			// On startup, update any existing options with latest data from search
			onInitialize: async function() {
				const ids = Object.keys(this.options);
				if (ids.length < 1) return;
				const searchParams = new URLSearchParams({
					q: '*',
					filter_by: `id:[${ids.join(",")}]`,
					per_page: ids.length,
				});
				const results = await component.searchRequest(searchParams);
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
	async searchRequest(searchParams) {
		const key = this.getAttribute("data-api-key");
		if (!key) throw new Error("No `data-api-key` attribute set on `lucos-search` component");
		searchParams.set('query_by', "pref_label,labels,description,lyrics");
		searchParams.set('query_by_weights', "10,8,3,1");
		searchParams.set('sort_by', "_text_match:desc,pref_label:asc");
		searchParams.set('prioritize_num_matching_fields', false);
		searchParams.set('include_fields', "id,pref_label,type");
		const response = await fetch("https://arachne.l42.eu/search?"+searchParams.toString(), {
			headers: { 'X-TYPESENSE-API-KEY': key },
			signal: AbortSignal.timeout(900),
		});
		const data = await response.json();
		if (!response.ok) {
			throw new Error(`Recieved ${response.status} error from search endpoint: ${data["message"]}`);
		}
		const results = data.hits.map(result => {
			return {...result, ...result.document}
		});
		return results;
	}
}
customElements.define('lucos-search', LucosSearchComponent, { extends: "span" });