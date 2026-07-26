import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import PaymentView from '../PaymentView.vue';

function createTestStore({
  state = {},
  createTransaction = vi.fn(),
  setCardData = vi.fn(),
} = {}) {
  return createStore({
    modules: {
      checkout: {
        namespaced: true,
        state: () => ({ loading: false, ...state }),
        actions: { createTransaction, setCardData },
      },
    },
  });
}

function mountView({ store, routerPush = vi.fn(), productId = 'prod-002' } = {}) {
  return mount(PaymentView, {
    global: {
      plugins: [store],
      mocks: {
        $route: { params: { productId } },
        $router: { push: routerPush },
      },
    },
  });
}

// Valid Visa test card that also passes Luhn (the one used through the whole project).
const VALID_CARD_NUMBER = '4242424242424242';

// Fills the form the way a real user would: dispatching `input` events on
// the actual DOM elements via setValue(), instead of assigning wrapper.vm.*
// directly. This matters for coverage: each v-model input compiles to an
// inline listener that only runs when the DOM element actually receives an
// `input` event — assigning the underlying data property directly bypasses
// that listener entirely and leaves it uncovered.
async function fillValidForm(wrapper) {
  const cardNumberInput = wrapper.find('input[placeholder="4242 4242 4242 4242"]');
  await cardNumberInput.setValue(VALID_CARD_NUMBER);

  await wrapper.find('input[placeholder="12"]').setValue('12'); // expMonth
  await wrapper.find('input[placeholder="29"]').setValue('99'); // expYear
  await wrapper.find('input[placeholder="123"]').setValue('123'); // cvc
  await wrapper.find('input[placeholder="Como aparece en la tarjeta"]').setValue('Jane Doe');

  await wrapper.find('input[placeholder="Juan Pérez"]').setValue('Jane Doe');
  await wrapper.find('input[placeholder="juan@email.com"]').setValue('jane@example.com');
  await wrapper.find('input[placeholder="3001234567"]').setValue('3001234567');
  await wrapper.find('input[placeholder="1234567890"]').setValue('123456789');

  await wrapper.find('input[placeholder="Calle 123 #45-67"]').setValue('Calle 123 #45-67');
  await wrapper.find('input[placeholder="Bogotá"]').setValue('Bogota');
  await wrapper.find('input[placeholder="Cundinamarca"]').setValue('Cundinamarca');
  await wrapper.find('input[placeholder="110111"]').setValue('110111');

  await wrapper.vm.$nextTick();
}

describe('PaymentView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables the submit button when the form is empty/invalid', () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    expect(wrapper.find('button[type="submit"]').element.disabled).toBe(true);
  });

  it('enables the submit button once all fields are valid', async () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    await fillValidForm(wrapper);

    expect(wrapper.find('button[type="submit"]').element.disabled).toBe(false);
  });

  it('formats and stores digits-only when typing the card number, and marks it as touched', async () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    const input = wrapper.find('input[placeholder="4242 4242 4242 4242"]');
    await input.setValue('4242 4242 4242 4242');

    expect(wrapper.vm.card.number).toBe(VALID_CARD_NUMBER);
    expect(wrapper.vm.touched.number).toBe(true);
  });

  it('shows the detected card brand once a recognizable number is entered', async () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    wrapper.vm.card.number = VALID_CARD_NUMBER;
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.card-brand').exists()).toBe(true);
    expect(wrapper.find('.card-brand').text()).toBe('visa');
  });

  it('shows a validation error for an invalid card number once touched', async () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    wrapper.vm.card.number = '4242424242424241'; // fails Luhn
    wrapper.vm.touched.number = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.field-error').text()).toBe('Número de tarjeta inválido');
  });

  it('shows a validation error for an expired card once the expiry is touched', async () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    wrapper.vm.card.expMonth = '01';
    wrapper.vm.card.expYear = '20';
    wrapper.vm.touched.expiry = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.field-error').text()).toBe('La tarjeta está vencida o la fecha es inválida');
  });

  it('does not submit when the form is invalid', async () => {
    const createTransaction = vi.fn();
    const store = createTestStore({ createTransaction });
    const wrapper = mountView({ store });

    await wrapper.find('form').trigger('submit.prevent');

    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('creates the transaction, stores the card and navigates to summary on a valid submit', async () => {
    const createTransaction = vi.fn().mockResolvedValue({ transactionId: 'tx-1' });
    const setCardData = vi.fn();
    const store = createTestStore({ createTransaction, setCardData });
    const routerPush = vi.fn();
    const wrapper = mountView({ store, routerPush, productId: 'prod-002' });

    await fillValidForm(wrapper);
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick(); // flush the async handleSubmit

    expect(createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        customer: expect.objectContaining({ fullName: 'Jane Doe' }),
        delivery: expect.objectContaining({ addressLine: 'Calle 123 #45-67' }),
        quantity: 1,
      }),
    );
    expect(setCardData).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ number: VALID_CARD_NUMBER }),
    );
    expect(routerPush).toHaveBeenCalledWith({
      name: 'summary',
      params: { productId: 'prod-002' },
    });
  });

  it('shows a submit error and does not navigate when the backend rejects the transaction', async () => {
    const createTransaction = vi.fn().mockRejectedValue({
      response: { data: { message: 'Insufficient stock' } },
    });
    const store = createTestStore({ createTransaction });
    const routerPush = vi.fn();
    const wrapper = mountView({ store, routerPush });

    await fillValidForm(wrapper);
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.submit-error').text()).toBe('Insufficient stock');
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('falls back to a generic submit error message when the response has no message', async () => {
    const createTransaction = vi.fn().mockRejectedValue(new Error('network down'));
    const store = createTestStore({ createTransaction });
    const wrapper = mountView({ store });

    await fillValidForm(wrapper);
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.submit-error').text()).toBe('No se pudo crear la transacción');
  });

  it('navigates back to the product view when "Volver al producto" is clicked', async () => {
    const store = createTestStore();
    const routerPush = vi.fn();
    const wrapper = mountView({ store, routerPush, productId: 'prod-002' });

    await wrapper.find('.back-link').trigger('click');

    expect(routerPush).toHaveBeenCalledWith({
      name: 'product',
      params: { productId: 'prod-002' },
    });
  });
});