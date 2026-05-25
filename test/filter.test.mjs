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
	assert.equal(result, 'type:=[Person] && is_contact:=true');
});
