const applicantById = function (options) {
  const id = this?.request?.params?.id;
  const primaryApplicant = this?.application?.primary;
  const cosignerApplicant = this?.application?.cosigner;
  if (id) {
    const context = {
      applicant: {},
      isPrimary: false,
      isCosigner: false,
    };

    if (id === primaryApplicant?.id) {
      context.applicant = primaryApplicant;
      context.isPrimary = true;
    } else if (id === cosignerApplicant?.id) {
      context.applicant = cosignerApplicant;
      context.isCosigner = true;
    }

    return options.fn(context);
  }

  return options.fn(this);
};

export default applicantById;
