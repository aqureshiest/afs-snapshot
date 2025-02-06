// c8 ignore file
export function dollarsToCents(n: number) {
  if (n) {
    const value = Number(n);
    let cents = (value + "").replace(/[^\d.-]/g, "");
    if (cents && cents.includes(".")) {
      cents = cents.substring(0, cents.indexOf(".") + 3);
    }
    return cents ? Math.round(parseFloat(cents) * 100) : 0;
  }
}

export function centsToDollars(n) {
  const result = parseFloat((n + "").replace(/[^\d.-]/g, ""));
  return result ? result / 100 : 0;
}

export function formatUSD(...args) {
  const [v1, noDecimal] = Array.prototype.slice.call(args, 0, -1);
  return centsToDollars(v1).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    ...(noDecimal ? { minimumFractionDigits: 0 } : {}),
  });
}
