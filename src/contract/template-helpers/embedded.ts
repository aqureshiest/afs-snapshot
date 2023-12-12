/* eslint-disable @typescript-eslint/no-unused-vars */
import Contract from "../contract.js";

export default function (bound: Injections, context) {
  const { type, key } = context.hash;

  const {
    executions: [executions],
  } = bound;

  if (executions.has(key)) {
    return executions.get(key);
  }

  const raw = context.fn(this);

  const contract = new Contract({ key, type, raw });
  const contractRaw = JSON.stringify(contract.execute(bound));

  executions.set(key, contractRaw);

  return contractRaw;
}
