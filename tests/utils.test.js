import test from 'node:test';
import assert from 'node:assert/strict';
import lzStringPackage from 'lz-string';

import { decodeShareState, encodeShareState, formatIntegerInput, parseIntegerInput, parsePercentInput } from '../utils.js';

globalThis.LZString = lzStringPackage;

test('share state round-trips via lz-string and base64url', () => {
  const payload = {
    calculation: {
      name: 'Villa',
      state: {
        currentHome: { marketValue: 5200000, purchasePrice: 0, brokerFeePercent: 3, loans: [{ id: '1', amount: 2200000 }] },
        newHome: { price: 6250000, existingDeeds: 0, renovationCost: 100000, otherCosts: 50000 }
      }
    }
  };

  const encoded = encodeShareState(payload);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeShareState(encoded), payload);
});

test('share state encoding also works without Buffer for large payloads', () => {
  const originalBuffer = globalThis.Buffer;
  const payload = {
    calculation: {
      name: 'Stor kalkyl',
      state: {
        currentHome: {
          marketValue: 5200000,
          purchasePrice: 0,
          brokerFeePercent: 3.5,
          loans: Array.from({ length: 12000 }, (_, index) => ({
            id: `loan-${index}`,
            amount: 100000 + index
          }))
        },
        newHome: {
          price: 6250000,
          existingDeeds: 0,
          renovationCost: 100000,
          otherCosts: 50000
        }
      }
    }
  };

  try {
    globalThis.Buffer = undefined;
    const encoded = encodeShareState(payload);
    assert.deepEqual(decodeShareState(encoded), payload);
  } finally {
    globalThis.Buffer = originalBuffer;
  }
});

test('numeric helpers sanitize and format currency-like inputs', () => {
  assert.equal(parseIntegerInput('5 200 000'), 5200000);
  assert.equal(parsePercentInput('3,5'), 3.5);
  assert.equal(formatIntegerInput(5200000), '5 200 000');
});
