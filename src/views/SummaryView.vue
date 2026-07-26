<template>
  <div class="summary-view">
    <button class="back-link" @click="goBack">&larr; Back to edit details</button>

    <h1>Order summary</h1>

    <div v-if="!product || !transaction" class="state-msg state-msg--error">
      There is no transaction in progress. Start again from the product.
    </div>

    <template v-else>
      <section class="summary-card">
        <h2>Product</h2>
        <div class="product-row">
          <img :src="product.imageUrl" :alt="product.name" width="64" height="64" loading="lazy" />
          <div>
            <p class="product-row__name">{{ product.name }}</p>
            <p class="product-row__desc">{{ product.description }}</p>
          </div>
        </div>
      </section>

      <section class="summary-card">
        <h2>Delivery</h2>
        <p>{{ customer.fullName }}</p>
        <p>{{ delivery.addressLine }}</p>
        <p>{{ delivery.city }}, {{ delivery.region }}</p>
        <p v-if="delivery.postalCode">Postal code {{ delivery.postalCode }}</p>
        <p class="muted">{{ customer.email }} · {{ customer.phoneNumber }}</p>
      </section>

      <section class="summary-card">
        <h2>Payment</h2>
        <div class="totals-row">
          <span>Product</span>
          <span>{{ formatMoney(transaction.productAmountInCents) }}</span>
        </div>
        <div class="totals-row">
          <span>Base fee</span>
          <span>{{ formatMoney(transaction.baseFeeInCents) }}</span>
        </div>
        <div class="totals-row">
          <span>Delivery</span>
          <span>{{ formatMoney(transaction.deliveryFeeInCents) }}</span>
        </div>
        <div class="totals-row totals-row--total">
          <span>Total</span>
          <span>{{ formatMoney(transaction.totalAmountInCents) }}</span>
        </div>
      </section>

      <p v-if="submitError" class="submit-error">{{ submitError }}</p>

      <button class="btn btn--primary" :disabled="loading" @click="handleConfirm">
        {{ loading ? 'Processing payment...' : 'Confirm and pay' }}
      </button>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { formatMoney } from '@/utils/format';

export default {
  name: 'SummaryView',
  computed: {
    ...mapState('checkout', ['product', 'customer', 'delivery', 'transaction', 'card', 'loading']),
  },
  created() {
    // Guard: if someone lands here directly (refresh, back button after
    // reset, etc.) without card data in memory, send them back to re-enter it.
    if (!this.card || !this.transaction) {
      this.$router.replace({ name: 'payment', params: { productId: this.$route.params.productId } });
    }
  },
  data() {
    return { submitError: null };
  },
  methods: {
    ...mapActions('checkout', ['confirmPayment']),
    formatMoney,
    goBack() {
      this.$router.push({ name: 'payment', params: { productId: this.$route.params.productId } });
    },
    async handleConfirm() {
      this.submitError = null;
      try {
        await this.confirmPayment(this.card);
        this.$router.push({ name: 'result', params: { productId: this.$route.params.productId } });
      } catch (err) {
        this.submitError = err.response?.data?.message ?? 'The payment could not be processed';
      }
    },
  },
};
</script>

<style lang="scss" scoped src="@/assets/styles/views/SummaryView.scss"></style>