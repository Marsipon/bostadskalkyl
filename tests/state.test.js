import test from 'node:test';
import assert from 'node:assert/strict';

import { createCalculation, createEmptyState, ensureStore } from '../state.js';

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

test('createEmptyState includes editable assumptions', () => {
  const state = createEmptyState();

  assert.equal(state.assumptions.downPaymentPercent, 15);
  assert.equal(state.assumptions.stampDutyPercent, 1.5);
  assert.equal(state.assumptions.deedPercent, 2);
  assert.equal(state.assumptions.brokerFeeMode, 'percent');
});

test('ensureStore migrates old broker fee into assumptions', () => {
  const store = ensureStore({
    version: 1,
    activeCalculation: 'a',
    calculations: {
      a: {
        id: 'a',
        name: 'Test',
        updatedAt: new Date().toISOString(),
        state: {
          currentHome: {
            marketValue: 100,
            purchasePrice: 0,
            brokerFeePercent: 2.5,
            loans: [{ id: 'loan', amount: 10 }]
          },
          newHome: {
            price: 100,
            existingDeeds: 0,
            renovationCost: 0,
            otherCosts: 0
          }
        }
      }
    }
  });

  assert.equal(store.calculations.a.state.assumptions.brokerFeePercent, 2.5);
});
