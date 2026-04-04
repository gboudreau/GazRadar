import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBrandStyle } from '../js/brands.js';

test('Shell returns yellow bg with black text', () => {
  const s = getBrandStyle('Shell');
  assert.equal(s.bg, '#FFD500');
  assert.equal(s.text, '#000000');
});

test('Petro-Canada returns correct red', () => {
  const s = getBrandStyle('Petro-Canada');
  assert.equal(s.bg, '#E1251B');
  assert.equal(s.text, '#FFFFFF');
});

test('Esso returns correct blue', () => {
  const s = getBrandStyle('Esso');
  assert.equal(s.bg, '#0033A0');
  assert.equal(s.text, '#FFFFFF');
});

test('unknown brand returns light grey default', () => {
  const s = getBrandStyle('SomeBrand');
  assert.equal(s.bg, '#E5E5EA');
  assert.equal(s.text, '#1C1C1E');
});

test('all unknown brands return the same default color', () => {
  const a = getBrandStyle('AlphaPetrol');
  const b = getBrandStyle('BetaGazoline');
  assert.deepEqual(a, b);
});
