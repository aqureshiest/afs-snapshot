import "contract/contract-types/base-contract.js";
declare module "contract/contract-types/base-contract.js" {
  interface Execution<This, Input, Output = unknown> {
    (this: This, input: Input): Output;
  }

  interface Coercion<This, Output, Coerced = unknown> {
    (this: This, input: Output): Coerced;
  }

  type Coercions<This, Key, Input, Output> = {
    [key: string]: typeof key extends Key
      ? Execution<This, Input, Output>
      : Coercion<This, Output>;
  };

  type ContractTypeArguments<Key extends string, Input, Output> = Coercions<
    ContractType<Key, Input, Output>,
    Key,
    Input,
    Output
  >;
}

import "contract/contract-types/operation.js";
declare module "contract/contract-types/operation.js" {}
