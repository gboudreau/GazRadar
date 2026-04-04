import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStation } from '../js/data.js';

const makeFeature = (overrides = {}) => ({
  id: 'test-1',
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-73.5673, 45.5017] },
  properties: {
    name: 'Station Test',
    brand: 'Shell',
    address: '123 rue Test',
    prices: { 'Régulier': '167.9¢', 'Super': '177.4¢', 'Diesel': null },
    ...overrides,
  },
});

test('swaps [lng, lat] coordinates to { lat, lng }', () => {
  const s = normalizeStation(makeFeature());
  assert.equal(s.lat, 45.5017);
  assert.equal(s.lng, -73.5673);
});

test('strips ¢ and parses prices as floats', () => {
  const s = normalizeStation(makeFeature());
  assert.equal(s.prices['Régulier'], 167.9);
  assert.equal(s.prices['Super'], 177.4);
});

test('null price stays null', () => {
  const s = normalizeStation(makeFeature());
  assert.equal(s.prices['Diesel'], null);
});

test('maps name, brand, address', () => {
  const s = normalizeStation(makeFeature());
  assert.equal(s.name, 'Station Test');
  assert.equal(s.brand, 'Shell');
  assert.equal(s.address, '123 rue Test');
});

test('missing prices object produces empty prices', () => {
  const f = makeFeature({ prices: undefined });
  const s = normalizeStation(f);
  assert.deepEqual(s.prices, {});
});

test('id is stringified', () => {
  const s = normalizeStation(makeFeature());
  assert.equal(typeof s.id, 'string');
});
