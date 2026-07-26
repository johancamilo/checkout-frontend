// Luhn algorithm — validates the card number checksum
export function isValidLuhn(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// Detects card brand from the leading digits (BIN ranges)
export function detectCardBrand(cardNumber) {
  const digits = (cardNumber || '').replace(/\D/g, '');
  if (digits.length < 2) return 'unknown';
 
  if (digits[0] === '4') return 'visa';
 
  const firstTwo = Number(digits.slice(0, 2));
  const firstFour = Number(digits.slice(0, 4));
 
  const isLegacyMastercard = firstTwo >= 51 && firstTwo <= 55;
  const isNewMastercard = digits.length >= 4 && firstFour >= 2221 && firstFour <= 2720;
 
  if (isLegacyMastercard || isNewMastercard) return 'mastercard';
 
  return 'unknown';
}

// Checks the expiry (month/year) is not in the past
export function isFutureExpiry(expMonth, expYear) {
  const month = parseInt(expMonth, 10);
  const year = parseInt(expYear, 10) + 2000;

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

// Formats "4242424242424242" -> "4242 4242 4242 4242" for display
export function formatCardNumber(cardNumber) {
  return cardNumber
    .replace(/\D/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();
}