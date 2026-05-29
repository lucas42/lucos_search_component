import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFormDataEntries } from '../web-components/form-serialise.js';

// --- Arachne-selected entries ---

test('arachne-selected entry emits [uri] and [name]', () => {
	const options = {
		'https://eolas.l42.eu/people/1': { pref_label: 'John Lennon', id: 'https://eolas.l42.eu/people/1' },
	};
	const entries = buildFormDataEntries('composer', 'https://eolas.l42.eu/people/1', options);
	assert.deepEqual(entries, [
		['composer[0][uri]', 'https://eolas.l42.eu/people/1'],
		['composer[0][name]', 'John Lennon'],
	]);
});

test('arachne-selected entry with multiple values uses contiguous indices', () => {
	const options = {
		'https://eolas.l42.eu/people/1': { pref_label: 'John Lennon', id: 'https://eolas.l42.eu/people/1' },
		'https://eolas.l42.eu/people/2': { pref_label: 'Paul McCartney', id: 'https://eolas.l42.eu/people/2' },
	};
	const entries = buildFormDataEntries(
		'composer',
		['https://eolas.l42.eu/people/1', 'https://eolas.l42.eu/people/2'],
		options,
	);
	assert.deepEqual(entries, [
		['composer[0][uri]', 'https://eolas.l42.eu/people/1'],
		['composer[0][name]', 'John Lennon'],
		['composer[1][uri]', 'https://eolas.l42.eu/people/2'],
		['composer[1][name]', 'Paul McCartney'],
	]);
});

// --- Created entries ---

test('created entry emits [name] only, no [uri]', () => {
	const options = {
		'Ringo Starr': { pref_label: 'Ringo Starr', id: 'Ringo Starr', created: true },
	};
	const entries = buildFormDataEntries('composer', 'Ringo Starr', options);
	assert.deepEqual(entries, [
		['composer[0][name]', 'Ringo Starr'],
	]);
	// Confirm [uri] is absent
	const keys = entries.map(([k]) => k);
	assert.ok(!keys.includes('composer[0][uri]'), 'uri key must not be present for created entries');
});

// --- Mixed entries ---

test('mixed created and arachne-selected entries serialise with contiguous indices and correct shapes', () => {
	const options = {
		'https://eolas.l42.eu/people/1': { pref_label: 'John Lennon', id: 'https://eolas.l42.eu/people/1' },
		'George Harrison': { pref_label: 'George Harrison', id: 'George Harrison', created: true },
		'https://eolas.l42.eu/people/3': { pref_label: 'Paul McCartney', id: 'https://eolas.l42.eu/people/3' },
	};
	const entries = buildFormDataEntries(
		'composer',
		['https://eolas.l42.eu/people/1', 'George Harrison', 'https://eolas.l42.eu/people/3'],
		options,
	);
	assert.deepEqual(entries, [
		['composer[0][uri]', 'https://eolas.l42.eu/people/1'],
		['composer[0][name]', 'John Lennon'],
		['composer[1][name]', 'George Harrison'],                   // created — name only
		['composer[2][uri]', 'https://eolas.l42.eu/people/3'],
		['composer[2][name]', 'Paul McCartney'],
	]);
});

// --- Edge cases ---

test('no values produces no entries', () => {
	const entries = buildFormDataEntries('composer', [], {});
	assert.deepEqual(entries, []);
});

test('empty string values produces no entries', () => {
	const entries = buildFormDataEntries('composer', '', {});
	assert.deepEqual(entries, []);
});

test('null values produces no entries', () => {
	const entries = buildFormDataEntries('composer', null, {});
	assert.deepEqual(entries, []);
});

test('value with no matching option is silently skipped', () => {
	// Matches the existing behaviour: unknown value keys are ignored
	const options = {
		'https://eolas.l42.eu/people/1': { pref_label: 'John Lennon', id: 'https://eolas.l42.eu/people/1' },
	};
	const entries = buildFormDataEntries(
		'composer',
		['https://eolas.l42.eu/people/1', 'https://eolas.l42.eu/people/99'],
		options,
	);
	// Only the known option contributes entries; index gaps are absent (idx 0 only)
	assert.deepEqual(entries, [
		['composer[0][uri]', 'https://eolas.l42.eu/people/1'],
		['composer[0][name]', 'John Lennon'],
	]);
});

test('field name is preserved verbatim in keys', () => {
	const options = { 'https://example.com/1': { pref_label: 'Test', id: 'https://example.com/1' } };
	const entries = buildFormDataEntries('my_field_name', 'https://example.com/1', options);
	assert.ok(entries.every(([k]) => k.startsWith('my_field_name[')));
});
