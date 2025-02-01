import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { Event } from "@earnest/application-service-client/typings/codegen.js";
import assert from "node:assert";
import * as path from "node:path";
import Client from "../client.js";
import {
  Client as SoapClient,
  createClientAsync,
  ClientSSLSecurity,
} from "soap";

import { FeatureFlagKey } from "../optimizely/client.js";

const gql = String.raw;

export default class CisPersonClient extends Client {
  private getPersonWSDL: string;
  private key: Buffer;
  private cert: Buffer;
  private appName: string;
  private appVersion: string;
  public createClientAsync: typeof createClientAsync;
  public ClientSSLSecurity: typeof ClientSSLSecurity;

  constructor(getPersonWSDL: string, key: Buffer, cert: Buffer) {
    const options = { baseUrl: "baseUrl" };
    super(options);
    this.appName = "apply-flow-service";
    this.appVersion = "1.0";
    this.getPersonWSDL = getPersonWSDL;
    this.key = key;
    this.cert = cert;
    this.createClientAsync = createClientAsync;
    this.ClientSSLSecurity = ClientSSLSecurity;
  }

  public async createCisPersonClient(
    context: PluginContext,
    id: string,
  ): Promise<SoapClient> {
    this.log(
      {
        message: "creating-cis-person-client",
        getPersonWSDL: this.getPersonWSDL,
        id,
      },
      context,
    );

    try {
      const xmlPath = path.resolve(
        `src/clients/cis-person/wsdlFiles/${this.getPersonWSDL}`,
      );
      const cisPersonClient = await this.createClientAsync(xmlPath, {
        wsdl_options: { cert: this.cert, key: this.key },
      });

      cisPersonClient.setSecurity(
        new this.ClientSSLSecurity(this.key, this.cert, {
          strictSSL: false,
          rejectUnauthorized: false,
          forever: true,
        }),
      );

      cisPersonClient.addSoapHeader({
        "smwsh:SMWebServiceHeader": {
          "smwsh:appContext": {
            "smwsh:appName": this.appName,
            "smwsh:appVersion": this.appVersion,
          },
        },
      });

      return cisPersonClient;
    } catch (error) {
      this.log(
        {
          message: '[ee647d95] cis-person-client-creation-error',
          error,
          getPersonWSDL: this.getPersonWSDL,
          id,
        },
        context,
      );

      throw error;
    }
  }

  public async fetchPerson(
    context: PluginContext,
    ssn: string,
    id: string,
  ): Promise<CisPerson> {
    this.log(
      {
        message: "fetching-person",
        id,
      },
      context,
    );

    try {
      const cisPersonClient = await this.createCisPersonClient(context, id);
      const cisPerson = await cisPersonClient.GetV40Async({
        attributes: {
          "xmlns:ns2": "http://www.slma.com/cis/person.xsd",
          retrievePersonData: "true",
          activeContactPointsOnly: "true",
          displayLoans: "true",
        },
        "pg:personKey": {
          attributes: {
            "xsi:type": "ns2:SSNKey",
          },
          "ns2:socialSecurityNumber": ssn ? ssn.replace(/\D/g, "") : "",
        },
      });

      this.log(
        {
          message: "cis-person-retrieved",
          id,
        },
        context,
      );

      if (!cisPerson[0]) {
        this.log(
          {
            message: '[ec7690fd] Person not found',
            id,
          },
          context,
        );

        return {};
      }

      this.log(
        {
          message: "[de2bf48a] person-fetched",
          id,
        },
        context,
      );

      return cisPerson[0];
    } catch (error) {
      this.log(
        {
          message: '[92dd644f] fetch-person-error',
          error,
          id,
        },
        context,
      );

      return {};
    }
  }

