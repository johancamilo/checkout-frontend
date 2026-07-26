import { describe, it, expect, vi, beforeEach } from 'vitest';
import actions from '../actions';
import { checkoutService } from '@/services/checkout.service';

vi.mock('@/services/checkout.service', () => ({
  checkoutService: {
    getProduct: vi.fn(),
    createTransaction: vi.fn(),
    getTransaction: vi.fn(),
    confirmPayment: vi.fn(),
  },
}));

function makeCommit() {
  return vi.fn();
}

describe('checkout actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchProduct', () => {
    it('fetches the product and commits SET_PRODUCT on the happy path', async () => {
      const commit = makeCommit();
      const product = { id: 'prod-002', name: 'Headphones' };
      checkoutService.getProduct.mockResolvedValue(product);

      const result = await actions.fetchProduct({ commit }, 'prod-002');

      expect(checkoutService.getProduct).toHaveBeenCalledWith('prod-002');
      expect(commit).toHaveBeenCalledWith('SET_LOADING', true);
      expect(commit).toHaveBeenCalledWith('SET_PRODUCT', product);
      expect(commit).toHaveBeenCalledWith('SET_LOADING', false);
      expect(result).toEqual(product);
    });

    it('commits SET_ERROR and rethrows if the request fails', async () => {
      const commit = makeCommit();
      checkoutService.getProduct.mockRejectedValue({
        response: { data: { message: 'Product not found' } },
      });

      await expect(actions.fetchProduct({ commit }, 'prod-999')).rejects.toBeDefined();
      expect(commit).toHaveBeenCalledWith('SET_ERROR', 'Product not found');
      expect(commit).toHaveBeenCalledWith('SET_LOADING', false);
    });

    it('falls back to a generic error message when the response has no message', async () => {
      const commit = makeCommit();
      checkoutService.getProduct.mockRejectedValue(new Error('network down'));

      await expect(actions.fetchProduct({ commit }, 'prod-999')).rejects.toBeDefined();
      expect(commit).toHaveBeenCalledWith('SET_ERROR', 'Error getting the product');
    });
  });

  describe('createTransaction', () => {
    it('creates the transaction including the fixed deliveryFeeInCents', async () => {
      const commit = makeCommit();
      const state = { product: { id: 'prod-002' } };
      const transaction = { transactionId: 'tx-1', status: 'PENDING' };
      checkoutService.createTransaction.mockResolvedValue(transaction);

      const customer = { fullName: 'Johan Medina' };
      const delivery = { city: 'New York' };

      const result = await actions.createTransaction(
        { commit, state },
        { customer, delivery, quantity: 1 },
      );

      expect(checkoutService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod-002',
          quantity: 1,
          deliveryFeeInCents: expect.any(Number),
          customer,
          delivery,
        }),
      );
      expect(commit).toHaveBeenCalledWith('SET_CUSTOMER', customer);
      expect(commit).toHaveBeenCalledWith('SET_DELIVERY', delivery);
      expect(commit).toHaveBeenCalledWith('SET_TRANSACTION', transaction);
      expect(result).toEqual(transaction);
    });

    it('commits SET_ERROR when the backend rejects the transaction', async () => {
      const commit = makeCommit();
      const state = { product: { id: 'prod-002' } };
      checkoutService.createTransaction.mockRejectedValue({
        response: { data: { message: 'Insufficient stock' } },
      });

      await expect(
        actions.createTransaction({ commit, state }, { customer: {}, delivery: {}, quantity: 1 }),
      ).rejects.toBeDefined();
      expect(commit).toHaveBeenCalledWith('SET_ERROR', 'Insufficient stock');
    });

    it('falls back to a generic error message when the response has no message', async () => {
      const commit = makeCommit();
      const state = { product: { id: 'prod-002' } };
      checkoutService.createTransaction.mockRejectedValue(new Error('network down'));

      await expect(
        actions.createTransaction({ commit, state }, { customer: {}, delivery: {}, quantity: 1 }),
      ).rejects.toBeDefined();
      expect(commit).toHaveBeenCalledWith('SET_ERROR', 'Error creating the transaction');
    });
  });

  describe('confirmPayment', () => {
    it('confirms the payment using the transactionId from state', async () => {
      const commit = makeCommit();
      const state = { transaction: { transactionId: 'tx-1' } };
      const result = { transactionId: 'tx-1', status: 'APPROVED' };
      checkoutService.confirmPayment.mockResolvedValue(result);

      const card = { number: '4242424242424242', cvc: '123', expMonth: '12', expYear: '30', cardHolder: 'Johan' };
      const returned = await actions.confirmPayment({ commit, state }, card);

      expect(checkoutService.confirmPayment).toHaveBeenCalledWith('tx-1', card);
      expect(commit).toHaveBeenCalledWith('SET_TRANSACTION', result);
      expect(returned).toEqual(result);
    });

    it('commits SET_ERROR when the gateway declines the payment', async () => {
      const commit = makeCommit();
      const state = { transaction: { transactionId: 'tx-1' } };
      checkoutService.confirmPayment.mockRejectedValue({
        response: { data: { message: 'card declined' } },
      });

      await expect(
        actions.confirmPayment({ commit, state }, {}),
      ).rejects.toBeDefined();
      expect(commit).toHaveBeenCalledWith('SET_ERROR', 'card declined');
    });

    it('falls back to a generic error message when the response has no message', async () => {
      const commit = makeCommit();
      const state = { transaction: { transactionId: 'tx-1' } };
      checkoutService.confirmPayment.mockRejectedValue(new Error('timeout'));

      await expect(
        actions.confirmPayment({ commit, state }, {}),
      ).rejects.toBeDefined();
      expect(commit).toHaveBeenCalledWith('SET_ERROR', 'Error confirming the payment');
    });
  });

  describe('setCardData', () => {
    it('commits SET_CARD with the received data', () => {
      const commit = makeCommit();
      const card = { number: '4242424242424242' };

      actions.setCardData({ commit }, card);

      expect(commit).toHaveBeenCalledWith('SET_CARD', card);
    });
  });

  describe('resetCheckout', () => {
    it('commits RESET_CHECKOUT', () => {
      const commit = makeCommit();
      actions.resetCheckout({ commit });
      expect(commit).toHaveBeenCalledWith('RESET_CHECKOUT');
    });
  });
});
