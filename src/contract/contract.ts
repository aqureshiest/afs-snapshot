import assert from "node:assert";
import * as contractTypes from "./contract-types/index.js";
import { createHash } from "crypto";

import * as constants from "./constants.js";
import handlebars from "./handlebars.js";

export default class Contract {
  id: string;
  name: string;
  version: string;
  Constructor: (typeof contractTypes)[ContractType];
  raw: string;
  parsed: unknown;
  template: Template;

  constructor({
    version,
    folders,
    type,
    raw,
    key = createHash("sha1").update(raw).digest().toString("hex"),
  }: ContstructorArguments) {
    const contractKey =
      folders && folders.length > 0 ? `${folders.join("/")}/${key}` : key;

    this.name = contractKey;
    this.id = version ? `${contractKey}.${version}` : contractKey;
    this.version = version ? version : "default";
    this.Constructor =
      contractTypes[type as ContractType] || contractTypes.identity;
    this.raw = raw;
    this.template = handlebars.compile(raw);
  }

  /**
   *
   */
  instantiate(scope: Executable, key: string, index?: number) {
    const keyPath = !scope || key.startsWith(":") ? key : "." + key;

    // define the contract instance ID by the path of the scope
    const id =
      (scope?.id || "") + keyPath + (index != null ? `[${index}]` : "");

    const instance = new this.Constructor({
      id,
      key: key,
      index: index,
      parent: this,
      sync: key !== constants.RESERVED_CONTRACT_KEYS[constants.ASYNC_CONTRACT],
      scope,
    });

    return instance;
  }
}
