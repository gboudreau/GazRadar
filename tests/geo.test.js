import { test } from 'node:test';
import assert from 'node:assert/strict';
import { haversine } from '../js/geo.js';

test('haversine: same point is 0 km', () => {
  const p = { lat: 45.5, lng: -73.6 };
  assert.equal(haversine(p, p), 0);
});

test('haversine: Montreal to Quebec City is ~233 km', () => {
  const montreal = { lat: 45.5017, lng: -73.5673 };
  const quebec   = { lat: 46.8139, lng: -71.2080 };
  const dist = haversine(montreal, quebec);
  assert.ok(dist > 225 && dist < 240, `Expected ~233 km, got ${dist.toFixed(1)}`);
});

test('haversine: 1 km north is ~1 km', () => {
  const a = { lat: 45.0, lng: -73.0 };
  const b = { lat: 45.009, lng: -73.0 };
  const dist = haversine(a, b);
  assert.ok(dist > 0.9 && dist < 1.1, `Expected ~1 km, got ${dist.toFixed(3)}`);
});

test('haversine: result is in km (not metres)', () => {
  const a = { lat: 45.5, lng: -73.6 };
  const b = { lat: 45.6, lng: -73.6 };
  const dist = haversine(a, b);
  assert.ok(dist > 5 && dist < 15, `Expected ~11 km, got ${dist}`);
});
