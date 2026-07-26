import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import SummaryView from '../SummaryView.vue';

const PRODUCT = {
  id: 'prod-002',
  name: 'Noise Cancelling Headphones',
  description: 'Great sound.',
  imageUrl: 'https://example.com/headphones.jpg',
};
const CUSTOMER = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phoneNumber: '3001234567',
};
const DELIVERY = { addressLine: 'Calle 123 #45-67', city: 'Bogota', region: 'Cundinamarca' };
const TRANSACTION = {
  transactionId: 'tx-1',
  productAmountInCents: 45000000,
  baseFeeInCents: 500000,
  deliveryFeeInCents: 800000,
  totalAmountInCents: 46300000,
};
const CARD = { number: '4242424242424242' };

function createTestStore({ state = {}, confirmPayment = jest.fn() } = {}) {
  return createStore({
    modules: {
      checkout: {
        namespaced: true,
        state: () => ({
          product: null,
          customer: null,
          delivery: null,
          transaction: null,
          card: null,
          loading: false,
          ...state,
        }),
        actions: { confirmPayment },
      },
    },
  });
}

function mountView({ store, routerPush = jest.fn(), routerReplace = jest.fn(), productId = 'prod-002' } = {}) {
  return mount(SummaryView, {
    global: {
      plugins: [store],
      mocks: {
        $route: { params: { productId } },
        $router: { push: routerPush, replace: routerReplace },
      },
    },
  });
}

describe('SummaryView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to the payment view when there is no card in memory', () => {
    const store = createTestStore({ state: { transaction: TRANSACTION, card: null } });
    const routerReplace = jest.fn();

    mountView({ store, routerReplace, productId: 'prod-002' });

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'payment',
      params: { productId: 'prod-002' },
    });
  });

  it('redirects to the payment view when there is no transaction', () => {
    const store = createTestStore({ state: { card: CARD, transaction: null } });
    const routerReplace = jest.fn();

    mountView({ store, routerReplace });

    expect(routerReplace).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'payment' }),
    );
  });

  it('does not redirect when both card and transaction are present', () => {
    const store = createTestStore({
      state: {
        card: CARD,
        transaction: TRANSACTION,
        product: PRODUCT,
        customer: CUSTOMER,
        delivery: DELIVERY,
      },
    });
    const routerReplace = jest.fn();

    mountView({ store, routerReplace });

    expect(routerReplace).not.toHaveBeenCalled();
  });

  it('shows an error state when the product is missing (even if card/transaction are present)', () => {
    const store = createTestStore({
      state: { card: CARD, transaction: TRANSACTION, product: null, customer: CUSTOMER, delivery: DELIVERY },
    });
    const wrapper = mountView({ store });

    expect(wrapper.find('.state-msg--error').exists()).toBe(true);
    expect(wrapper.find('.summary-card').exists()).toBe(false);
  });

  it('renders the product, delivery and payment summary with correctly formatted totals', () => {
    const store = createTestStore({
      state: { card: CARD, transaction: TRANSACTION, product: PRODUCT, customer: CUSTOMER, delivery: DELIVERY },
    });
    const wrapper = mountView({ store });

    const formatMoney = (cents) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(cents / 100);

    expect(wrapper.text()).toContain(PRODUCT.name);
    expect(wrapper.text()).toContain(DELIVERY.addressLine);
    expect(wrapper.text()).toContain(CUSTOMER.email);

    const totals = wrapper.findAll('.totals-row');
    expect(totals[0].text()).toContain(formatMoney(TRANSACTION.productAmountInCents));
    expect(totals[1].text()).toContain(formatMoney(TRANSACTION.baseFeeInCents));
    expect(totals[2].text()).toContain(formatMoney(TRANSACTION.deliveryFeeInCents));
    expect(totals[3].text()).toContain(formatMoney(TRANSACTION.totalAmountInCents));
  });

  it('confirms the payment with the in-memory card and navigates to the result view', async () => {
    const confirmPayment = jest.fn().mockResolvedValue({ transactionId: 'tx-1', status: 'APPROVED' });
    const store = createTestStore({
      confirmPayment,
      state: { card: CARD, transaction: TRANSACTION, product: PRODUCT, customer: CUSTOMER, delivery: DELIVERY },
    });
    const routerPush = jest.fn();
    const wrapper = mountView({ store, routerPush, productId: 'prod-002' });

    await wrapper.find('button.btn--primary').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(confirmPayment).toHaveBeenCalledWith(expect.anything(), CARD);
    expect(routerPush).toHaveBeenCalledWith({
      name: 'result',
      params: { productId: 'prod-002' },
    });
  });

  it('shows a submit error and does not navigate when the payment confirmation fails', async () => {
    const confirmPayment = jest.fn().mockRejectedValue({
      response: { data: { message: 'Gateway timeout' } },
    });
    const store = createTestStore({
      confirmPayment,
      state: { card: CARD, transaction: TRANSACTION, product: PRODUCT, customer: CUSTOMER, delivery: DELIVERY },
    });
    const routerPush = jest.fn();
    const wrapper = mountView({ store, routerPush });

    await wrapper.find('button.btn--primary').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.submit-error').text()).toBe('Gateway timeout');
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('falls back to a generic error message when the response has no message', async () => {
    const confirmPayment = jest.fn().mockRejectedValue(new Error('network down'));
    const store = createTestStore({
      confirmPayment,
      state: { card: CARD, transaction: TRANSACTION, product: PRODUCT, customer: CUSTOMER, delivery: DELIVERY },
    });
    const wrapper = mountView({ store });

    await wrapper.find('button.btn--primary').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.submit-error').text()).toBe('The payment could not be processed');
  });

  it('navigates back to the payment view when "Back to edit details" is clicked', async () => {
    const store = createTestStore({
      state: { card: CARD, transaction: TRANSACTION, product: PRODUCT, customer: CUSTOMER, delivery: DELIVERY },
    });
    const routerPush = jest.fn();
    const wrapper = mountView({ store, routerPush, productId: 'prod-002' });

    await wrapper.find('.back-link').trigger('click');

    expect(routerPush).toHaveBeenCalledWith({
      name: 'payment',
      params: { productId: 'prod-002' },
    });
  });
});