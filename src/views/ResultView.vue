<template>
  <div class="result-view">
    <div v-if="!transaction" class="state-msg">
      No transaction information is available. <router-link to="/">Back to home</router-link>
    </div>

    <div v-else class="result-card" :class="resultClass">
      <div class="icon">{{ resultIcon }}</div>
      <h1>{{ resultTitle }}</h1>
      <p class="message">{{ resultMessage }}</p>

      <div class="details">
        <div class="detail-row">
          <span>Reference</span>
          <span>{{ transaction.transactionId }}</span>
        </div>
        <div class="detail-row">
          <span>Total</span>
          <span>{{ formatMoney(transaction.totalAmountInCents) }}</span>
        </div>
      </div>

      <button class="btn btn--primary" @click="handleContinue">
        Back to product
      </button>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { formatMoney } from '@/utils/format';

export default {
  name: 'ResultView',
  computed: {
    ...mapState('checkout', ['transaction']),
    resultClass() {
      return `result-card--${(this.transaction?.status ?? 'error').toLowerCase()}`;
    },
    resultIcon() {
      return { APPROVED: '✓', DECLINED: '✕', ERROR: '!' }[this.transaction?.status] ?? '!';
    },
    resultTitle() {
      return {
        APPROVED: 'Payment approved!',
        DECLINED: 'Payment declined',
        ERROR: 'Something went wrong',
      }[this.transaction?.status] ?? 'Something went wrong';
    },
    resultMessage() {
      return {
        APPROVED: 'Your order was confirmed and is on its way.',
        DECLINED: 'The bank declined the transaction. Try another card.',
        ERROR: 'An error occurred while processing the payment. Please try again.',
      }[this.transaction?.status] ?? 'An error occurred while processing the payment.';
    },
  },
  methods: {
    ...mapActions('checkout', ['resetCheckout']),
    formatMoney,
    handleContinue() {
      const productId = this.$route.params.productId;
      this.resetCheckout();
      // Vista 5 from the challenge spec: redirect to the product page,
      // which will re-fetch it and show the updated stock.
      this.$router.push({ name: 'product', params: { productId } });
    },
  },
};
</script>

<style lang="scss" scoped src="@/assets/styles/views/ResultView.scss"></style>