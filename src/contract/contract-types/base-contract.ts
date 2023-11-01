export default class ContractType<Key extends string, Input, Output> {
  [key: string]: typeof key extends Key
    ? Execution<this, Input, Output>
    : Coercion<this, Output>;

  static identity<T>(input: T): T {
    return input;
  }

  constructor(
    coercions: Coercions<ContractType<Key, Input, Output>, Key, Input, Output>,
  ) {
    Object.keys(coercions).forEach((coercion) => {
      Object.defineProperty(this, coercion, {
        value: coercions[coercion].bind(this),
      });
    });
  }
}
