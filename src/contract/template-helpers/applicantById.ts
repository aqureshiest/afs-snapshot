/**
 *
 * This block template-helper creates an altered scope that uses an id from
 * request parameters to determine who the "applicant" is.
 *
 * TODO: Stop using and proliferating this block template-helper. Its usage in contracts is
 * almost certainly bad for the health and predictability of anything it touches
 */
const applicantById = function (options) {
  const id = this?.request?.params?.id;
  const primaryApplicant = this?.application?.primary;
  const cosignerApplicant = this?.application?.cosigner;
  const rootApplication = this?.application?.root;
  const applicants = this?.application?.applicants;

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
    } else if (rootApplication) {
      // Just in case `this.application` somehow is from the perspective of an applicant
      context.applicant = { id };
    } else if (Array.isArray(applicants)) {
      // in this scenario, the first applicant may be presumed to be the primary
      context.applicant = applicants.find((applicant) => id === applicant.id);
      context.isPrimary = true;
    }

    return options.fn(context);
  }

  return options.fn(this);
};

export default applicantById;
