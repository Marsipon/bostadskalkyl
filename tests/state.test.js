import test from 'node:test';
import assert from 'node:assert/strict';

import { createCalculation, createEmptyState } from '../state.js';

test('createCalculation falls back when structuredClone is unavailable', () => {
  const originalStructuredClone = globalThis.structuredClone;
  const baseState = createEmptyState();
  baseState.currentHome.marketValue = 4200000;

  try {
    globalThis.structuredClone = undefined;

    const calculation = createCalculation('Villa', baseState);

    assert.equal(calculation.state.currentHome.marketValue, 4200000);
    assert.notEqual(calculation.state, baseState);
    assert.notEqual(calculation.state.currentHome, baseState.currentHome);
  } finally {
    globalThis.structuredClone = originalStructuredClone;
  }
});
