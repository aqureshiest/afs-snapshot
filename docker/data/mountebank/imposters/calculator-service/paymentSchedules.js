function paymentSchedules(request) {
    const payload = JSON.parse(request.body);
    const { prices } = payload;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        prices: prices.map((price, index) => {

          const loanInDollars = Math.floor(price.startingPrincipalBalanceInCents / 100)
          const totalInterest = Math.floor(loanInDollars * (price.rate / 10000) * (price.uwLoanTermInMonths / 12));
          const priceDate = new Date(price.date)
          const lastPayDate = priceDate.setMonth(priceDate.getMonth + price.uwLoanTermInMonths)

          return {
            // from inputs
            rateInBps: price.rateInBps,
            uwLoanTermInMonths: price.uwLoanTermInMonths,
            rateType: price.rateType,
            startingPrincipalBalanceInCents: price.startingPrincipalBalanceInCents,
            date: (new Date(price.date)).toISOString(),
            dateType: price.dateType,
            priceId: index,

            // fake calculations
            minimumPaymentAmountInCents: Math.floor(price.startingPrincipalBalanceInCents / price.term),
            paymentSchedule: {
                totalPrincipalPaidInDollars: loanInDollars,
                totalInterestPaidInDollars: totalInterest,
                totalAmountPaidInDollars: totalInterest + loanInDollars,
                finalPrincipalBalanceInDollars: 0,
                finalInterestBalanceInDollars: 0,
                lastPaymentDate: lastPayDate,
                lastPaymentAmountInDollars: Math.floor(price.startingPrincipalBalanceInCents / price.term),
                totalNumberOfPaymentsMade: price.uwLoanTermInMonths
            }
          }
        })
      },
    };
  }
