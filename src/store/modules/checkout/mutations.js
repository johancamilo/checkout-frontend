import { STORAGE_KEY } from './state';

function persistToStorage(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    product: state.product,
    customer: state.customer,
    delivery: state.delivery,
    transaction: state.transaction,
    // card intentionally excluded — never written to localStorage
  }));
}

export default {
  SET_PRODUCT(state, product) {
    state.product = product;
    persistToStorage(state);
  },
  SET_CUSTOMER(state, customer) {
    state.customer = customer;
    persistToStorage(state);
  },
  SET_DELIVERY(state, delivery) {
    state.delivery = delivery;
    persistToStorage(state);
  },
  SET_TRANSACTION(state, transaction) {
    state.transaction = transaction;
    persistToStorage(state);
  },
  SET_CARD(state, card) {
    state.card = card;
    // No persistToStorage call here — card data stays in-memory only.
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  RESET_CHECKOUT(state) {
    state.customer = null;
    state.delivery = null;
    state.transaction = null;
    state.card = null;
    state.error = null;
    persistToStorage(state);
  },
};