const otherIncomeTypes = [
  "investment",
  "social_security_or_pension",
  "child_support_or_alimony",
  "rental",
  "k1",
  "disability",
];

const mapIncomeTypeToEmplStatus = function (incomes) {
  const incomeEmployed = incomes.find(
    (income) => income?.type === "employment",
  );

  if (incomeEmployed) {
    // Check if we need to return 'Employed', 'Self-Employed', or 'Future'
    if (incomeEmployed?.employer) {
      /**
       * For a Future Employment we collect Employer Name,
       * Job Title, and start date
       */
      if (incomeEmployed?.title && incomeEmployed?.start) {
        return "future";
      } else {
        return "employed";
      }
    } else {
      /**
       * For a 'Self Employed' status, we only collect a Job title and
       * a Start Date and no Employer name
       */
      return "self_employed";
    }
  }

  const incomeUnemployed = incomes.find(
    (income) => income?.type === "unspecified",
  );

  if (incomeUnemployed) {
    return "unemployed";
  }

  const otherSourcesOfIncome = incomes.filter((income) => {
    if (otherIncomeTypes.includes(income?.type as string)) return income;
  });

  if (otherSourcesOfIncome && otherSourcesOfIncome.length > 0) {
    return "retired";
  }
  return "";
};

export default mapIncomeTypeToEmplStatus;
