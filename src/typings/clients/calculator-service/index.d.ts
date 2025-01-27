import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import * as typings from "@earnest/application-service-client/typings/codegen.js";
import type { HttpError as IHttpError } from "http-errors";

import type { default as CalculatorServiceClient } from "clients/calculator-service/index.js";
type CalculatorServicePlugin = ChassisPlugin<CalculatorServiceClient>;

import { Input as IContractInput } from "contract/manifest.js";

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    calculatorServiceClient: CalculatorServicePlugin;
  }
}

declare module "clients/calculator-service/chassis-plugin.ts" {
  type Plugin = ChassisPlugin;
  type Context = ChassisPluginContext;
  type instance = CalculatorServiceClient;
}

export enum RateType {
  Fixed = "fixed",
  Variable = "variable",
}

export enum DateType {
  FTI = "fti",
  SignAgreement = "sign_agreement",
}

export enum SlrFeature {
  Summary = "summary",
}

type IGetMinPaymentPrice = {
  rateInBps: number;
  uwLoanTermInMonths: number;
  rateType: RateType;
  startingPrincipalBalanceInCents: number;
  date: string;
  dateType: DateType;
  priceId: string | number;
};

type IGetMinPaymentPricePayload = {
  prices: Array<IGetMinPaymentPrice>;
  metaData?: {
    userId: number;
    loanId: string;
    feature: SlrFeature;
  };
};

type ICalculatedPriceSummary = {
  rateInBps: number;
  uwLoanTermInMonths: number;
  rateType: RateType;
  startingPrincipalBalanceInCents: number;
  date: string;
  dateType: DateType;
  priceId: string | number;
  minimumPaymentAmountInCents: number;
  paymentSchedule: {
    totalPrincipalPaidInDollars: number;
    totalInterestPaidInDollars: number;
    totalAmountPaidInDollars: number;
    finalPrincipalBalanceInDollars: number;
    finalInterestBalanceInDollars: number;
    lastPaymentDate: string;
    lastPaymentAmountInDollars: number;
    totalNumberOfPaymentsMade: number;
  };
};

type IGetMinPaymentPriceResponse = {
  prices: Array<ICalculatedPriceSummary>;
};

declare module "../../../clients/calculator-service/index.js" {
  /**
   * TODO: use this interface for the `CalculatorRequest` contract type to ensure consistent
   * interface for error handling / reporting
   */
  interface CalculatorRequestMethod<U = unknown, O = unknown> {
    (
      this: CalculatorServiceClient,
      input: Input<unknown>,
      context: ChassisPluginContext,
      payload: U,
    ): Promise<{ errors: Array<Error | IHttpError>; results?: O }>;
  }

  type GetMinPaymentPrice = IGetMinPaymentPrice;
  type GetMinPaymentPricePayload = IGetMinPaymentPricePayload;
  type GetMinPaymentPriceResponse = IGetMinPaymentPriceResponse;
  type Input<I> = IContractInput;
  type HttpError = IHttpError;
}
