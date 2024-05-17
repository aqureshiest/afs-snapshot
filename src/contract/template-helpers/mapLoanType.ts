/* eslint-disable @typescript-eslint/no-unused-vars */

const loanTypeMap = {
  primary_only: "independent",
  cosigned: "cosigned",
  parent_plus: "Parent Plus",
};
const mapLoanType = function (loanType) {
  if (loanTypeMap[loanType]) {
    return loanTypeMap[loanType];
  } else {
    return loanType;
  }
};

export default mapLoanType;
