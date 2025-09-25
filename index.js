import TomSelect from 'tom-select';
import tomSelectStylesheet from 'tom-select/dist/css/tom-select.default.css';

class LucosSearchComponent extends HTMLElement {
	static get observedAttributes() {
		return ['api-key'];
	}
	constructor() {
		super();
		const component = this;
		const shadow = component.attachShadow({mode: 'open'});

		const mainStyle = document.createElement('style');
		mainStyle.textContent = `
			.item{
			}
		`;
		shadow.appendChild(mainStyle);

		const tomStyle = document.createElement('style');
		tomStyle.textContent = tomSelectStylesheet[0][1];
		shadow.appendChild(tomStyle);

		const select = document.createElement("select");
		select.setAttribute("multiple", "multiple");
		shadow.appendChild(select);
		const tomSelect = new TomSelect(select, {
			valueField: 'id',
			labelField: 'pref_label',
			searchField: [],
			load: async function(query, callback) {
				const key = component.getAttribute("api-key");
				if (!key) throw new Error("No `api-key` attribute set on `lucos-search` component");
				const queryParams = new URLSearchParams({
					q: query,
				});
				const response = await fetch("https://arachne.l42.eu/basic-search?"+queryParams.toString(), {
					headers: { Authorization: `key ${key}` },
					signal: AbortSignal.timeout(900),
				});
				const data = await response.json();
				const results = data.hits.map(result => result.document);
				this.clearOptions();
				callback(results);
			},
			plugins: {
				remove_button:{
					title:'Remove this item',
				}
			},
			onItemAdd: function() { // Workaround until https://github.com/orchidjs/tom-select/issues/854 is merged/released
				console.log('onItemAdd')
				this.setTextboxValue('');
				this.clearOptions();
				this.refreshOptions();
			},
			onFocus: function() {
				this.clearOptions();
			}
		});
	}
}
customElements.define('lucos-search', LucosSearchComponent);