import TomSelect from 'tom-select';
import tomSelectStylesheet from 'tom-select/dist/css/tom-select.default.css';

class LucosLangComponent extends HTMLSpanElement {
	static get observedAttributes() {
		return ['data-api-key'];
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
			.lozenge {
				--lozenge-background: #8affe7;
				--lozenge-border: #068900;
				--lozenge-text: #000000;
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
		if (!selector) throw new Error("Can't find select element in lucos-lang");
		selector.setAttribute("multiple", "multiple");
		new TomSelect(selector, {
			valueField: 'code',
			labelField: 'label',
			searchField: ['code','label'],
			closeAfterSelect: true,
			plugins: {
				remove_button:{
					title:'Remove this language',
				},
				drag_drop: {},
			},
			onItemAdd: function() { // Workaround until https://github.com/orchidjs/tom-select/pull/945 is merged/released
				this.setTextboxValue('');
				this.refreshOptions();
			},
			// On startup, update any existing options with latest data from search
			onInitialize: async function() {
				const results = await component.searchRequest();
				results.forEach(result => {
					this.updateOption(result.code, result); // Updates any existing options which are selected with the correct label
					this.addOption(result); // Makes the option available for new selections
				});
			},
			onItemSelect: function (item) {
				// Tom-select prevents clicking on link in an item to work as normal, so force it here
				window.open(item.dataset.url, '_blank').focus();
			},
			render:{
				item: function(data, escape) {
					return `<div class="lozenge" data-url="${escape(data.url)}"><a href="${escape(data.url)}" target="_blank">${escape(data.label)}</a></div>`;
				},
			},
		});
		if (selector.nextElementSibling) {
			shadow.append(selector.nextElementSibling);
		}
	}
	async searchRequest() {
		const key = this.getAttribute("data-api-key");
		if (!key) throw new Error("No `data-api-key` attribute set on `lucos-search` component");
		const searchParams = new URLSearchParams({
			filter_by: 'type:=Language',
			query_by: "pref_label",
			include_fields: "id,pref_label",
			sort_by: "pref_label:asc",
			enable_highlight_v1: false,
			per_page: 200,
		});
		const response = await fetch("https://arachne.l42.eu/search?"+searchParams.toString(), {
			headers: { 'X-TYPESENSE-API-KEY': key },
			signal: AbortSignal.timeout(900),
		});
		const data = await response.json();
		if (!response.ok) {
			throw new Error(`Recieved ${response.status} error from search endpoint: ${data["message"]}`);
		}
		const results = data.hits.map(result => {
			return {
				code: result.document.id.split("/").reverse()[1],
				label: result.document.pref_label,
				url: result.document.id,
			}
		});
		return results;
	}
}
customElements.define('lucos-lang', LucosLangComponent, { extends: "span" });