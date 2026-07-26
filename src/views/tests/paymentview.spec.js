import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import PaymentView from '../PaymentView.vue';

function createTestStore({
  state = {},
  createTransaction = jest.fn(),
  setCardData = jest.fn(),
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

function mountView({ store, routerPush = jest.fn(), productId = 'prod-002' } = {}) {
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
  await wrapper.find('input[placeholder="As shown on the card (min. 5 characters)"]').setValue('Jane Doe');

  await wrapper.find('input[placeholder="John Doe"]').setValue('Jane Doe');
  await wrapper.find('input[placeholder="juan@email.com"]').setValue('jane@example.com');
  await wrapper.find('input[placeholder="3001234567"]').setValue('3001234567');
  await wrapper.find('input[placeholder="1234567890"]').setValue('123456789');

  await wrapper.find('input[placeholder="123 Main Street"]').setValue('123 Main Street');
  const newYorkInputs = wrapper.findAll('input[placeholder="New York"]');
  await newYorkInputs[0].setValue('New York');
  await newYorkInputs[1].setValue('New York');
  await wrapper.find('input[placeholder="110111"]').setValue('110111');

  await wrapper.vm.$nextTick();
}

describe('PaymentView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(wrapper.find('.field-error').text()).toBe('Invalid card number');
  });

  it('shows a validation error for an expired card once the expiry is touched', async () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    wrapper.vm.card.expMonth = '01';
    wrapper.vm.card.expYear = '20';
    wrapper.vm.touched.expiry = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.field-error').text()).toBe('The expiration date is invalid or has expired');
  });

  it('rejects a CVC with non-numeric characters even if the length is right', async () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    wrapper.vm.card.cvc = 'ab1';
    wrapper.vm.touched.cvc = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.errors.cvc).toBe('The CVC must contain only digits');
  });

  it('does not submit when the form is invalid', async () => {
    const createTransaction = jest.fn();
    const store = createTestStore({ createTransaction });
    const wrapper = mountView({ store });

    await wrapper.find('form').trigger('submit.prevent');

    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('creates the transaction, stores the card and navigates to summary on a valid submit', async () => {
    const createTransaction = jest.fn().mockResolvedValue({ transactionId: 'tx-1' });
    const setCardData = jest.fn();
    const store = createTestStore({ createTransaction, setCardData });
    const routerPush = jest.fn();
    const wrapper = mountView({ store, routerPush, productId: 'prod-002' });

    await fillValidForm(wrapper);
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick(); // flush the async handleSubmit

    expect(createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        customer: expect.objectContaining({ fullName: 'Jane Doe' }),
        delivery: expect.objectContaining({ addressLine: '123 Main Street' }),
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
    const createTransaction = jest.fn().mockRejectedValue({
      response: { data: { message: 'Insufficient stock' } },
    });
    const store = createTestStore({ createTransaction });
    const routerPush = jest.fn();
    const wrapper = mountView({ store, routerPush });

    await fillValidForm(wrapper);
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.submit-error').text()).toBe('Insufficient stock');
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('falls back to a generic submit error message when the response has no message', async () => {
    const createTransaction = jest.fn().mockRejectedValue(new Error('network down'));
    const store = createTestStore({ createTransaction });
    const wrapper = mountView({ store });

    await fillValidForm(wrapper);
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.submit-error').text()).toBe('The transaction could not be created');
  });

  it('marks each field as touched on blur', async () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    const blurTargets = [
      ['input[placeholder="12"]', 'expiry'],
      ['input[placeholder="29"]', 'expiry'],
      ['input[placeholder="123"]', 'cvc'],
      ['input[placeholder="As shown on the card (min. 5 characters)"]', 'cardHolder'],
      ['input[placeholder="John Doe"]', 'fullName'],
      ['input[placeholder="juan@email.com"]', 'email'],
      ['input[placeholder="3001234567"]', 'phoneNumber'],
      ['input[placeholder="1234567890"]', 'documentNumber'],
      ['input[placeholder="123 Main Street"]', 'addressLine'],
    ];

    for (const [selector, key] of blurTargets) {
      await wrapper.find(selector).trigger('blur');
      expect(wrapper.vm.touched[key]).toBe(true);
    }

    const newYorkInputs = wrapper.findAll('input[placeholder="New York"]');
    await newYorkInputs[0].trigger('blur');
    expect(wrapper.vm.touched.city).toBe(true);
    await newYorkInputs[1].trigger('blur');
    expect(wrapper.vm.touched.region).toBe(true);
  });

  it('pads a single-digit expiry month/year to two digits on blur', async () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    await wrapper.find('input[placeholder="12"]').setValue('1');
    await wrapper.find('input[placeholder="12"]').trigger('blur');
    expect(wrapper.vm.card.expMonth).toBe('01');

    await wrapper.find('input[placeholder="29"]').setValue('9');
    await wrapper.find('input[placeholder="29"]').trigger('blur');
    expect(wrapper.vm.card.expYear).toBe('09');
  });

  it('does not pad an expiry month/year that already has 2 digits', async () => {
    const store = createTestStore();
    const wrapper = mountView({ store });

    await wrapper.find('input[placeholder="12"]').setValue('12');
    await wrapper.find('input[placeholder="12"]').trigger('blur');
    expect(wrapper.vm.card.expMonth).toBe('12');
  });

  it('navigates back to the product view when "Back to product" is clicked', async () => {
    const store = createTestStore();
    const routerPush = jest.fn();
    const wrapper = mountView({ store, routerPush, productId: 'prod-002' });

    await wrapper.find('.back-link').trigger('click');

    expect(routerPush).toHaveBeenCalledWith({
      name: 'product',
      params: { productId: 'prod-002' },
    });
  });
});