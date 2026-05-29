/**
 * Build formData key/value pairs for a lucos-search field.
 *
 * Arachne-selected entries emit both [uri] and [name]; created entries (tagged
 * with option.created = true) emit [name] only so consumers can route them to a
 * create-on-write path without a URI.
 *
 * @param {string} name - The field name (from select.name)
 * @param {string|string[]} values - Selected TomSelect values (ts.getValue())
 * @param {Object} optionMap - TomSelect options map (ts.options)
 * @returns {Array<[string, string]>} Array of [key, value] pairs to append to FormData
 */
export function buildFormDataEntries(name, values, optionMap) {
	const valueArray = Array.isArray(values) ? values : (values ? [values] : []);
	const entries = [];
	valueArray.forEach((id, idx) => {
		const option = optionMap[id];
		if (!option) return;
		if (option.created) {
			// Created (no arachne match) entry: name only, no URI
			entries.push([`${name}[${idx}][name]`, option.pref_label]);
		} else {
			// Arachne-selected entry: URI + name
			entries.push([`${name}[${idx}][uri]`, id]);
			entries.push([`${name}[${idx}][name]`, option.pref_label]);
		}
	});
	return entries;
}
