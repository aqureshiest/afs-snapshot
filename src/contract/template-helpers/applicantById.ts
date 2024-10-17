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

export const getApplicantWithRole = function (id, application) {
  const applicantIndex0 = application?.applicants?.[0];

  if (id === application?.primary?.id) {
    return JSON.stringify({
      applicant: { ...application.primary, role: "primary" },
    });
  } else if (id === application?.cosigner?.id) {
    return JSON.stringify({
      applicant: { ...application.cosigner, role: "cosigner" },
    });
  } else if (id === application?.benefactor?.id) {
    return JSON.stringify({
      primary: application.benefactor,
      applicant: { ...application.benefactor, role: "primary" },
    });
  } else if (id === application.id) {
    if (application?.benefactor?.id) {
      return JSON.stringify({
        primary: application.benefactor,
        applicant: { ...application.benefactor, role: "primary" },
      });
    } else if (application?.primary?.id) {
      return JSON.stringify({
        applicant: { ...application.primary, role: "primary" },
      });
    } else {
      return JSON.stringify({
        primary: applicantIndex0,
        applicant: { ...applicantIndex0, role: "primary" },
      });
    }
  } else {
    return JSON.stringify({
      primary: applicantIndex0,
      applicant: { ...applicantIndex0, role: "primary" },
    });
  }
};

export default applicantById;
