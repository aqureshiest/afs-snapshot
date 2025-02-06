import { describe, it, before, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import OptimizelySDK from "@optimizely/optimizely-sdk";
import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import CisPersonClient from "./client.js";
import OptimizelyClient from "../optimizely/client.js";
import cisPersonFixture from "../../test-utils/fixtures/cis-person-fixture.js";

describe("[b8dcinbp] CIS Person Client", () => {
  let context;
  let cisPersonClient: CisPersonClient;
  let optimizelyClient: OptimizelyClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);

    cisPersonClient = context.loadedPlugins.cisPersonClient.instance;
    optimizelyClient = new OptimizelyClient(
      context,
      {} as OptimizelySDK.Client,
    );
  });

  describe("[4dc41314] Create Cis Person Client", () => {
    beforeEach(() => {
      mock.method(cisPersonClient, "log", () => {});
    });

    afterEach(() => {
      mock.restoreAll();
    });

    it("[dca14bc2] should create a CIS person client successfully", async () => {
      const mockClient = {
        GetV40Asyncasync: () => {
          return cisPersonFixture;
        },
        setSecurity: mock.fn(),
        addSoapHeader: mock.fn(),
      };

      const mockFn = mock.fn(async () => mockClient);

      mock.method(cisPersonClient, "createClientAsync", mockFn);

      const result = await cisPersonClient.createCisPersonClient(
        context,
        "123456789",
      );

      assert.equal(result, mockClient);
      assert(mockFn.mock.calls.length === 1);
      assert(mockClient.setSecurity.mock.calls.length === 1);
      assert(mockClient.addSoapHeader.mock.calls.length === 1);
    });

    it("[e1a2b3c4] should throw an error if createClientAsync fails", async () => {
      const mockError = new Error("Failed to create client");
      const mockFn = mock.fn(async () => {
        throw mockError;
      });

      mock.method(cisPersonClient, "createClientAsync", mockFn);

      await assert.rejects(
        cisPersonClient.createCisPersonClient(context, "123456789"),
        (error: Error) => {
          assert.equal(error, mockError);
          return true;
        },
      );

      assert(mockFn.mock.calls.length === 1);
    });
  });

  describe("[6mke3jnn] Fetch Person", () => {
    it("[7nke3jnn] Should get person ", async () => {
      const mockFn = mock.fn(() => {
        return {
          GetV40Async: async () => {
            return cisPersonFixture;
          },
        };
      });

      mock.method(cisPersonClient, "createCisPersonClient", mockFn);

      const getPerson = await cisPersonClient.fetchPerson(
        context,
        "1111-11-1111",
        "123456789",
      );

      assert.equal(mockFn.mock.calls.length, 1);
      assert(getPerson.role);
      assert(Array.isArray(getPerson.role));
      assert(getPerson.role[0].loans);
    });

    it("[8oke3jnn] Should handle network error", async () => {
      const mockFn = mock.fn(() => {
        throw new Error("Network error");
      });

      mock.method(cisPersonClient, "createCisPersonClient", mockFn);

      const personFetched = await cisPersonClient.fetchPerson(
        context,
        "1111-11-1111",
        "123456789",
      );
      assert.deepStrictEqual(personFetched, {});

      assert.equal(mockFn.mock.calls.length, 1);
    });

    it("[9pke3jnn] Should handle empty response", async () => {
      const mockFn = mock.fn(() => {
        return {
          GetV40Async: async () => {
            return [];
          },
        };
      });
      const endpoint =
        "https://wsmb2bproxyagility2.navient.com/apigateway/com.slma.ai01.b2b.CISv40.Person.Get?wsdl";

      mock.method(cisPersonClient, "createCisPersonClient", mockFn);

      const personFetched = await cisPersonClient.fetchPerson(
        context,
        "1111-11-1111",
        "123456789",
      );
      assert.deepStrictEqual(personFetched, {});
      assert.equal(mockFn.mock.calls.length, 1);
    });
  });

  describe("[aff198c3] Get CIS Info Loans", () => {
    it("[eaa47b9e] should return a combined array of loans from all roles", async () => {
      const loans = cisPersonClient.getCisInfoLoans(
        context,
        cisPersonFixture[0],
        "123445",
      );

      assert(Array.isArray(loans));
      assert(loans[0]);
      assert.ok(loans[0].loanId);
      assert.ok(loans[0].loanStatusCode);
      assert.ok(loans[0].loanProgramCode);
    });

    it("[cf7be397] should return one array for a role that has a loan array", async () => {
      const loans = cisPersonClient.getCisInfoLoans(
        context,
        {
          role: [
            {
              loans: {
                loan: [
                  {
                    loanKey: { id: "123456789" },
                    loanProgramCode: "123",
                    loanStatusCode: "123",
                  },
                  {
                    loanKey: { id: "23456781" },
                    loanProgramCode: "456",
                    loanStatusCode: "456",
                  },
                ],
              },
            },
          ],
        },
        "123445",
      );

      assert(Array.isArray(loans));
      assert.equal(loans.length, 2);
    });

    it("[8965c364] should return one array for a role that has a loan object", async () => {
      const loans = cisPersonClient.getCisInfoLoans(
        context,
        {
          role: [
            {
              loans: {
                loan: {
                  loanKey: { id: "123456789" },
                  loanProgramCode: "123",
                  loanStatusCode: "123",
                },
              },
            },
          ],
        },
        "123445",
      );

      assert(Array.isArray(loans));
      assert.equal(loans.length, 1);
    });

    it("[d4c32eb8] should return empty array for loans if no roles found", async () => {
      let loans = cisPersonClient.getCisInfoLoans(context, {}, "123445");

      assert(Array.isArray(loans));
      assert.equal(loans.length, 0);

      loans = cisPersonClient.getCisInfoLoans(context, { role: [] }, "123445");

      assert(Array.isArray(loans));
      assert.equal(loans.length, 0);
    });

    it("[bf1d8e88] should return empty array for loans if no loans found in role", async () => {
      let loans = cisPersonClient.getCisInfoLoans(
        context,
        { role: [{}] },
        "123445",
      );

      assert(Array.isArray(loans));
      assert.equal(loans.length, 0);

      loans = cisPersonClient.getCisInfoLoans(
        context,
        { role: [{ loans: {} }] },
        "123445",
      );

      assert(Array.isArray(loans));
      assert.equal(loans.length, 0);
    });
  });

  describe("[8d8b8ad0] Get CIS Person Loans", () => {
    beforeEach(() => {
      mock.method(optimizelyClient, "getFeatureFlag", async () => {
        return true;
      });
    });

    afterEach(() => {
      mock.restoreAll();
    });

    it("[c07bfd31] should return cis person loans", async () => {
      const mockFn = mock.fn(() => {
        return cisPersonFixture[0];
      });
      const mockCheckFn = mock.fn(() => true);
      mock.method(cisPersonClient, "checkCisPersonFlag", mockCheckFn);
      mock.method(cisPersonClient, "fetchPerson", mockFn);

      mock.method(
        context.loadedPlugins.applicationServiceClient.instance,
        "sendRequest",
        async () => {
          return {
            addDetails: {
              application: {
                details: {
                  cisInfoLoans: [
                    {
                      loanId: "123456789",
                      loanProgramCode: "123",
                      loanStatusCode: "123",
                    },
                  ],
                },
              },
              error: null,
            },
          };
        },
      );

      const result = await cisPersonClient.getCisPersonLoans(
        context,
        "12345",
        "1111-11-1111",
      );

      assert(Array.isArray(result));
      assert(result[0]);
      assert.ok(result[0].loanId);
      assert.ok(result[0].loanStatusCode);
      assert.ok(result[0].loanProgramCode);
    });

    it("[0a631955] should empty array if no loans found", async () => {
      const mockFn = mock.fn(() => {
        return {
          person: {},
        };
      });
      const mockCheckFn = mock.fn(() => true);
      mock.method(cisPersonClient, "checkCisPersonFlag", mockCheckFn);
      mock.method(cisPersonClient, "fetchPerson", mockFn);

      const result = await cisPersonClient.getCisPersonLoans(
        context,
        "12345",
        "1111-11-1111",
      );

      assert(Array.isArray(result));
      assert.equal(result.length, 0);
    });

    it("[3ecf4da5] should not get cis person loans if flag is disabled", async () => {
      const mockCheckFn = mock.fn(() => false);
      mock.method(cisPersonClient, "checkCisPersonFlag", mockCheckFn);

      const result = await cisPersonClient.getCisPersonLoans(
        context,
        "12345",
        "1111-11-1111",
      );

      assert.equal(result, undefined);
    });
  });

  describe("[c2e24256] Check CIS Person Flag", () => {
    beforeEach(() => {
      mock.method(cisPersonClient, "log", () => {});
    });

    afterEach(() => {
      mock.restoreAll();
    });

    it("[124ca511] should return true if the feature flag is enabled", async () => {
      const mockCheckFn = mock.fn(() => true);
      mock.method(cisPersonClient, "checkCisPersonFlag", mockCheckFn);

      const result = await cisPersonClient.checkCisPersonFlag(
        context,
        "user123",
      );
      assert.strictEqual(result, true);
    });

    it("[06a1fa3e] should return false if the feature flag is disabled", async () => {
      const testOptimizelyClient = {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          optimizelyClient: {
            instance: {},
          },
        },
      };
      const mockFn = mock.fn(async () => {
        return false;
      });
      mock.method(optimizelyClient, "getFeatureFlag", mockFn);
      const result = await cisPersonClient.checkCisPersonFlag(
        testOptimizelyClient,
        "user123",
      );
      assert.strictEqual(result, false);
    });

    it("[f8144ea9] should return false if there is an error getting the feature flag", async () => {
      const testOptimizelyClient = {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          optimizelyClient: {
            instance: {},
          },
        },
      };
      const mockFn = mock.fn(async () => {
        throw new Error("Network error");
      });
      mock.method(optimizelyClient, "getFeatureFlag", mockFn);

      const result = await cisPersonClient.checkCisPersonFlag(
        testOptimizelyClient,
        "user123",
      );
      assert.strictEqual(result, false);
    });
  });
});
