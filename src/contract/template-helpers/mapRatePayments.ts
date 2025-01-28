const mapRatePayments = function (ratePrices) {
  const generateTermMap = function (term) {
    const result = ratePrices
      .filter((item) => {
        if (item.rateType === term) return item;
      })
      .map((item) => {
        const termLength = Math.floor(item.term / 12);
        const ratePercent = item.rate / 100;
        const centsToDollars = item.minPaymentAmountInCents / 100;
        const paymentInUSD = centsToDollars.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        return [`${termLength} year`, `${ratePercent}%`, paymentInUSD];
      });
    return result;
  };

  const fixed = generateTermMap("fixed");
  const variable = generateTermMap("variable");

  const result = {
    ...(Array.isArray(fixed) && fixed.length ? { fixedData: fixed } : {}),
    ...(Array.isArray(variable) && variable.length
      ? { variableData: variable }
      : {}),
  };
  return result;
};

export default mapRatePayments;
