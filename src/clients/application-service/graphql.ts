export const mutationSchemaQuery = `query shcema {
  __type(name: "Mutation") {
    name
      fields {
        name
        args {
          name
          type {
            name
            kind
            ofType {
              name
            }
          }
        }
      }
    }
  }`;
