const otherIncomeTypes = [
  "investment",
  "social_security_or_pension",
  "child_support_or_alimony",
  "rental",
  "k1",
  "disability",
];

const mapIncomeTypeToEmplStatus = function (income) {
  if (income?.type === "employment") {
    // Check if we need to return 'Employed', 'Self-Employed', or 'Future'
    if (income?.employer) {
      /**
       * For a Future Employment we collect Employer Name,
       * Job Title, and start date
       */
      if (income?.title && income?.start) {
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
  } else if (income?.type === "unspecified") {
    return "unemployed";
  } else if (otherIncomeTypes.includes(income?.type)) {
    return "retired";
  } else {
    return "";
  }
};

export default mapIncomeTypeToEmplStatus;
