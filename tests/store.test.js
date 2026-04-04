import { test } from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../js/store.js';

test('get returns initial value', () => {
  assert.equal(store.get('locationStatus'), 'pending');
});

test('set updates state and notifies subscriber', () => {
  let received;
  store.subscribe('locationStatus', v => { received = v; });
  store.set('locationStatus', 'granted');
  assert.equal(received, 'granted');
  assert.equal(store.get('locationStatus'), 'granted');
});

test('unsubscribe stops notifications', () => {
  let callCount = 0;
  const unsub = store.subscribe('dataStatus', () => { callCount++; });
  store.set('dataStatus', 'loading');
  unsub();
  store.set('dataStatus', 'ready');
  assert.equal(callCount, 1);
});

test('multiple subscribers all notified', () => {
  const values = [];
  store.subscribe('filterSheetOpen', v => values.push('a:' + v));
  store.subscribe('filterSheetOpen', v => values.push('b:' + v));
  store.set('filterSheetOpen', true);
  assert.deepEqual(values, ['a:true', 'b:true']);
});

test('setting prefs object notifies prefs subscribers', () => {
  let received;
  store.subscribe('prefs', v => { received = v; });
  const prefs = { selectedBrands: ['Shell'], selectedGasTypes: ['Régulier'], maxDistanceKm: 5, sortBy: 'price' };
  store.set('prefs', prefs);
  assert.deepEqual(received, prefs);
});
