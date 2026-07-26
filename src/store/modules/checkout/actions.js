import { checkoutService } from '@/services/checkout.service';

// Flat delivery fee, in cents. Frontend-defined for this technical test
// (the backend accepts whatever value the client sends — see
// Transaction.create(), which only validates it's not negative).
const DELIVERY_FEE_IN_CENTS = 800000;

export default {
  async fetchProduct({ commit }, productId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    try {
      const product = await checkoutService.getProduct(productId);
      commit('SET_PRODUCT', product);
      return product;
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.message ?? 'Error getting the product');
      throw err;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async createTransaction({ commit, state }, { customer, delivery, quantity }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    commit('SET_CUSTOMER', customer);
    commit('SET_DELIVERY', delivery);
    try {
      const transaction = await checkoutService.createTransaction({
        productId: state.product.id,
        quantity,
        deliveryFeeInCents: DELIVERY_FEE_IN_CENTS,
        customer,
        delivery,
      });
      commit('SET_TRANSACTION', transaction);
      return transaction;
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.message ?? 'Error creating the transaction');
      throw err;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async confirmPayment({ commit, state }, card) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    try {
      const result = await checkoutService.confirmPayment(state.transaction.transactionId, card);
      commit('SET_TRANSACTION', result);
      return result;
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.message ?? 'Error confirming the payment');
      throw err;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  setCardData({ commit }, card) {
    commit('SET_CARD', card);
  },

  resetCheckout({ commit }) {
    commit('RESET_CHECKOUT');
  },
};
