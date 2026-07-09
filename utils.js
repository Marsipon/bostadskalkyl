const integerFormatter = new Intl.NumberFormat('sv-SE');
const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 0
});
const percentFormatter = new Intl.NumberFormat('sv-SE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
});

export function sanitizeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function parseIntegerInput(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  const digitsOnly = String(value ?? '').replace(/[^\d]/g, '');
  return digitsOnly ? Number.parseInt(digitsOnly, 10) : 0;
}

export function parsePercentInput(value) {
  const normalized = String(value ?? '').replace(',', '.').trim();
  if (!normalized) {
    return 0;
  }

  const numericValue = Number.parseFloat(normalized);
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
}

export function formatIntegerInput(value) {
  const normalized = parseIntegerInput(value);
  return normalized > 0 ? integerFormatter.format(normalized) : '';
}

export function formatCurrency(value) {
  return currencyFormatter.format(sanitizeNumber(value));
}

export function formatPercent(value) {
  return `${percentFormatter.format(sanitizeNumber(value))} %`;
}

export function formatPercentInput(value) {
  const normalized = parsePercentInput(value);
  return normalized > 0 ? String(normalized).replace('.', ',') : '';
}

export function formatLoanToValue(value) {
  return `${Math.round(sanitizeNumber(value) * 100)} %`;
}

export function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat('sv-SE', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch {
    return '';
  }
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `calc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCompressor() {
  const compressor = globalThis.LZString;

  if (!compressor) {
    throw new Error('LZString är inte tillgängligt.');
  }

  return compressor;
}

function encodeBase64(value) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value).toString('base64');
  }

  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < value.length; index += chunkSize) {
    binary += String.fromCharCode(...value.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function decodeBase64(value) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'));
  }

  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

export function encodeShareState(payload) {
  const compressed = getCompressor().compressToUint8Array(JSON.stringify(payload));
  return encodeBase64(compressed).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeShareState(value) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const json = getCompressor().decompressFromUint8Array(decodeBase64(padded));

  return json ? JSON.parse(json) : null;
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Kunde inte läsa filen.'));
    reader.readAsText(file);
  });
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement('textarea');
  input.value = text;
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}
