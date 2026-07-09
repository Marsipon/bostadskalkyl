import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateBrokerFee,
  calculateMortgage,
  calculatePantbrev,
  calculatePurchasePlan,
  calculateScenario
} from '../calculations.js';

test('calculateMortgage sums all loan parts', () => {
  assert.equal(calculateMortgage([{ amount: 1250000 }, { amount: 980000 }, { amount: 950000 }]), 3180000);
});

test('calculateBrokerFee uses percentage input', () => {
  assert.equal(calculateBrokerFee(5200000, 3), 156000);
});

test('calculateBrokerFee can use fixed broker fee rule', () => {
  assert.equal(calculateBrokerFee(5200000, 3, 'fixed', 100000), 100000);
});

test('calculatePantbrev only charges for deeds above existing amount', () => {
  assert.deepEqual(calculatePantbrev(3600000, 2500000), {
    newDeeds: 1100000,
    cost: 22375
  });
});

test('calculatePurchasePlan reports missing capital above 85 percent loan-to-value', () => {
  const result = calculatePurchasePlan({
    price: 6250000,
    renovationCost: 100000,
    otherCosts: 25000,
    existingDeeds: 0,
    saleProceeds: 300000,
    assumptions: {
      downPaymentPercent: 15,
      stampDutyPercent: 1.5,
      deedPercent: 2
    }
  });

  assert.ok(result.capitalMissing > 0);
  assert.equal(result.status, 'short');
  assert.equal(result.explanations.totalCost.title, 'Totalkostnad för ny bostad');
  assert.ok(Array.isArray(result.priceExplore.samples));
});

test('calculateScenario returns explainable chain and healthy result when equity covers purchase', () => {
  const result = calculateScenario({
    currentHome: {
      marketValue: 5200000,
      purchasePrice: 0,
      brokerFeePercent: 3,
      loans: [{ id: 'a', amount: 1250000 }, { id: 'b', amount: 980000 }]
    },
    newHome: {
      price: 6250000,
      existingDeeds: 3000000,
      renovationCost: 100000,
      otherCosts: 25000
    },
    assumptions: {
      downPaymentPercent: 15,
      stampDutyPercent: 1.5,
      deedPercent: 2,
      brokerFeeMode: 'percent',
      brokerFeePercent: 3,
      brokerFeeFixed: 100000
    }
  });

  assert.equal(result.status, 'good');
  assert.ok(result.capitalSurplus > 0);
  assert.ok(result.saleProceeds > 0);
  assert.deepEqual(result.explanation.chain, ['saleProceeds', 'equity', 'downPayment', 'requiredOwnCash', 'requiredLoan', 'loanToValue']);
  assert.equal(result.explanation.steps.saleProceeds.formula, 'Försäljningspris - bolån - mäklararvode');
});
