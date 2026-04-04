import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStation } from '../js/data.js';

// Matches the actual API shape: properties.Prices is an array of {GasType, Price, IsAvailable}
const makeFeature = (overrides = {}) => ({
  id: 'test-1',
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-73.5673, 45.5017] }, // [lng, lat]
  properties: {
    Name: 'Station Test',
    brand: 'Shell',
    Address: '123 rue Test',
    Prices: [
      { GasType: 'Régulier', Price: '167.9¢', IsAvailable: true },
      { GasType: 'Super',    Price: '177.4¢', IsAvailable: true },
      { GasType: 'Diesel',   Price: null,     IsAvailable: false },
    ],
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

test('unavailable price is stored as null', () => {
  const s = normalizeStation(makeFeature());
  assert.equal(s.prices['Diesel'], null);
});

test('maps Name → name, brand, Address → address', () => {
  const s = normalizeStation(makeFeature());
  assert.equal(s.name, 'Station Test');
  assert.equal(s.brand, 'Shell');
  assert.equal(s.address, '123 rue Test');
});

test('missing Prices array produces empty prices', () => {
  const s = normalizeStation(makeFeature({ Prices: undefined }));
  assert.deepEqual(s.prices, {});
});

test('id is stringified', () => {
  const s = normalizeStation(makeFeature());
  assert.equal(typeof s.id, 'string');
});
