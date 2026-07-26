import { formatMoney } from '../format';

describe('formatMoney', () => {
  it('formats whole-peso amounts without decimals', () => {
    expect(formatMoney(4500000)).toBe(
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(45000),
    );
  });

  it('formats zero correctly', () => {
    expect(formatMoney(0)).toBe(
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(0),
    );
  });

  it('rounds down partial cents (fractions of a peso)', () => {
    // 12345 cents = 123.45 pesos -> minimumFractionDigits: 0 rounds it
    expect(formatMoney(12345)).toBe(
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(123.45),
    );
  });
});