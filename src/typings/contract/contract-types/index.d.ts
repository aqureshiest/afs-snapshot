import type {
  Input as IContractInput,
  Manifest as IContractManifest,
} from "contract/contract-executor.test.js";

import "contract/contract-types/base-contract.js";
declare module "contract/contract-types/base-contract.js" {
  interface Execution<This, Input, Output = unknown> {
    (this: This, input: Input): Output;
  }

  interface Coercion<Input, Coerced> {
    <This>(this: This, input: Input): Coerced;
  }
}

import "contract/contract-types/application-event.js";
declare module "contract/contract-types/application-event.js" {
  type Definition = {
    event: string;
    [key: string]: unknown;
  };
  type Output = string;
}

import "contract/contract-types/or.test.js";
declare module "contract/contract-types/or.test.js" {
  type Input = IContractInput;
  type Manifest = IContractManifest;
}

import "contract/contract-types/and.test.js";
declare module "contract/contract-types/and.test.js" {
  type Input = IContractInput;
  type Manifest = IContractManifest;
}

import "contract/contract-types/not.test.js";
declare module "contract/contract-types/not.test.js" {
  type Input = IContractInput;
  type Manifest = IContractManifest;
}
