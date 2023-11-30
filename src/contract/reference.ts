/**
 * Contracts and Manifests that reference application details can track all
 * references prior to execution to aid in the fetching of inputs
 */
export default class Reference<Value = unknown> {
  key: string;
  value: Value | undefined;

  constructor(key: string) {
    this.key = key;
  }

  /**
   * If
   */
  toJSON() {
    return this.value !== undefined ? this.value : this;
  }
}
