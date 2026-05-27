/**
 * Builds a Typesense filter_by expression from the search component's filter attributes.
 *
 * @param {string|null} types       - Value of data-types attribute (e.g. "Person,Place")
 * @param {string|null} excludeTypes - Value of data-exclude-types attribute (e.g. "Language")
 * @param {string|null} isContact   - Value of data-is-contact attribute ("true" or "false")
 * @returns {string|null} filter expression, or null if no filters apply
 */
export function buildFilterBy(types, excludeTypes, isContact) {
	const parts = [];
	if (types) {
		parts.push(`types:=[${types}]`);
	} else if (excludeTypes) {
		parts.push(`types:!=[${excludeTypes}]`);
	}
	if (isContact === 'true') {
		parts.push('is_contact:=true');
	} else if (isContact === 'false') {
		parts.push('is_contact:=false');
	}
	return parts.length > 0 ? parts.join(' && ') : null;
}
