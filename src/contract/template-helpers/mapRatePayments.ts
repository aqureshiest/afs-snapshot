const mapRatePayments = function (ratePrices) {
  enum TermLengths {
    "5 year" = 60,
    "7 year" = 84,
    "10 year" = 120,
    "15 year" = 180,
    "20 year" = 240,
  }

  const generateTermMap = function (term) {
    return ratePrices
      .filter((item) => {
        if (item.rateType === term) return item;
      })
      .map((item) => {
        const ratePercent = item.rate / 100;
        const centsToDollars = item.minPaymentAmountInCents / 100;
        const paymentInUSD = centsToDollars.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        return [TermLengths[item.term], `${ratePercent}%`, paymentInUSD];
      });
  };
  const result = {
    fixedData: generateTermMap("fixed"),
    variableData: generateTermMap("variable"),
  };

  return result;
};

export default mapRatePayments;
