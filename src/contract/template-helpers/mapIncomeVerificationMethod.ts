const mapIncomeVerificationMethod = function (financialAccounts) {
  const accounts = financialAccounts.map((account) => {
    return account.plaidAccessToken ? "plaid" : "manual";
  });

  return JSON.stringify([...new Set(accounts)]);
};

export default mapIncomeVerificationMethod;
