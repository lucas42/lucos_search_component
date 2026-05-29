import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFilterBy } from '../web-components/filter.js';

test('data-is-contact="true" produces is_contact:=true filter', () => {
	const result = buildFilterBy(null, null, 'true');
	assert.equal(result, 'is_contact:=true');
});

test('data-is-contact="false" produces is_contact:=false filter', () => {
	const result = buildFilterBy(null, null, 'false');
	assert.equal(result, 'is_contact:=false');
});

test('omitting data-is-contact produces no is_contact filter', () => {
	const result = buildFilterBy(null, null, null);
	assert.equal(result, null);
});

test('data-is-contact combines correctly with data-types', () => {
	const result = buildFilterBy('Person', null, 'true');
	assert.equal(result, 'types:=[Person] && is_contact:=true');
});

test('data-types produces types:= filter', () => {
	const result = buildFilterBy('City,River', null, null);
	assert.equal(result, 'types:=[City,River]');
});

test('data-exclude-types produces types:!= filter', () => {
	const result = buildFilterBy(null, 'Track', null);
	assert.equal(result, 'types:!=[Track]');
});

test('data-allowed-origins produces origin:= filter', () => {
	const result = buildFilterBy(null, null, null, 'https://eolas.l42.eu');
	assert.equal(result, 'origin:=[https://eolas.l42.eu]');
});

test('data-allowed-origins with multiple comma-separated origins', () => {
	const result = buildFilterBy(null, null, null, 'https://eolas.l42.eu,https://contacts.l42.eu');
	assert.equal(result, 'origin:=[https://eolas.l42.eu,https://contacts.l42.eu]');
});

test('data-allowed-origins combines with data-types', () => {
	const result = buildFilterBy('Person', null, null, 'https://eolas.l42.eu');
	assert.equal(result, 'types:=[Person] && origin:=[https://eolas.l42.eu]');
});

test('absent data-allowed-origins produces no origin filter', () => {
	const result = buildFilterBy('Person', null, null, null);
	assert.equal(result, 'types:=[Person]');
});
