import {
  hasActiveIncompleteApplication,
  hasActivePostSubmissionApplication,
  hasPostSignatureLendingPlatformApplication,
  hasActivePostSignatureLendingPlatformApplication,
  ISODateToMMDDYYYY,
  getAction,
  escapeUrlParam,
} from "./index.js";

import { Template, ButtonTemplate, } from "./generate-modal-template.js";

export default function generatePartnerModalTemplate(
  request,
  actions,
  application,
  applications,
  env
): Template {
  const hasActiveIncompleteApp = hasActiveIncompleteApplication(
    request.params.id,
    applications,
  );

  const hasActivePostSubmissionApp = hasActivePostSubmissionApplication(
    request.params.id,
    applications,
  );

  const identityResponse = getAction(actions, "identify");
  const hasMonolithOrCognitoAccount = identityResponse?.statusCode && identityResponse.statusCode === 409;

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
                copy:
                  hasMonolithOrCognitoAccount &&
                  !hasActiveIncompleteApp &&
                  !hasActivePostSubmissionApp
                  ? "We found an account with this email." 
                  : hasActivePostSubmissionApp 
                  ? "You have a pending application with us"
                  : "Pick up where you left off?",
                subCopy:
                  hasMonolithOrCognitoAccount &&
                  !hasActiveIncompleteApp &&
                  !hasActivePostSubmissionApp
                  ? "Please log in to continue your application."
                  : hasActivePostSubmissionApp
                  ? `We're currently reviewing an application you submitted on ${ISODateToMMDDYYYY(hasActivePostSubmissionApp?.root?.createdAt)}. Please wait for a decision before submitting a new application.`
                  : `You started an application with us on ${ISODateToMMDDYYYY(hasActiveIncompleteApp?.root?.createdAt)}. Would you like to continue where you left off?`,
                asset: {
                  center: true,
                  type: "LocalAsset",
                  name: "illustrations.info",
                },
              },
              modalProps: {
                maxWidth: "400px",
                showCloseButton: false,
                outsideClickEnable: false,
              },
            },
          ],
        },
      },
    },
  };

  const buttons: ButtonTemplate = {
    key: "buttons",
    type: "buttons",
    componentProps: {
      stylePreset: "primaryTertiary",
      buttons: [],
      groupProps: {
        flexDirection: "column",
        alignItems: "center",
      },
    },
  };

  // Primary Button
  if (
    hasMonolithOrCognitoAccount &&
    !hasActiveIncompleteApp &&
    !hasActivePostSubmissionApp
  ) {
    buttons.componentProps.buttons.push(
      {
        copy: "Login",
        action: {
          type: "navigate",
          properties: {
            goTo: `${env.BASE_URL}/_/auth/login?targetUrl=/_/apply/resume/${request.params.id}`,
            external: true,
          },
        },
      },
    );
  } else if (
    hasMonolithOrCognitoAccount &&
    hasActiveIncompleteApp
  ) {
    buttons.componentProps.buttons.push(
      {
        copy: "Resume prior application",
        action: {
          type: "navigate",
          properties: {
            goTo: `${env.BASE_URL}/_/auth/login?targetUrl=/_/apply/resume/${hasActiveIncompleteApp?.root?.id}`,
            external: true,
          },
        },
      },
    );
  } else if (
    hasMonolithOrCognitoAccount &&
    hasActivePostSubmissionApp
  ) {
    buttons.componentProps.buttons.push(
      {
        copy: "View My Application Status",
        action: {
          type: "navigate",
          properties: {
            goTo: `${env.BASE_URL}/_/auth/login`,
            external: true,
          },
        },
      },
    );
  } else if (hasActivePostSubmissionApp) {
    buttons.componentProps.buttons.push(
      {
        copy: "View My Application Status",
        action: {
          type: "request",
          properties: {
            method: "POST",
            manifest: `send-access-email-on-resume/${hasActivePostSubmissionApp?.id}`,
          },
        },
      },
    );
  } else {
    buttons.componentProps.buttons.push(
      {
        copy: "Resume prior application",
        action: {
          type: "request",
          properties: {
            method: "POST",
            manifest: `send-access-email-on-resume/${hasActiveIncompleteApp?.id}`,
          },
        },
      },
    );
  }

  // Secondary Buttons
  if (hasActiveIncompleteApp && !hasActivePostSubmissionApp) {
    if (hasMonolithOrCognitoAccount) {
      buttons.componentProps.buttons.push({
        copy: "Continue new application",
        action: {
          type: "navigate",
          properties: {
            goTo: `${env.BASE_URL}/_/auth/login?targetUrl=/_/apply/resume-new-application/${request.params.id}`,
            external: true,
          },
        },
      });
    } else {
      buttons.componentProps.buttons.push({
        copy: "Continue new application",
        action: {
          type: "request",
          properties: {
            manifest: `send-verification-email/${request.params.id}`,
            method: "POST",
          },
        },
      });
    }
  }

  template.action.properties.definition.content = [
    ...template.action.properties.definition.content,
    buttons,
  ];

  return template;
}
