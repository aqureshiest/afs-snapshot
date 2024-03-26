// import assert from "node:assert";
// import ContractType from "./base-contract.js";

// class PiiSaveToken extends ContractType<Definition, Definition, Output> {
//   get contractName(): string {
//     return "PiiSaveToken";
//   }

//   /**
//    */
//   condition = (input: Input, context: Injections, definition: Definition) => {
//     const method = input.request?.method;

//     const { event, payload } = definition;

//     return true;
//   };

//   evaluate = async (
//     input: Input,
//     injections: Injections,
//     definition: Definition,
//   ) => {
//     const { context } = injections;
//     const piiTokenService = context.loadedPlugins.piiTokenService?.instance;
//     assert(piiTokenService, "[3eac36d3] plaidClient not instantiated");
//     let result;
//     try {
//       result = await piiTokenService[definition.method](
//         context,
//         definition.value,
//       );
//     } catch (ex) {
//       console.log(ex);
//     }

//     return result.uri;
//   };
// }

// export default PiiSaveToken;
