jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../api';
import { checkoutService } from '../checkout.service';

describe('checkoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getProduct fetches a product by id', async () => {
    api.get.mockResolvedValue({ data: { id: 'prod-002', name: 'Headphones' } });

    const result = await checkoutService.getProduct('prod-002');

    expect(api.get).toHaveBeenCalledWith('/products/prod-002');
    expect(result).toEqual({ id: 'prod-002', name: 'Headphones' });
  });

  it('createTransaction posts the payload to /transactions', async () => {
    const payload = {
      productId: 'prod-002',
      quantity: 1,
      deliveryFeeInCents: 800000,
      customer: { fullName: 'Jane Doe' },
      delivery: { addressLine: '123 Main Street' },
    };
    api.post.mockResolvedValue({ data: { transactionId: 'tx-1', status: 'PENDING' } });

    const result = await checkoutService.createTransaction(payload);

    expect(api.post).toHaveBeenCalledWith('/transactions', payload);
    expect(result).toEqual({ transactionId: 'tx-1', status: 'PENDING' });
  });

  it('getTransaction fetches a transaction by id', async () => {
    api.get.mockResolvedValue({ data: { transactionId: 'tx-1', status: 'APPROVED' } });

    const result = await checkoutService.getTransaction('tx-1');

    expect(api.get).toHaveBeenCalledWith('/transactions/tx-1');
    expect(result).toEqual({ transactionId: 'tx-1', status: 'APPROVED' });
  });

  it('confirmPayment posts the card and transactionId to /transactions/:id/payments', async () => {
    const card = { number: '4242424242424242', cvc: '123', expMonth: '12', expYear: '29', cardHolder: 'Jane Doe' };
    api.post.mockResolvedValue({ data: { transactionId: 'tx-1', status: 'APPROVED' } });

    const result = await checkoutService.confirmPayment('tx-1', card);

    expect(api.post).toHaveBeenCalledWith('/transactions/tx-1/payments', {
      transactionId: 'tx-1',
      card,
    });
    expect(result).toEqual({ transactionId: 'tx-1', status: 'APPROVED' });
  });
});
