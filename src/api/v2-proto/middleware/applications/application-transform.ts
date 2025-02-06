// c8 ignore file
/* ============================== *
 * Updates the application object with pre-derived values and sets the `application.me` and `role` property
 * ==============================
 * 1. application.me - the current user's application object based on the id of the request
 * 2. role - adds a readable role to the application applicant object
 * ==============================
 * 2. Application Service does not set a benefactor as the primary (though it should), so we do it here
 * ============================== */

const PRIMARY_ROLE = "primary";
const COSIGNER_ROLE = "cosigner";

export function applicationTransform(id, application) {
  const applicantIndex0 = application?.applicants?.[0];
  let transform = {}; // Object that will be spread into the application object

  if (id === application?.primary?.id) {
    // If the id matches the primary applicant, set the `me` object to the primary applicant
    transform = { me: { ...application.primary, role: PRIMARY_ROLE } };
  } else if (id === application?.cosigner?.id) {
    // If the id matches the cosigner applicant, set the `me` object to the cosigner applicant
    transform = { me: { ...application.cosigner, role: COSIGNER_ROLE } };
  } else if (id === application?.benefactor?.id) {
    // If the id matches the benefactor applicant, set the `me` object to the benefactor applicant
    // Additionally, set the primary property to the benefactor
    transform = {
      primary: application.benefactor,
      me: { ...application.benefactor, role: PRIMARY_ROLE },
    };
  } else if (id === application.id) {
    // Id matches the application root id
    if (application?.benefactor?.id) {
      transform = {
        primary: application.benefactor,
        me: { ...application.benefactor, role: PRIMARY_ROLE },
      };
    } else if (application?.primary?.id) {
      transform = {
        me: { ...application.primary, role: PRIMARY_ROLE },
      };
    } else {
      transform = {
        primary: applicantIndex0,
        me: { ...applicantIndex0, role: PRIMARY_ROLE },
      };
    }
  } else {
    transform = {
      primary: applicantIndex0,
      me: { ...applicantIndex0, role: PRIMARY_ROLE },
    };
  }

  return { ...application, ...transform };
}
