import { describe, it } from "node:test";
import * as assert from "node:assert";
import { ldsPostRequest } from "./common.js";
import { LogLevel, PactV3, V3Interaction } from "@pact-foundation/pact";
import { like } from "@pact-foundation/pact/src/v3/matchers.js";

const PROVIDER = new PactV3({
  consumer: "AFS",
  provider: "LDS",
  logLevel: "error" as LogLevel,
});

const formattedAppDetails = {
  primary: {
    entityInfo: {
      firstName: "PATI",
      lastName: "CHAUVIN",
      dob: "2000-01-01T00:00:00.000Z",
      addresses: [
        {
          addressLine1: "545 N 34TH ST",
          addressLine2: "",
          city: "PADUCAH",
          state: "CA",
          zip: "42001",
          country: "US",
          type: "primary",
        },
      ],
      ssn: "pii-token://tokens/d5684651-7a09-432f-9904-bfa48357501b",
      email: "t_testman+9733521@earnest.com",
      phoneNumber: "9999991234",
      citizenshipStatus: "us_citizen",
    },
    educations: [
      {
        degreeType: "bachelors",
        endDate: "2005-12-01T00:00:00.000Z",
        schoolName: "University of Michigan",
        schoolCode: "4358",
        schoolType: "not_for_profit",
        opeid: "00232500",
      },
    ],
    employments: [
      {
        employerName: "EmployerName",
        jobTitle: "JobTitle",
        employmentStatus: "employed",
        amount: 8000000,
      },
    ],
    incomes: [
      {
        incomeType: "rental",
        value: 1000000,
      },
      {
        incomeType: "k1",
        value: 1000000,
      },
      {
        incomeType: "social_security_or_pension",
        value: 1000000,
      },
    ],
    assets: [
      {
        assetType: "claimed_total_assets",
        value: 5500000,
      },
    ],
    loanInfo: {
      claimedLoanAmount: 6000000,
    },
    financialInfo: {
      hasPlaid: true,
      plaidAccessTokens: [
        "access-sandbox-856c78c5-f772-4b86-8a17-10eef2f6744f",
      ],
    },
    ratesInfo: {
      rateMapVersion: "191",
      rateMapTag: "minus_20_bps_test",
      rateAdjustmentData: {
        name: "juno",
        amount: 0,
      },
    },
  },
};

const decisionPayload = {
  product: "SLR",
  decisioningWorkflowName: "AUTO_APPROVAL",
  decisionSource: "apply-flow-service",
  applicationType: "PRIMARY_ONLY",
  requestMetadata: {
    applicationId: "744961",
    userId: "1662057",
  },
  isInternational: false,
  appInfo: formattedAppDetails,
};

const interaction = {
  uponReceiving: "A request to run a decision on an application",
  withRequest: {
    method: "POST",
    path: `/v2/decision`,
    headers: { "Content-Type": "application/json" },
    body: decisionPayload,
  },
  willRespondWith: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: like({
      message: "Decisioning Request is processed.",
      data: {
        decisioningToken: "cb9baf2d-9c1d-42db-9cd0-412b6ff2ce25",
        seedId: "35015750098151451271933133252030",
        status: "in_progress",
        journeyApplicationStatus: "pending_step_up",
        decisionOutcome: "Pending",
        journeyToken: "J-DHy7fAj0lVLlZ1mDqOuh",
        journeyApplicationToken: "JA-QTlT3V36mQTC8iNle7F2",
      },
    }),
  },
} as unknown as V3Interaction;

describe("Lending Apply to Lending Decision contract testing", () => {
  describe("POST /v2/decision", () => {
    it("should return successfully", () => {
      const provider = PROVIDER.addInteraction(interaction);

      return provider.executeTest(async (mockserver) => {
        const response = await ldsPostRequest(mockserver.url, decisionPayload);
        assert.equal(response.status, 200);
        assert.equal(
          response.data.message,
          "Decisioning Request is processed.",
        );
      });
    });
  });
});
