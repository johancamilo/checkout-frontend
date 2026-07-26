<template>
  <div class="result-view">
    <div v-if="!transaction" class="state-msg">
      No hay información de transacción. <router-link to="/">Volver al inicio</router-link>
    </div>

    <div v-else class="result-card" :class="resultClass">
      <div class="icon">{{ resultIcon }}</div>
      <h1>{{ resultTitle }}</h1>
      <p class="message">{{ resultMessage }}</p>

      <div class="details">
        <div class="detail-row">
          <span>Referencia</span>
          <span>{{ transaction.transactionId }}</span>
        </div>
        <div class="detail-row">
          <span>Total</span>
          <span>{{ formatMoney(transaction.totalAmountInCents) }}</span>
        </div>
      </div>

      <button class="btn btn--primary" @click="handleContinue">
        Volver al producto
      </button>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

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
        APPROVED: '¡Pago aprobado!',
        DECLINED: 'Pago rechazado',
        ERROR: 'Algo salió mal',
      }[this.transaction?.status] ?? 'Algo salió mal';
    },
    resultMessage() {
      return {
        APPROVED: 'Tu pedido fue confirmado y va en camino.',
        DECLINED: 'El banco rechazó la transacción. Intentá con otra tarjeta.',
        ERROR: 'Ocurrió un error procesando el pago. Intentá de nuevo.',
      }[this.transaction?.status] ?? 'Ocurrió un error procesando el pago.';
    },
  },
  methods: {
    ...mapActions('checkout', ['resetCheckout']),
    formatMoney(cents) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(cents / 100);
    },
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