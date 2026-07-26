<template>
  <div class="product-view">
    <div v-if="loading" class="state-msg">Loading product...</div>
    <div v-else-if="error" class="state-msg state-msg--error">{{ error }}</div>
    <div v-else-if="product" class="product-card">
      <img :src="product.imageUrl" :alt="product.name" class="product-card__image" />
      <h1>{{ product.name }}</h1>
      <p class="product-card__description">{{ product.description }}</p>
      <p class="product-card__price">{{ formattedPrice }}</p>
      <p class="product-card__stock" :class="{ 'product-card__stock--empty': product.stock === 0 }">
        {{ product.stock > 0 ? `${product.stock} available` : 'Out of stock' }}
      </p>
      <button class="btn btn--primary" :disabled="product.stock === 0" @click="goToPayment">
        Buy now
      </button>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'ProductView',
  computed: {
    ...mapState('checkout', ['product', 'loading', 'error']),
    formattedPrice() {
      if (!this.product) return '';
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(this.product.priceInCents / 100);
    },
  },
  created() {
    this.fetchProduct(this.$route.params.productId);
  },
  methods: {
    ...mapActions('checkout', ['fetchProduct']),
    goToPayment() {
      this.$router.push({ name: 'payment', params: { productId: this.$route.params.productId } });
    },
  },
};
</script>

<style lang="scss" scoped src="@/assets/styles/views/ProductView.scss"></style>
