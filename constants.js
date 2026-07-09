export const APP_NAME = 'Bostadskalkyl';
export const STORAGE_KEY = 'bostadskalkyl-store';
export const STORAGE_VERSION = 1;

export const DEFAULT_BROKER_FEE_RATE = 3;
export const DEFAULT_DOWN_PAYMENT_PERCENT = 15;
export const DEFAULT_STAMP_DUTY_PERCENT = 1.5;
export const DEFAULT_DEED_PERCENT = 2;
export const DEFAULT_BROKER_FEE_MODE = 'percent';
export const DEFAULT_BROKER_FEE_FIXED = 100000;

export const MAX_LOAN_TO_VALUE = 0.85;
export const DOWN_PAYMENT_RATE = DEFAULT_DOWN_PAYMENT_PERCENT / 100;
export const STAMP_DUTY_RATE = DEFAULT_STAMP_DUTY_PERCENT / 100;
export const STAMP_DUTY_FIXED_FEE = 825;
export const DEED_RATE = DEFAULT_DEED_PERCENT / 100;
export const DEED_FIXED_FEE = 375;
export const LOW_MARGIN_THRESHOLD = 50000;

export const PRICE_SLIDER_MIN_FACTOR = 0.7;
export const PRICE_SLIDER_MAX_FACTOR = 2;
export const PRICE_EXPLORE_STEPS = 5;

export const OFFLINE_CACHE = 'bostadskalkyl-v1';
export const CACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './state.js',
  './calculations.js',
  './storage.js',
  './ui.js',
  './constants.js',
  './utils.js',
  './manifest.json',
  './sw.js',
  './icon.svg',
  './vendor/lz-string.js'
];
