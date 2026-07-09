import { DEFAULT_BROKER_FEE_RATE, STORAGE_VERSION } from './constants.js';
import { createId } from './utils.js';

function now() {
  return new Date().toISOString();
}

function clone(value) {
  return structuredClone(value);
}

export function createEmptyState() {
  return {
    currentHome: {
      marketValue: 0,
      purchasePrice: 0,
      brokerFeePercent: DEFAULT_BROKER_FEE_RATE,
      loans: [{ id: createId(), amount: 0 }]
    },
    newHome: {
      price: 0,
      existingDeeds: 0,
      renovationCost: 0,
      otherCosts: 0
    }
  };
}

export function createCalculation(name = 'Ny kalkyl', baseState = createEmptyState()) {
  return {
    id: createId(),
    name,
    updatedAt: now(),
    state: clone(baseState)
  };
}

export function createDefaultStore() {
  const calculation = createCalculation('Min första kalkyl');

  return {
    version: STORAGE_VERSION,
    activeCalculation: calculation.id,
    calculations: {
      [calculation.id]: calculation
    }
  };
}

export function ensureStore(store) {
  if (!store || typeof store !== 'object' || !store.calculations || !Object.keys(store.calculations).length) {
    return createDefaultStore();
  }

  const calculations = Object.fromEntries(
    Object.values(store.calculations)
      .filter(Boolean)
      .map((calculation) => {
        const safeCalculation = {
          id: calculation.id || createId(),
          name: calculation.name || 'Importerad kalkyl',
          updatedAt: calculation.updatedAt || now(),
          state: clone(createEmptyState())
        };

        const currentHome = calculation.state?.currentHome ?? {};
        const newHome = calculation.state?.newHome ?? {};
        safeCalculation.state.currentHome.marketValue = Number(currentHome.marketValue) || 0;
        safeCalculation.state.currentHome.purchasePrice = Number(currentHome.purchasePrice) || 0;
        safeCalculation.state.currentHome.brokerFeePercent = Number(currentHome.brokerFeePercent) || DEFAULT_BROKER_FEE_RATE;
        safeCalculation.state.currentHome.loans = Array.isArray(currentHome.loans) && currentHome.loans.length
          ? currentHome.loans.map((loan) => ({ id: loan.id || createId(), amount: Number(loan.amount) || 0 }))
          : [{ id: createId(), amount: 0 }];
        safeCalculation.state.newHome.price = Number(newHome.price) || 0;
        safeCalculation.state.newHome.existingDeeds = Number(newHome.existingDeeds) || 0;
        safeCalculation.state.newHome.renovationCost = Number(newHome.renovationCost) || 0;
        safeCalculation.state.newHome.otherCosts = Number(newHome.otherCosts) || 0;

        return [safeCalculation.id, safeCalculation];
      })
  );

  const fallbackId = Object.keys(calculations)[0];

  return {
    version: STORAGE_VERSION,
    activeCalculation: calculations[store.activeCalculation] ? store.activeCalculation : fallbackId,
    calculations
  };
}

export function listCalculations(store) {
  return Object.values(store.calculations).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

export function getActiveCalculation(store) {
  return store.calculations[store.activeCalculation] ?? listCalculations(store)[0] ?? null;
}

function updateCalculation(store, calculationId, updater) {
  const nextStore = clone(store);
  const calculation = nextStore.calculations[calculationId];

  if (!calculation) {
    return nextStore;
  }

  updater(calculation);
  calculation.updatedAt = now();

  return nextStore;
}

export function createCalculationName(store) {
  return `Kalkyl ${listCalculations(store).length + 1}`;
}

export function addCalculation(store) {
  const calculation = createCalculation(createCalculationName(store));
  const nextStore = clone(store);
  nextStore.calculations[calculation.id] = calculation;
  nextStore.activeCalculation = calculation.id;
  return nextStore;
}

export function duplicateCalculation(store, calculationId) {
  const current = store.calculations[calculationId];
  if (!current) {
    return store;
  }

  const duplicate = createCalculation(`${current.name} (kopia)`, current.state);
  const nextStore = clone(store);
  nextStore.calculations[duplicate.id] = duplicate;
  nextStore.activeCalculation = duplicate.id;
  return nextStore;
}

export function renameCalculation(store, calculationId, name) {
  const trimmedName = String(name ?? '').trim();
  if (!trimmedName) {
    return store;
  }

  return updateCalculation(store, calculationId, (calculation) => {
    calculation.name = trimmedName;
  });
}

export function deleteCalculation(store, calculationId) {
  const ids = Object.keys(store.calculations);
  if (ids.length <= 1 || !store.calculations[calculationId]) {
    return store;
  }

  const nextStore = clone(store);
  delete nextStore.calculations[calculationId];
  const remaining = listCalculations(nextStore);
  nextStore.activeCalculation = nextStore.activeCalculation === calculationId ? remaining[0].id : nextStore.activeCalculation;
  return nextStore;
}

export function setActiveCalculation(store, calculationId) {
  if (!store.calculations[calculationId]) {
    return store;
  }

  return {
    ...clone(store),
    activeCalculation: calculationId
  };
}

export function updateField(store, calculationId, section, field, value) {
  return updateCalculation(store, calculationId, (calculation) => {
    calculation.state[section][field] = value;
  });
}

export function addLoan(store, calculationId) {
  return updateCalculation(store, calculationId, (calculation) => {
    calculation.state.currentHome.loans.push({ id: createId(), amount: 0 });
  });
}

export function updateLoan(store, calculationId, loanId, amount) {
  return updateCalculation(store, calculationId, (calculation) => {
    calculation.state.currentHome.loans = calculation.state.currentHome.loans.map((loan) =>
      loan.id === loanId ? { ...loan, amount } : loan
    );
  });
}

export function removeLoan(store, calculationId, loanId) {
  return updateCalculation(store, calculationId, (calculation) => {
    const remainingLoans = calculation.state.currentHome.loans.filter((loan) => loan.id !== loanId);
    calculation.state.currentHome.loans = remainingLoans.length ? remainingLoans : [{ id: createId(), amount: 0 }];
  });
}

export function importCalculation(store, payload) {
  const importedState = payload?.calculation?.state ?? payload?.state;
  if (!importedState) {
    return store;
  }

  const importedName = payload?.calculation?.name ?? payload?.name ?? createCalculationName(store);
  const calculation = createCalculation(importedName, importedState);
  const nextStore = clone(store);
  nextStore.calculations[calculation.id] = calculation;
  nextStore.activeCalculation = calculation.id;
  return ensureStore(nextStore);
}
