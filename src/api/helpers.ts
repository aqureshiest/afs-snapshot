import * as typings from "@earnest/application-service-client/typings/codegen.js";

const flattenApplication = function (application: typings.Application) {
  let flattenedApp: typings.Application = {} as typings.Application;
  if (application !== null && application?.applicants?.length) {
    // flatten application
    if (application.applicants.length == 1) {
      application.primary = application.applicants[0];
    } else {
      application.applicants.forEach((applicant) => {
        const relationshipNotRoot =
          applicant?.relationships?.filter((r) => r?.relationship !== "root") ||
          [];

        if (relationshipNotRoot.length) {
          relationshipNotRoot.forEach((relationship) => {
            const app = application?.applicants?.find(
              (a) => a?.id === relationship?.id,
            );

            if (
              app &&
              application &&
              relationship &&
              relationship.relationship
            ) {
              application[relationship.relationship] = app;
            }
          });
        }
      });
    }
  }
  flattenedApp = { ...application };

  return flattenedApp;
};

export default flattenApplication;
