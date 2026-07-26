import {
  isValidLuhn,
  detectCardBrand,
  isFutureExpiry,
  formatCardNumber,
} from '../card-validators';

describe('isValidLuhn', () => {
  it('validates - approved test card (Visa)', () => {
    expect(isValidLuhn('4242424242424242')).toBe(true);
  });

  it('validates - declined test card', () => {
    expect(isValidLuhn('4111111111111111')).toBe(true);
  });

  it('rejects a number with an invalid checksum', () => {
    expect(isValidLuhn('4242424242424241')).toBe(false);
  });

  it('rejects a number that is too short', () => {
    expect(isValidLuhn('42424242')).toBe(false);
  });

  it('rejects a number that is too long', () => {
    expect(isValidLuhn('4'.repeat(25))).toBe(false);
  });

  it('ignores spaces and dashes when validating', () => {
    expect(isValidLuhn('4242 4242 4242 4242')).toBe(true);
    expect(isValidLuhn('4242-4242-4242-4242')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidLuhn('')).toBe(false);
  });

  it('covers the branch where the doubled digit does NOT exceed 9', () => {
    // All "1"s double to 2 (never >9), exercising the opposite branch of 4242...
    expect(isValidLuhn('1111111111111111')).toBe(false);
  });

  it('validates a card number whose doubled digits exceed 9 (subtraction branch)', () => {
    expect(isValidLuhn('5555555555554444')).toBe(true);
  });
});

describe('detectCardBrand', () => {
  it('detects Visa by the leading 4', () => {
    expect(detectCardBrand('4242424242424242')).toBe('visa');
  });

  it('detects Mastercard by the 51-55 range', () => {
    expect(detectCardBrand('5500000000000004')).toBe('mastercard');
  });

  it('detects Mastercard by the 2221-2720 range (new BIN)', () => {
    expect(detectCardBrand('2223000048410010')).toBe('mastercard');
  });

  it('returns unknown for an unrecognized number', () => {
    expect(detectCardBrand('6011000000000004')).toBe('unknown');
  });

  it('returns unknown for an empty string', () => {
    expect(detectCardBrand('')).toBe('unknown');
  });

  it('returns unknown just below the Mastercard 2221 BIN range', () => {
    expect(detectCardBrand('2220000000000000')).toBe('unknown');
  });

  it('returns unknown just above the Mastercard 2720 BIN range', () => {
    expect(detectCardBrand('2721000000000000')).toBe('unknown');
  });
});

describe('isFutureExpiry', () => {
  it('accepts a valid future date', () => {
    expect(isFutureExpiry('12', '99')).toBe(true);
  });

  it('rejects an invalid month (00)', () => {
    expect(isFutureExpiry('00', '30')).toBe(false);
  });

  it('rejects an invalid month (13)', () => {
    expect(isFutureExpiry('13', '30')).toBe(false);
  });

  it('rejects a past year', () => {
    expect(isFutureExpiry('01', '20')).toBe(false);
  });

  it('rejects a card that expired earlier this same year', () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (currentMonth === 1) return; // no earlier month exists in January
    const yy = String(currentYear).slice(-2);
    const pastMonth = String(currentMonth - 1).padStart(2, '0');
    expect(isFutureExpiry(pastMonth, yy)).toBe(false);
  });
});

describe('formatCardNumber', () => {
  it('groups the number into 4-digit blocks', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
  });

  it('ignores non-numeric characters already present', () => {
    expect(formatCardNumber('4242-4242-4242-4242')).toBe('4242 4242 4242 4242');
  });

  it('handles an empty string', () => {
    expect(formatCardNumber('')).toBe('');
  });
});