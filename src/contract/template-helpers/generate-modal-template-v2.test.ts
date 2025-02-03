import { before, describe, it } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import * as typings from "@earnest/application-service-client/typings/codegen.js";

import handlebars from "../handlebars.js";
const {
  generateModalTemplateV2,
  ISODateToMMDDYYYY,
} = handlebars.helpers;

const POST_SUBMISSION_APPLICATION_STATUSES: string[] = [
  typings.ApplicationStatusName.AiRequested,
  typings.ApplicationStatusName.Approved,
  typings.ApplicationStatusName.Eligible,
  typings.ApplicationStatusName.Review,
  typings.ApplicationStatusName.Submitted,
  typings.ApplicationStatusName.Verified,
];

describe("[a97b5962] Generate Modal Template v2", () => {
  let context, env, now, request, root;

  before (async () => {
    now = new Date().toISOString();
    root = {
      id: "1",
      status: null,
      tag: {
        active: true,
        status: "incomplete",
      },
      applicant: {
        id: "1",
        details: {
          name: {
            first: "FirstName"
          }
        },
      },
    };
    env = {
      S2S_APPLICATION_SERVICES_KEY: "S2S_APPLICATION_SERVICES_KEY",
      INTERNAL_REST_SERVICE_AUTH_KEY: "INTERNAL_REST_SERVICE_AUTH_KEY",
      BASE_URL: "BASE_URL",
    };
    request = {
      params: { id: "1" },
    }

    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
  });

  it("[ba903347] should generate a modal template when a user has another incomplete application", async () => {
    const actions = [
      { action: "identify", statusCode: 201 },
    ];

    const applications = [
      {
        id: "2",
        status: null,
        details: {
          name: {
            first: "FirstName"
          }
        },
        tag: {
          active: true,
          status: "incomplete",
        },
        root: {
          createdAt: now,
        }
      }
    ];

    const result = generateModalTemplateV2(
      request,
      actions,
      root,
      applications,
      env
    );

    const props = result.action.properties.definition.content[0].componentProps;
    assert.equal(props.copy, "Pick up where you left off?");
    assert.equal(
      props.subCopy,
      `You started an application with us on ${ISODateToMMDDYYYY(now)}. Would you like to continue where you left off?`
    );

    const buttons = result.action.properties.definition.content[1].componentProps.buttons;
    assert.equal(buttons.length, 2);

    const primaryButton = buttons[0];
    const secondaryButton = buttons[1];
    assert.equal(primaryButton.copy, "Resume prior application");
    assert.equal(secondaryButton.copy, "Continue new application");

    const primaryAction = primaryButton.action;
    const secondaryAction = secondaryButton.action;
    assert.equal(primaryAction.type, "request");
    assert.equal(primaryAction.properties.manifest, `send-access-email-on-resume/${applications[0].id}`);
    assert.equal(secondaryAction.type, "request");
    assert.equal(secondaryAction.properties.manifest, `send-verification-email/${request.params.id}`);
  });

  it("[ca6050ec] should generate a modal template when a user has a post submission application", async () => {
    const actions = [
      { action: "identify", statusCode: 201 },
    ];

    POST_SUBMISSION_APPLICATION_STATUSES.forEach((status) => {
      const applications = [
        {
          id: "2",
          status: {
            name: status
          },
          details: {
            name: {
              first: "FirstName"
            }
          },
          tag: {
            active: true,
            status,
          },
          root: {
            id: "3",
            createdAt: now,
          }
        }
      ];

      const result = generateModalTemplateV2(
        request,
        actions,
        root,
        applications,
        env
      );

      const props = result.action.properties.definition.content[0].componentProps;
      assert.equal(props.copy, "You have a pending application with us");
      assert.equal(
        props.subCopy,
        `We're currently reviewing an application you submitted on ${ISODateToMMDDYYYY(now)}. Please wait for a decision before submitting a new application.`
      );

      const buttons = result.action.properties.definition.content[1].componentProps.buttons;
      assert.equal(buttons.length, 1);

      const primaryButton = buttons[0];
      assert.equal(primaryButton.copy, "View My Application Status");
      const primaryAction = primaryButton.action;
      assert.equal(primaryAction.type, "request");
      assert.equal(primaryAction.properties.manifest, `send-access-email-on-resume/${applications[0].id}`);
    });
  });

  it("[6a001d45] should generate a modal template for users with an account with no active inflight applications", async () => {
    const actions = [
      { action: "identify", statusCode: 409 },
    ];

    const applications = [];

    const result = generateModalTemplateV2(
      request,
      actions,
      root,
      applications,
      env
    );

    const props = result.action.properties.definition.content[0].componentProps;
    assert.equal(props.copy, "We found an account with this email.");
    assert.equal(props.subCopy, "Please log in to continue your application.");

    const buttons = result.action.properties.definition.content[1].componentProps.buttons;
    assert.equal(buttons.length, 1);

    const primaryButton = buttons[0];
    assert.equal(primaryButton.copy, "Login");

    const primaryAction = primaryButton.action;
    assert.equal(primaryAction.type, "navigate");
    assert.equal(primaryAction.properties.goTo, `BASE_URL/_/auth/login?targetUrl=/_/apply/resume/${request.params.id}`);
  });

  it("[6538660f] should generate a modal template for users with an account and an active post submission application", async () => {
    const actions = [
      { action: "identify", statusCode: 409 },
    ];

    POST_SUBMISSION_APPLICATION_STATUSES.forEach((status) => {
      const applications = [
        {
          id: "2",
          status: {
            name: status
          },
          details: {
            name: {
              first: "FirstName"
            }
          },
          tag: {
            active: true,
            status,
          },
          root: {
            id: "3",
            createdAt: now,
          }
        }
      ];

      const result = generateModalTemplateV2(
        request,
        actions,
        root,
        applications,
        env
      );

      const props = result.action.properties.definition.content[0].componentProps;
      assert.equal(props.copy, "You have a pending application with us");
      assert.equal(props.subCopy, `We're currently reviewing an application you submitted on ${ISODateToMMDDYYYY(now)}. Please wait for a decision before submitting a new application.`);

      const buttons = result.action.properties.definition.content[1].componentProps.buttons;
      assert.equal(buttons.length, 1);

      const primaryButton = buttons[0];
      assert.equal(primaryButton.copy, "View My Application Status");
      const primaryAction = primaryButton.action;
      assert.equal(primaryAction.type, "navigate");
      assert.equal(primaryAction.properties.goTo, `BASE_URL/_/auth/login`);
    });
  });

  it("[06cbb7a5] should generate a modal template when a user has an account and another inflight application", async () => {
    const actions = [
      { action: "identify", statusCode: 409 },
    ];

    const applications = [
      {
        id: "2",
        status: null,
        details: {
          name: {
            first: "FirstName"
          }
        },
        tag: {
          active: true,
          status: "incomplete",
        },
        root: {
          id: "3",
          createdAt: now,
        }
      }
    ];

    const result = generateModalTemplateV2(
      request,
      actions,
      root,
      applications,
      env
    );

    const props = result.action.properties.definition.content[0].componentProps;
    assert.equal(props.copy, "Pick up where you left off?");
    assert.equal(
      props.subCopy,
      `You started an application with us on ${ISODateToMMDDYYYY(now)}. Would you like to continue where you left off?`
    );

    const buttons = result.action.properties.definition.content[1].componentProps.buttons;
    assert.equal(buttons.length, 2);

    const primaryButton = buttons[0];
    const secondaryButton = buttons[1];
    assert.equal(primaryButton.copy, "Resume prior application");
    assert.equal(secondaryButton.copy, "Continue new application");

    const primaryAction = primaryButton.action;
    const secondaryAction = secondaryButton.action;
    assert.equal(primaryAction.type, "navigate");
    assert.equal(primaryAction.properties.goTo, `BASE_URL/_/auth/login?targetUrl=/_/apply/resume/${applications[0].root.id}`);
    assert.equal(secondaryAction.type, "navigate");
    assert.equal(secondaryAction.properties.goTo, `BASE_URL/_/auth/login?targetUrl=/_/apply/resume-new-application/${request.params.id}`);
  });
});
