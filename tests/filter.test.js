import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSort } from '../js/filter.js';

const loc = { lat: 45.5, lng: -73.6 };

const makeStation = (id, brand, lat, lng, prices) => ({
  id, name: `Station ${id}`, brand, lat, lng, address: '', prices,
});

const stA = makeStation('a', 'Shell',  45.503, -73.600, { 'Régulier': 169.9, 'Super': 179.9 });
const stB = makeStation('b', 'Esso',   45.505, -73.605, { 'Régulier': 167.9 });
const stC = makeStation('c', 'Shell',  45.600, -73.700, { 'Régulier': 155.0 });
const stD = makeStation('d', 'Costco', 45.504, -73.603, { 'Diesel': 164.0 });

const basePrefs = {
  selectedBrands: [],
  selectedGasTypes: ['Régulier'],
  maxDistanceKm: 10,
  sortBy: 'price',
};

test('filters out stations beyond maxDistanceKm', () => {
  const { results } = filterAndSort([stA, stB, stC], basePrefs, loc);
  assert.ok(!results.find(s => s.id === 'c'), 'stC is too far');
  assert.equal(results.length, 2);
});

test('filters out stations without selected gas type', () => {
  const { results } = filterAndSort([stA, stB, stD], basePrefs, loc);
  assert.ok(!results.find(s => s.id === 'd'), 'stD has no Régulier');
  assert.equal(results.length, 2);
});

test('sorts by price ascending when sortBy=price', () => {
  const { results } = filterAndSort([stA, stB], basePrefs, loc);
  assert.equal(results[0].id, 'b');
  assert.equal(results[1].id, 'a');
});

test('sorts by distance ascending when sortBy=distance', () => {
  const prefs = { ...basePrefs, sortBy: 'distance' };
  const { results } = filterAndSort([stA, stB], prefs, loc);
  assert.equal(results[0].id, 'a');
});

test('brand filter excludes non-matching brands', () => {
  const prefs = { ...basePrefs, selectedBrands: ['Shell'] };
  const { results, brandExcludedCount } = filterAndSort([stA, stB], prefs, loc);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'a');
  assert.equal(brandExcludedCount, 1);
});

test('empty selectedBrands includes all brands', () => {
  const { results } = filterAndSort([stA, stB], basePrefs, loc);
  assert.equal(results.length, 2);
});

test('tags isBestDeal on station with cheapest price', () => {
  const { results } = filterAndSort([stA, stB], basePrefs, loc);
  const best = results.find(s => s.isBestDeal);
  assert.equal(best?.id, 'b');
});

test('only one station tagged isBestDeal', () => {
  const { results } = filterAndSort([stA, stB], basePrefs, loc);
  assert.equal(results.filter(s => s.isBestDeal).length, 1);
});

test('effectivePrice uses cheapest among selected gas types', () => {
  const prefs = { ...basePrefs, selectedGasTypes: ['Régulier', 'Super'] };
  const { results } = filterAndSort([stA, stB], prefs, loc);
  assert.equal(results[0].effectivePrice, 167.9);
});

test('returns distances attached to results', () => {
  const { results } = filterAndSort([stA], basePrefs, loc);
  assert.ok(typeof results[0].distanceKm === 'number');
  assert.ok(results[0].distanceKm < 2);
});

test('brandExcludedCount is 0 when no brand filter active', () => {
  const { brandExcludedCount } = filterAndSort([stA, stB], basePrefs, loc);
  assert.equal(brandExcludedCount, 0);
});
