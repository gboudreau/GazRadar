import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBrandStyle } from '../js/brands.js';

test('Shell returns yellow bg with black text', () => {
  const s = getBrandStyle('Shell');
  assert.equal(s.bg, '#FFD500');
  assert.equal(s.text, '#000000');
});

test('Petro-Canada returns red bg with white text', () => {
  const s = getBrandStyle('Petro-Canada');
  assert.equal(s.bg, '#E31837');
  assert.equal(s.text, '#FFFFFF');
});

test('unknown brand returns consistent color (same input → same output)', () => {
  const a = getBrandStyle('BrandXYZ');
  const b = getBrandStyle('BrandXYZ');
  assert.deepEqual(a, b);
});

test('unknown brand returns bg and text fields', () => {
  const s = getBrandStyle('SomeBrand');
  assert.ok(s.bg, 'bg should exist');
  assert.ok(s.text, 'text should exist');
});

test('different unknown brands return different bg colors', () => {
  const a = getBrandStyle('AlphaPetrol');
  const b = getBrandStyle('BetaGazoline');
  assert.notEqual(a.bg, b.bg);
});
