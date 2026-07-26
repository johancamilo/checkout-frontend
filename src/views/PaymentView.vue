<template>
  <div class="payment-view">
    <button class="back-link" @click="goBack">&larr; Back to product</button>

    <h1>Payment and delivery details</h1>

    <form @submit.prevent="handleSubmit">
      <fieldset class="form-section">
        <legend>Card</legend>

        <label>
          Card number
          <div class="card-number-wrapper">
            <input
              v-model="cardNumberDisplay"
              type="text"
              inputmode="numeric"
              placeholder="4242 4242 4242 4242"
              maxlength="23"
              autocomplete="off"
              @input="onCardNumberInput"
              @blur="touched.number = true"
            />
            <span v-if="cardBrand !== 'unknown'" class="card-brand">{{ cardBrand }}</span>
          </div>
          <span v-if="touched.number && errors.number" class="field-error">{{ errors.number }}</span>
        </label>

        <div class="form-row">
          <label>
            Expires (MM)
            <input
              v-model="card.expMonth"
              type="text"
              inputmode="numeric"
              maxlength="2"
              placeholder="12"
              autocomplete="off"
              @input="touched.expiry = true"
              @blur="padExpiryField('expMonth')"
            />
          </label>
          <label>
            Expires (YY)
            <input
              v-model="card.expYear"
              type="text"
              inputmode="numeric"
              maxlength="2"
              placeholder="29"
              autocomplete="off"
              @input="touched.expiry = true"
              @blur="padExpiryField('expYear')"
            />
          </label>
          <label>
            CVC
            <input
              v-model="card.cvc"
              type="text"
              inputmode="numeric"
              maxlength="4"
              placeholder="123"
              autocomplete="off"
              @blur="touched.cvc = true"
            />
          </label>
        </div>
        <span v-if="touched.expiry && errors.expiry" class="field-error">{{ errors.expiry }}</span>
        <span v-if="touched.cvc && errors.cvc" class="field-error">{{ errors.cvc }}</span>

        <label>
          Cardholder name
          <input
            v-model="card.cardHolder"
            type="text"
            placeholder="As shown on the card (min. 5 characters)"
            autocomplete="off"
            @blur="touched.cardHolder = true"
          />
        </label>
        <span v-if="touched.cardHolder && errors.cardHolder" class="field-error">{{ errors.cardHolder }}</span>
      </fieldset>

      <fieldset class="form-section">
        <legend>Buyer details</legend>

        <label>
          Full name
          <input
            v-model="customer.fullName"
            type="text"
            placeholder="John Doe"
            @blur="touched.fullName = true"
          />
        </label>
        <span v-if="touched.fullName && errors.fullName" class="field-error">{{ errors.fullName }}</span>

        <label>
          Email
          <input
            v-model="customer.email"
            type="email"
            placeholder="juan@email.com"
            @blur="touched.email = true"
          />
        </label>
        <span v-if="touched.email && errors.email" class="field-error">{{ errors.email }}</span>

        <label>
          Phone number
          <input
            v-model="customer.phoneNumber"
            type="tel"
            placeholder="3001234567"
            @blur="touched.phoneNumber = true"
          />
        </label>
        <span v-if="touched.phoneNumber && errors.phoneNumber" class="field-error">{{ errors.phoneNumber }}</span>

        <label>
          Document number
          <input
            v-model="customer.documentNumber"
            type="text"
            placeholder="1234567890"
            @blur="touched.documentNumber = true"
          />
        </label>
        <span v-if="touched.documentNumber && errors.documentNumber" class="field-error">{{ errors.documentNumber }}</span>
      </fieldset>

      <fieldset class="form-section">
        <legend>Delivery address</legend>

        <label>
          Address
          <input
            v-model="delivery.addressLine"
            type="text"
            placeholder="123 Main Street"
            @blur="touched.addressLine = true"
          />
        </label>
        <span v-if="touched.addressLine && errors.addressLine" class="field-error">{{ errors.addressLine }}</span>

        <div class="form-row">
          <label>
            City
            <input
              v-model="delivery.city"
              type="text"
              placeholder="New York"
              @blur="touched.city = true"
            />
          </label>
          <label>
            Region/State
            <input
              v-model="delivery.region"
              type="text"
              placeholder="New York"
              @blur="touched.region = true"
            />
          </label>
        </div>
        <span v-if="touched.city && errors.city" class="field-error">{{ errors.city }}</span>
        <span v-if="touched.region && errors.region" class="field-error">{{ errors.region }}</span>

        <label>
          Postal code (optional)
          <input v-model="delivery.postalCode" type="text" placeholder="110111" />
        </label>
      </fieldset>

      <!-- Summary of everything blocking submission, always visible once the
           user has interacted with the form at least once. This is what
           actually answers "why is the button disabled?" without requiring
           the user to hunt field by field. -->
      <div v-if="anyTouched && disabledReasons.length" class="disabled-reasons">
        <p class="disabled-reasons__title">To continue, fix:</p>
        <ul>
          <li v-for="reason in disabledReasons" :key="reason">{{ reason }}</li>
        </ul>
      </div>

      <p v-if="submitError" class="submit-error">{{ submitError }}</p>

      <button type="submit" class="btn btn--primary" :disabled="!isFormValid || loading">
        {{ loading ? 'Processing...' : 'Continue to summary' }}
      </button>
    </form>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { isValidLuhn, detectCardBrand, isFutureExpiry, formatCardNumber } from '@/services/card-validators';