  public getCisInfoLoans(
    context: PluginContext,
    cisPerson: CisPerson,
    id: string,
  ): CisInfoLoan {
    this.log(
      {
        message: "[7ce391f7] getting CIS Info Loans",
        id,
      },
      context,
    );

    const loans =
      cisPerson.role?.flatMap((role: Role) => role.loans?.loan || []) || [];

    const cisInfoLoans = loans.map((loan: Loan) => ({
      loanId: loan?.loanKey?.id,
      loanProgramCode: loan?.loanProgramCode,
      loanStatusCode: loan?.loanStatusCode,
    }));

    return cisInfoLoans;
  }

  public async checkCisPersonFlag(
    context: PluginContext,
    id: string,
  ): Promise<boolean> {
    const optimizelyClient = context.loadedPlugins.optimizelyClient?.instance;
    assert(optimizelyClient, "[22473dd7] Optimizely Client not instantiated");

    try {
      return await optimizelyClient["getFeatureFlag"](
        FeatureFlagKey.CIS_PERSON,
      );
    } catch (error) {
      this.log(
        {
          message: "[98c9287b] Failed getting cis_person feature flag",
          id,
        },
        context,
      );

      return false;
    }
  }

  private async addCisInfoLoanToDetails(
    context: PluginContext,
    id: string,
    cisInfoLoans: CisInfoLoan,
  ) {
    const errors: Error[] = [];

    this.log(
      {
        message: "[48171d15] adding cisInfoLoans to Details",
      },
      context,
    );

    try {
      const applicationService =
        context.loadedPlugins.applicationServiceClient?.instance;
      assert(
        applicationService,
        "[0f2b2d8e] Application Service not instantiated",
      );

      const ASresponse = (await applicationService["sendRequest"](
        {
          query: gql`
            mutation ($id: UUID!, $details: AddDetailInput, $meta: EventMeta) {
              addDetails(id: $id, details: $details, meta: $meta) {
                id
                error
                application {
                  details {
                    cisInfoLoans {
                      loanId
                      loanProgramCode
                      loanStatusCode
                    }
                  }
                }
              }
            }
          `,
          variables: {
            id,
            details: {
              cisInfoLoans,
            },
            meta: { service: "apply-flow-service" },
          },
        },
        context,
      )) as unknown as { addDetails: Event };

      if (ASresponse.addDetails.error) {
        errors.push(
          new Error("application-service-error"),
          new Error(ASresponse.addDetails.error),
        );
      }

      if (ASresponse.addDetails.application.details) {
        const { cisInfoLoans } = ASresponse.addDetails.application.details;

        const results = cisInfoLoans;

        this.log(
          {
            message: "[e1da05f4] cisInfoLoans added to Details",
            id,
          },
          context,
        );

        return { errors, results };
      } else {
        return { errors, results: [] };
      }
    } catch (ex) {
      this.log(
        {
          error: ex,
        },
        context,
      );

      errors.push(ex);

      return { errors, results: [] };
    }
  }

  public async getCisPersonLoans(
    context: PluginContext,
    id: string,
    ssn: string,
  ) {
    const isFeatureFlagCisPersonEnabled = await this.checkCisPersonFlag(
      context,
      id,
    );

    if (!isFeatureFlagCisPersonEnabled) {
      this.log(
        {
          message: "[a39af79e] cis_person feature flag disabled",
          id,
        },
        context,
      );

      return;
    }

    try {
      this.log(
        {
          message: "[3ebd74e7] getting-cis-person-loans",
          id,
        },
        context,
      );

      const personFetched = await this.fetchPerson(context, ssn, id);

      const cisInfoLoans =
        this.getCisInfoLoans(context, personFetched, id) || [];

      if (cisInfoLoans.length > 0) {
        const cisInfoLoanDetailsAdded = await this.addCisInfoLoanToDetails(
          context,
          id,
          cisInfoLoans,
        );

        return cisInfoLoanDetailsAdded.results;
      }

      this.log(
        {
          message: "[70c097f7] no cisInfoLoans found",
          id,
        },
        context,
      );
      return cisInfoLoans;
    } catch (error) {
      this.log(
        {
          message: '[f1b3b1d7] get-cis-person-loans-error',
          error,
        },
        context,
      );

      return [];
    }
  }
}
