/**
 * Formats an amount in cents as Colombian Peso currency, e.g. 4500000 -> "$ 45.000".
 * Single source of truth — previously duplicated in ProductView, SummaryView
 * and ResultView.
 */
export function formatMoney(cents) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}