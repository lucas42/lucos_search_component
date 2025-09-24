class LucosSearchComponent extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({mode: 'closed'});
		console.log("Search Component initiated")
	}
}
customElements.define('lucos-search', LucosSearchComponent);