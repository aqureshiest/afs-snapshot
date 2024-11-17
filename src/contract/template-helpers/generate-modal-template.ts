import {
  hasActiveIncompleteApplication,
  hasActivePostSubmissionApplication,
  ISODateToMMDDYYYY,
  getAction
} from "./index.js";

interface Template {
  action: {
    type: string;
    properties: {
      type: string;
      definition: {
        content: unknown[];
      };
    };
  };
}

interface ButtonTemplate {
  key: string;
  type: string;
  componentProps: {
    stylePreset: string;
    buttons: Button[],
    groupProps: {
      flexDirection: string;
      alignItems: string;
    };
  }
}

interface Button {
  copy: string;
  action: {
    type: string;
    properties: {
      goTo?: string;
      external?: boolean;
      manifest?: string;
      method?: string;
    };
  };
}

export default function generateModalTemplate(request, actions, application, applications, env) {
  const hasActiveIncompleteApp = hasActiveIncompleteApplication(
    request.params.id,
    applications
  );
  const hasActivePostSubmissionApp = hasActivePostSubmissionApplication(
    request.params.id,
    applications
  );
  const identityResponse = getAction(actions, "identify");
  const getExistLegacyUserResponse = getAction(actions, "get-existing-user");
  const hasMonolithOrCognitoAccount = identityResponse?.statusCode && identityResponse.statusCode === 409;
  const hasActiveLegacyLoan = getExistLegacyUserResponse?.hasActiveLegacyLoan;

  const template: Template = {
    action: {
      type: "modal",
      properties: {
        type: "flexible",
        definition: {
          content: [
            {
              key: "header",
              type: "header",
              componentProps: {
                copy: hasMonolithOrCognitoAccount && !hasActiveIncompleteApp && !hasActivePostSubmissionApp
                  ? "We found an account with this email."
                  : "Pick up where you left off?",
                subCopy:
                  hasMonolithOrCognitoAccount && !hasActiveIncompleteApp && !hasActivePostSubmissionApp
                    ? "Please log in to continue your application."
                    : `You started an application with us on ${hasActivePostSubmissionApp
                      ? ISODateToMMDDYYYY(
                        hasActivePostSubmissionApp?.root?.createdAt
                      )
                      : ISODateToMMDDYYYY(hasActiveIncompleteApp?.root?.createdAt)
                    }. Would you like to continue from where you left off?`,
                asset: {
                  center: true,
                  type: "LocalAsset",
                  name: "illustrations.info"
                }
              },
              modalProps: {
                maxWidth: "400px",
                showCloseButton: false,
                outsideClickEnable: false
              }
            }
          ]
        }
      }
    }
  };

  const buttons: ButtonTemplate = {
    key: "buttons",
    type: "buttons",
    componentProps: {
      stylePreset: "primaryTertiary",
      buttons: [
        // Primary Button
        {
          copy: ((hasMonolithOrCognitoAccount && hasActiveLegacyLoan)
            || (hasMonolithOrCognitoAccount && !hasActiveIncompleteApp && !hasActivePostSubmissionApp
            )) ? "Login"
            : "Resume prior application",
          action: hasMonolithOrCognitoAccount
            ? {
              type: "navigate",
              properties: {
                goTo: (hasActivePostSubmissionApp || hasActiveLegacyLoan)
                  ? `${env.BASE_URL}/_/auth/login`
                  : (!hasActiveIncompleteApp && !hasActivePostSubmissionApp)
                    ? `${env.BASE_URL}/_/auth/login?targetUrl=/_/apply/resume-with-legacy-account/${application.id}`
                    : `${env.BASE_URL}/_/auth/login?targetUrl=/_/apply/resume/${hasActiveIncompleteApp?.root?.id}`,
                external: true
              }
            }
            : {
              type: "request",
              properties: {
                manifest: `send-access-email-on-resume/${hasActivePostSubmissionApp
                  ? hasActivePostSubmissionApp?.root?.id
                  : hasActiveIncompleteApp?.root?.id
                  }`,
                method: "POST"
              }
            }
        }
      ],
      groupProps: {
        flexDirection: "column",
        alignItems: "center"
      }
    }
  };

  // Secondary Buttons
  if (hasActiveIncompleteApp && !hasActivePostSubmissionApp) {
    if (hasMonolithOrCognitoAccount) {
        buttons.componentProps.buttons.push({
          copy: "Continue new application",
          action: {
            type: "navigate",
            properties: {
              goTo: `${env.BASE_URL}/_/auth/login?targetUrl=/_/apply/resume/${application.id}`,
              external: true
            }
          }
        });
    } else {
      buttons.componentProps.buttons.push({
        copy: "Continue new application",
        action: {
          type: "request",
          properties: {
            manifest: `send-verification-email/${request.params.id}`,
            method: "POST"
          }
        }
      });
    }
  }

  template.action.properties.definition.content = [
    ...template.action.properties.definition.content,
    buttons
  ];

  return template;
}
