import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ProductView from '../ProductView.vue';

function createTestStore({ state = {}, fetchProduct = vi.fn() } = {}) {
  return createStore({
    modules: {
      checkout: {
        namespaced: true,
        state: () => ({
          product: null,
          loading: false,
          error: null,
          ...state,
        }),
        actions: {
          fetchProduct,
        },
      },
    },
  });
}

function mountView({ store, routerPush = vi.fn(), productId = 'prod-002' } = {}) {
  return mount(ProductView, {
    global: {
      plugins: [store],
      mocks: {
        $route: { params: { productId } },
        $router: { push: routerPush },
      },
    },
  });
}

describe('ProductView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches fetchProduct with the productId from the route on created', () => {
    const fetchProduct = vi.fn();
    const store = createTestStore({ fetchProduct });

    mountView({ store, productId: 'prod-002' });

    expect(fetchProduct).toHaveBeenCalledWith(expect.anything(), 'prod-002');
  });

  it('shows the loading message while loading is true', () => {
    const store = createTestStore({ state: { loading: true } });
    const wrapper = mountView({ store });

    expect(wrapper.find('.state-msg').text()).toBe('Loading product...');
    expect(wrapper.find('.product-card').exists()).toBe(false);
  });

  it('shows the error message when an error is present', () => {
    const store = createTestStore({ state: { error: 'Product not found' } });
    const wrapper = mountView({ store });

    expect(wrapper.find('.state-msg--error').text()).toBe('Product not found');
  });

  it('renders the product details and formatted price when a product is loaded', () => {
    const product = {
      id: 'prod-002',
      name: 'Noise Cancelling Headphones',
      description: 'Great sound.',
      priceInCents: 45000000,
      stock: 8,
      imageUrl: 'https://example.com/headphones.jpg',
    };
    const store = createTestStore({ state: { product } });
    const wrapper = mountView({ store });

    const expectedPrice = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(product.priceInCents / 100);

    expect(wrapper.find('h1').text()).toBe(product.name);
    expect(wrapper.find('.product-card__description').text()).toBe(product.description);
    expect(wrapper.find('.product-card__price').text()).toBe(expectedPrice);
    expect(wrapper.find('.product-card__stock').text()).toBe('8 available');
    expect(wrapper.find('img').attributes('src')).toBe(product.imageUrl);
  });

  it('shows "Out of stock" and disables the buy button when stock is 0', () => {
    const product = {
      id: 'prod-002',
      name: 'Sold out item',
      description: 'desc',
      priceInCents: 1000000,
      stock: 0,
      imageUrl: 'x.jpg',
    };
    const store = createTestStore({ state: { product } });
    const wrapper = mountView({ store });

    expect(wrapper.find('.product-card__stock').text()).toBe('Out of stock');
    expect(wrapper.find('.product-card__stock--empty').exists()).toBe(true);
    expect(wrapper.find('button.btn--primary').element.disabled).toBe(true);
  });

  it('navigates to the payment view with the current productId when "Buy now" is clicked', async () => {
    const product = {
      id: 'prod-002',
      name: 'In stock item',
      description: 'desc',
      priceInCents: 1000000,
      stock: 3,
      imageUrl: 'x.jpg',
    };
    const store = createTestStore({ state: { product } });
    const routerPush = vi.fn();
    const wrapper = mountView({ store, routerPush, productId: 'prod-002' });

    await wrapper.find('button.btn--primary').trigger('click');

    expect(routerPush).toHaveBeenCalledWith({
      name: 'payment',
      params: { productId: 'prod-002' },
    });
  });
});
