const sharedGlobals = {
  AbortController: 'readonly',
  Blob: 'readonly',
  Buffer: 'readonly',
  FileReader: 'readonly',
  HTMLInputElement: 'readonly',
  HTMLSelectElement: 'readonly',
  URL: 'readonly',
  atob: 'readonly',
  btoa: 'readonly',
  caches: 'readonly',
  confirm: 'readonly',
  console: 'readonly',
  crypto: 'readonly',
  document: 'readonly',
  fetch: 'readonly',
  globalThis: 'readonly',
  history: 'readonly',
  location: 'readonly',
  localStorage: 'readonly',
  navigator: 'readonly',
  prompt: 'readonly',
  self: 'readonly',
  setTimeout: 'readonly',
  structuredClone: 'readonly',
  window: 'readonly'
};

export default [
  {
    ignores: ['node_modules/**', 'vendor/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: sharedGlobals
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
    }
  }
];
