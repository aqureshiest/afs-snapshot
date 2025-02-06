// c8 ignore file
export const buildRequestBody = (definition, inputTypes) => {
  const { event, fields = "", payload = {} } = definition;
  const varsArray: string[] = [];
  const typesArray: string[] = [];

  for (const [key, value] of Object.entries(inputTypes)) {
    varsArray.push(`${key}: $${key}`);
    typesArray.push(`$${key}: ${value}`);
  }

  const vars = varsArray.join(", ");
  const types = typesArray.join(", ");

  return {
    query: `mutation(${types}) {
      ${event}(${vars}){
        ${fields}
        createdAt
        error
      }
    }`,
    variables: { ...payload, meta: { service: "apply-flow-service" } },
  };
};
