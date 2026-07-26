import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResultView from '../ResultView.vue';

function createTestStore({ state = {}, resetCheckout = vi.fn() } = {}) {
  return createStore({
    modules: {
      checkout: {
        namespaced: true,
        state: () => ({ transaction: null, ...state }),
        actions: { resetCheckout },
      },
    },
  });
}

function mountView({ store, routerPush = vi.fn(), productId = 'prod-002' } = {}) {
  return mount(ResultView, {
    global: {
      plugins: [store],
      mocks: {
        $route: { params: { productId } },
        $router: { push: routerPush },
      },
      stubs: { RouterLink: true },
    },
  });
}

const money = (cents) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(cents / 100);

describe('ResultView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a fallback message with a link home when there is no transaction', () => {
    const store = createTestStore({ state: { transaction: null } });
    const wrapper = mountView({ store });

    expect(wrapper.find('.state-msg').exists()).toBe(true);
    expect(wrapper.find('.result-card').exists()).toBe(false);
  });

  it('renders the APPROVED state correctly', () => {
    const transaction = { transactionId: 'tx-1', status: 'APPROVED', totalAmountInCents: 53800000 };
    const store = createTestStore({ state: { transaction } });
    const wrapper = mountView({ store });

    expect(wrapper.find('.result-card').classes()).toContain('result-card--approved');
    expect(wrapper.find('.icon').text()).toBe('✓');
    expect(wrapper.find('h1').text()).toBe('Payment approved!');
    expect(wrapper.find('.message').text()).toBe('Your order was confirmed and is on its way.');
    expect(wrapper.text()).toContain('tx-1');
    expect(wrapper.text()).toContain(money(53800000));
  });

  it('renders the DECLINED state correctly', () => {
    const transaction = { transactionId: 'tx-2', status: 'DECLINED', totalAmountInCents: 10000000 };
    const store = createTestStore({ state: { transaction } });
    const wrapper = mountView({ store });

    expect(wrapper.find('.result-card').classes()).toContain('result-card--declined');
    expect(wrapper.find('.icon').text()).toBe('✕');
    expect(wrapper.find('h1').text()).toBe('Payment declined');
    expect(wrapper.find('.message').text()).toBe('The bank declined the transaction. Try another card.');
  });

  it('renders the ERROR state correctly', () => {
    const transaction = { transactionId: 'tx-3', status: 'ERROR', totalAmountInCents: 10000000 };
    const store = createTestStore({ state: { transaction } });
    const wrapper = mountView({ store });

    expect(wrapper.find('.result-card').classes()).toContain('result-card--error');
    expect(wrapper.find('.icon').text()).toBe('!');
    expect(wrapper.find('h1').text()).toBe('Something went wrong');
  });

  it('defaults to the error visuals for an unrecognized/missing status', () => {
    const transaction = { transactionId: 'tx-4', status: 'SOME_UNEXPECTED_STATUS', totalAmountInCents: 1000 };
    const store = createTestStore({ state: { transaction } });
    const wrapper = mountView({ store });

    expect(wrapper.find('.icon').text()).toBe('!');
    expect(wrapper.find('h1').text()).toBe('Something went wrong');
    expect(wrapper.find('.message').text()).toBe('An error occurred while processing the payment.');
  });

  it('resets the checkout and navigates back to the product page on "Back to product"', async () => {
    const transaction = { transactionId: 'tx-1', status: 'APPROVED', totalAmountInCents: 1000 };
    const resetCheckout = vi.fn();
    const store = createTestStore({ resetCheckout, state: { transaction } });
    const routerPush = vi.fn();
    const wrapper = mountView({ store, routerPush, productId: 'prod-002' });

    await wrapper.find('button.btn--primary').trigger('click');

    expect(resetCheckout).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith({
      name: 'product',
      params: { productId: 'prod-002' },
    });
  });
});
