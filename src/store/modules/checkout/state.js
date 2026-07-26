const STORAGE_KEY = 'checkout-state';

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const persisted = loadFromStorage();

export default function state() {
  return {
    product: persisted?.product ?? null,
    customer: persisted?.customer ?? null,
    delivery: persisted?.delivery ?? null,
    transaction: persisted?.transaction ?? null,
    // Raw card data — kept ONLY in memory, never persisted to localStorage
    // (see mutations.js: SET_CARD does not call persistToStorage).
    // Lost on page refresh by design; the user re-enters it if that happens.
    card: null,
    loading: false,
    error: null,
  };
}

export { STORAGE_KEY };