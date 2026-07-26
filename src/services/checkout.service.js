import api from './api';

export const checkoutService = {
  async getProduct(productId) {
    const { data } = await api.get(`/products/${productId}`);
    return data;
  },

  /**
   * payload: {
   *   productId, quantity, deliveryFeeInCents,
   *   customer: { fullName, email, phoneNumber, documentNumber },
   *   delivery: { addressLine, city, region, postalCode? }
   * }
   * Matches CreateTransactionDto exactly.
   */
  async createTransaction(payload) {
    const { data } = await api.post('/transactions', payload);
    return data;
  },

  async getTransaction(transactionId) {
    const { data } = await api.get(`/transactions/${transactionId}`);
    return data;
  },

  /**
   * card: { number, cvc, expMonth, expYear, cardHolder }
   * Matches ConfirmPaymentDto (transactionId goes in the URL, not the body,
   * per the actual route: POST /transactions/:id/payments — but the DTO
   * also carries transactionId, so we include it in the body too to match
   * the validation contract exactly).
   */
  async confirmPayment( transactionId, card) {
    const { data } = await api.post(`/transactions/${transactionId}/payments`, {
      transactionId,
      card,
    });
    return data;
  },
};