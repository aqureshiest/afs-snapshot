const mapIncomeVerificationMethod = function (financialAccounts) {
  const plaidAccounts = financialAccounts.find(
    (fAccount) => fAccount.plaidAccessToken !== null,
  );
  if (plaidAccounts && plaidAccounts.length > 0) {
    if (plaidAccounts.length != financialAccounts.length) {
      return "both";
    } else {
      return "plaid";
    }
  } else {
    return "manual";
  }
};

export default mapIncomeVerificationMethod;
