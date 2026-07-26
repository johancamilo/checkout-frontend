import getters from '../getters';

describe('isTransactionFinal', () => {
  it('returns true for APPROVED, DECLINED and ERROR statuses', () => {
    expect(getters.isTransactionFinal({ transaction: { status: 'APPROVED' } })).toBe(true);
    expect(getters.isTransactionFinal({ transaction: { status: 'DECLINED' } })).toBe(true);
    expect(getters.isTransactionFinal({ transaction: { status: 'ERROR' } })).toBe(true);
  });

  it('returns false for a non-final status', () => {
    expect(getters.isTransactionFinal({ transaction: { status: 'PENDING' } })).toBe(false);
  });

  it('returns false when there is no transaction in state', () => {
    expect(getters.isTransactionFinal({ transaction: null })).toBe(false);
  });
});
