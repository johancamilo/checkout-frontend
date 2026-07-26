<template>
  <div class="card-preview" :class="`card-preview--${brand}`">
    <div class="card-preview__glow"></div>

    <div class="card-preview__top">
      <div class="card-preview__chip">
        <span v-for="n in 6" :key="n" class="card-preview__chip-line"></span>
      </div>
      <span class="card-preview__label">Credit Card</span>
    </div>

    <p class="card-preview__number">{{ displayNumber }}</p>

    <div class="card-preview__bottom">
      <div class="card-preview__holder">
        <span class="card-preview__field-label">Cardholder</span>
        <span class="card-preview__field-value">{{ displayHolder }}</span>
      </div>
      <div class="card-preview__expiry">
        <span class="card-preview__field-label">Valid thru</span>
        <span class="card-preview__field-value">{{ displayExpiry }}</span>
      </div>

      <div class="card-preview__brand">
        <span v-if="brand === 'visa'" class="card-preview__visa-logo">VISA</span>
        <span v-else-if="brand === 'mastercard'" class="card-preview__mc-logo">
          <span class="card-preview__mc-circle card-preview__mc-circle--red"></span>
          <span class="card-preview__mc-circle card-preview__mc-circle--yellow"></span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CardPreview',
  props: {
    number: { type: String, default: '' },
    cardHolder: { type: String, default: '' },
    expMonth: { type: String, default: '' },
    expYear: { type: String, default: '' },
    brand: { type: String, default: 'unknown' },
  },
  computed: {
    displayNumber() {
      const digitsOnly = this.number.replace(/\s/g, '');
      const groups = ['', '', '', ''];
      for (let i = 0; i < 4; i += 1) {
        const chunk = digitsOnly.slice(i * 4, i * 4 + 4);
        groups[i] = chunk ? chunk.padEnd(4, '•') : '••••';
      }
      return groups.join('  ');
    },
    displayHolder() {
      return this.cardHolder.trim() ? this.cardHolder.toUpperCase() : 'YOUR NAME';
    },
    displayExpiry() {
      const mm = this.expMonth || 'MM';
      const yy = this.expYear || 'YY';
      return `${mm}/${yy}`;
    },
  },
};
</script>

<style lang="scss" scoped src="@/assets/styles/components/CardPreview.scss"></style>