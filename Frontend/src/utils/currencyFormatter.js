import { currencySymbols } from "./currencysymbols.js";

export const SUPPORTED_CURRENCIES = ["EGP", "USD", "EUR", "SAR", "AED", "GBP"];
export { currencySymbols };

/**
 * Format amount with currency (symbol or code).
 * @param {number} amount
 * @param {string} currency - e.g. "EGP", "USD"
 * @param {boolean} useSymbol - if true use currencySymbols[currency], else currency code
 */
export function formatCurrency(amount, currency = "EGP", useSymbol = true) {
    const num = Number(amount);
    if (Number.isNaN(num)) return "—";
    const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
    const suffix = useSymbol ? (currencySymbols[currency] || currency) : ` ${currency}`;
    return `${formatted} ${suffix}`;
}
