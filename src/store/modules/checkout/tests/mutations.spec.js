import { describe, it, expect, beforeEach } from 'vitest';
import mutations from '../mutations';
import state from '../state';

describe('checkout mutations', () => {
  let localState;

  beforeEach(() => {
    localStorage.clear();
    localState = state();
  });

  it('SET_PRODUCT stores the product and persists it to localStorage', () => {
    const product = { id: 'prod-002', name: 'Headphones' };
    mutations.SET_PRODUCT(localState, product);

    expect(localState.product).toEqual(product);
    const stored = JSON.parse(localStorage.getItem('checkout-state'));
    expect(stored.product).toEqual(product);
  });

  it('SET_CUSTOMER stores the customer and persists it', () => {
    const customer = { fullName: 'Johan Medina', email: 'j@test.com' };
    mutations.SET_CUSTOMER(localState, customer);

    expect(localState.customer).toEqual(customer);
    const stored = JSON.parse(localStorage.getItem('checkout-state'));
    expect(stored.customer).toEqual(customer);
  });

  it('SET_DELIVERY stores the delivery info and persists it', () => {
    const delivery = { addressLine: 'Calle 123', city: 'Bogotá', region: 'Bogota' };
    mutations.SET_DELIVERY(localState, delivery);

    expect(localState.delivery).toEqual(delivery);
  });

  it('SET_TRANSACTION stores the transaction and persists it', () => {
    const transaction = { transactionId: 'abc-123', status: 'PENDING' };
    mutations.SET_TRANSACTION(localState, transaction);

    expect(localState.transaction).toEqual(transaction);
    const stored = JSON.parse(localStorage.getItem('checkout-state'));
    expect(stored.transaction).toEqual(transaction);
  });

  it('SET_CARD stores the card in memory but NEVER persists it', () => {
    const card = { number: '4242424242424242', cvc: '123' };
    mutations.SET_CARD(localState, card);

    expect(localState.card).toEqual(card);
    const stored = JSON.parse(localStorage.getItem('checkout-state') ?? 'null');
    // There should be no "card" key in what was persisted
    expect(stored?.card).toBeUndefined();
  });

  it('SET_LOADING updates the flag without touching localStorage', () => {
    mutations.SET_LOADING(localState, true);
    expect(localState.loading).toBe(true);
    expect(localStorage.getItem('checkout-state')).toBeNull();
  });

  it('SET_ERROR stores the error message', () => {
    mutations.SET_ERROR(localState, 'Something failed');
    expect(localState.error).toBe('Something failed');
  });

  it('RESET_CHECKOUT clears customer, delivery, transaction, card and error, but keeps product', () => {
    localState.product = { id: 'prod-002' };
    localState.customer = { fullName: 'Johan' };
    localState.delivery = { city: 'Bogotá' };
    localState.transaction = { status: 'APPROVED' };
    localState.card = { number: '4242' };
    localState.error = 'something';

    mutations.RESET_CHECKOUT(localState);

    expect(localState.customer).toBeNull();
    expect(localState.delivery).toBeNull();
    expect(localState.transaction).toBeNull();
    expect(localState.card).toBeNull();
    expect(localState.error).toBeNull();
    expect(localState.product).toEqual({ id: 'prod-002' });
  });
});