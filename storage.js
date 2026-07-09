import { STORAGE_KEY, STORAGE_VERSION } from './constants.js';
import { createDefaultStore, ensureStore } from './state.js';

export function loadStore() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return createDefaultStore();
    }

    const parsedValue = JSON.parse(rawValue);
    if (parsedValue.version !== STORAGE_VERSION) {
      return ensureStore(parsedValue);
    }

    return ensureStore(parsedValue);
  } catch {
    return createDefaultStore();
  }
}

export function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
