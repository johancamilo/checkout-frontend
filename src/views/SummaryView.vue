<template>
  <div class="summary-view">
    <button class="back-link" @click="goBack">&larr; Volver a editar datos</button>

    <h1>Resumen de tu compra</h1>

    <div v-if="!product || !transaction" class="state-msg state-msg--error">
      No hay una transacción en curso. Volvé a empezar desde el producto.
    </div>

    <template v-else>
      <section class="summary-card">
        <h2>Producto</h2>
        <div class="product-row">
          <img :src="product.imageUrl" :alt="product.name" />
          <div>
            <p class="product-row__name">{{ product.name }}</p>
            <p class="product-row__desc">{{ product.description }}</p>
          </div>
        </div>
      </section>

      <section class="summary-card">
        <h2>Entrega</h2>
        <p>{{ customer.fullName }}</p>
        <p>{{ delivery.addressLine }}</p>
        <p>{{ delivery.city }}, {{ delivery.region }}</p>
        <p v-if="delivery.postalCode">CP {{ delivery.postalCode }}</p>
        <p class="muted">{{ customer.email }} · {{ customer.phoneNumber }}</p>
      </section>

      <section class="summary-card">
        <h2>Pago</h2>
        <div class="totals-row">
          <span>Producto</span>
          <span>{{ formatMoney(transaction.totalAmountInCents - transaction.deliveryFeeInCents) }}</span>
        </div>
        <div class="totals-row">
          <span>Envío</span>
          <span>{{ formatMoney(transaction.deliveryFeeInCents) }}</span>
        </div>
        <div class="totals-row totals-row--total">
          <span>Total</span>
          <span>{{ formatMoney(transaction.totalAmountInCents) }}</span>
        </div>
      </section>

      <p v-if="submitError" class="submit-error">{{ submitError }}</p>

      <button class="btn btn--primary" :disabled="loading" @click="handleConfirm">
        {{ loading ? 'Procesando pago...' : 'Confirmar y pagar' }}
      </button>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

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
    formatMoney(cents) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(cents / 100);
    },
    goBack() {
      this.$router.push({ name: 'payment', params: { productId: this.$route.params.productId } });
    },
    async handleConfirm() {
      this.submitError = null;
      try {
        await this.confirmPayment(this.card);
        this.$router.push({ name: 'result', params: { productId: this.$route.params.productId } });
      } catch (err) {
        this.submitError = err.response?.data?.message ?? 'No se pudo procesar el pago';
      }
    },
  },
};
</script>

<style lang="scss" scoped src="@/assets/styles/views/SummaryView.scss"></style>