export default {
  name: 'PaymentView',
  data() {
    return {
      card: { number: '', cvc: '', expMonth: '', expYear: '', cardHolder: '' },
      customer: { fullName: '', email: '', phoneNumber: '', documentNumber: '' },
      delivery: { addressLine: '', city: '', region: '', postalCode: '' },
      cardNumberDisplay: '',
      touched: {
        number: false,
        expiry: false,
        cvc: false,
        cardHolder: false,
        fullName: false,
        email: false,
        phoneNumber: false,
        documentNumber: false,
        addressLine: false,
        city: false,
        region: false,
      },
      submitError: null,
    };
  },
  computed: {
    ...mapState('checkout', ['loading']),
    cardBrand() {
      return detectCardBrand(this.card.number);
    },
    anyTouched() {
      return Object.values(this.touched).some(Boolean);
    },
    errors() {
      const errs = {};

      if (!isValidLuhn(this.card.number)) {
        errs.number = this.card.number
          ? 'Invalid card number'
          : 'Enter the card number';
      }

      if (this.card.cvc && this.card.cvc.length < 3) {
        errs.cvc = 'The CVC must have 3 or 4 digits';
      } else if (!this.card.cvc) {
        errs.cvc = 'Enter the CVC';
      }

      if (this.card.expMonth || this.card.expYear) {
        if (!/^\d{2}$/.test(this.card.expMonth) || !/^\d{2}$/.test(this.card.expYear)) {
          errs.expiry = 'Month and year must have 2 digits (e.g. 01, 12)';
        } else if (!isFutureExpiry(this.card.expMonth, this.card.expYear)) {
          errs.expiry = 'The expiration date is invalid or has expired';
        }
      } else {
        errs.expiry = 'Enter the expiration month and year';
      }

      if (this.card.cardHolder.trim().length > 0 && this.card.cardHolder.trim().length < 5) {
        errs.cardHolder = 'The cardholder name must have at least 5 characters';
      } else if (!this.card.cardHolder.trim()) {
        errs.cardHolder = 'Enter the cardholder name';
      }

      if (this.customer.fullName.trim().length > 0 && this.customer.fullName.trim().length < 3) {
        errs.fullName = 'The name must have at least 3 characters';
      } else if (!this.customer.fullName.trim()) {
        errs.fullName = 'Enter your full name';
      }

      if (this.customer.email && !/\S+@\S+\.\S+/.test(this.customer.email)) {
        errs.email = 'Enter a valid email address';
      } else if (!this.customer.email) {
        errs.email = 'Enter your email address';
      }

      if (!this.customer.phoneNumber.trim()) {
        errs.phoneNumber = 'Enter your phone number';
      }

      if (!this.customer.documentNumber.trim()) {
        errs.documentNumber = 'Enter your document number';
      }

      if (this.delivery.addressLine.trim().length > 0 && this.delivery.addressLine.trim().length < 5) {
        errs.addressLine = 'The address must have at least 5 characters';
      } else if (!this.delivery.addressLine.trim()) {
        errs.addressLine = 'Enter the delivery address';
      }

      if (!this.delivery.city.trim()) {
        errs.city = 'Enter the city';
      }

      if (!this.delivery.region.trim()) {
        errs.region = 'Enter the region/state';
      }

      return errs;
    },
    disabledReasons() {
      // Human-readable, deduplicated version of `errors`, in a fixed
      // reading order — this is what actually gets shown next to the
      // button so the user never has to guess why it's disabled.
      const order = [
        'number', 'expiry', 'cvc', 'cardHolder',
        'fullName', 'email', 'phoneNumber', 'documentNumber',
        'addressLine', 'city', 'region',
      ];
      return order.filter((key) => this.errors[key]).map((key) => this.errors[key]);
    },
    isFormValid() {
      return Object.keys(this.errors).length === 0;
    },
  },
  methods: {
    ...mapActions('checkout', ['createTransaction', 'setCardData']),
    onCardNumberInput(event) {
      const digits = event.target.value.replace(/\D/g, '').slice(0, 19);
      this.card.number = digits;
      this.cardNumberDisplay = formatCardNumber(digits);
    },
    goBack() {
      this.$router.push({ name: 'product', params: { productId: this.$route.params.productId } });
    },
    padExpiryField(field) {
      if (this.card[field] && this.card[field].length === 1) {
        this.card[field] = this.card[field].padStart(2, '0');
      }
      this.touched.expiry = true;
    },
    touchAll() {
      Object.keys(this.touched).forEach((key) => {
        this.touched[key] = true;
      });
    },
    async handleSubmit() {
      this.submitError = null;
      this.touchAll();
      if (!this.isFormValid) return;

      try {
        await this.createTransaction({
          customer: { ...this.customer },
          delivery: { ...this.delivery, postalCode: this.delivery.postalCode || undefined },
          quantity: 1,
        });

        this.setCardData({ ...this.card });

        this.$router.push({
          name: 'summary',
          params: { productId: this.$route.params.productId },
        });
      } catch (err) {
        this.submitError = err.response?.data?.message ?? 'The transaction could not be created';
      }
    },
  },
};
</script>

<style lang="scss" scoped src="@/assets/styles/views/PaymentView.scss"></style>
