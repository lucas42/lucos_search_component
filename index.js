class LucosSearchComponent extends HTMLElement {
	static get observedAttributes() {
		return ['api-key'];
	}
	constructor() {
		super();
		const shadow = this.attachShadow({mode: 'closed'});

		const results = document.createElement("span");
		this.updateResults = resultData => {
			results.innerText = JSON.stringify(resultData);
		}
		shadow.appendChild(results);
	}
	async searchAPI(query) {
		const key = this.getAttribute("api-key");
		if (!key) throw new Error("No `api-key` attribute set on `lucos-search` component");

		const queryParams = new URLSearchParams({
			q: query,
		});
		const response = await fetch("https://arachne.l42.eu/basic-search?"+queryParams.toString(), {
			headers: { Authorization: `key ${key}` },
			signal: AbortSignal.timeout(900),
		});
		const data = await response.json();
		this.updateResults(data);
	}
}
customElements.define('lucos-search', LucosSearchComponent);