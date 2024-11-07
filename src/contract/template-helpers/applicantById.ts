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
  let applicant = {};
  if (id === application?.primary?.id) {
    applicant = { applicant: { ...application.primary, role: "primary" } };
  } else if (id === application?.cosigner?.id) {
    applicant = { applicant: { ...application.cosigner, role: "cosigner" } };
  } else if (id === application?.benefactor?.id) {
    applicant = {
      primary: application.benefactor,
      applicant: { ...application.benefactor, role: "primary" },
    };
  } else if (id === application.id) {
    if (application?.benefactor?.id) {
      applicant = {
        primary: application.benefactor,
        applicant: { ...application.benefactor, role: "primary" },
      };
    } else if (application?.primary?.id) {
      applicant = {
        applicant: { ...application.primary, role: "primary" },
      };
    } else {
      applicant = {
        primary: applicantIndex0,
        applicant: { ...applicantIndex0, role: "primary" },
      };
    }
  } else {
    applicant = {
      primary: applicantIndex0,
      applicant: { ...applicantIndex0, role: "primary" },
    };
  }
  return JSON.stringify(applicant);
};

export default applicantById;
