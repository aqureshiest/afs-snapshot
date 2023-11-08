/* eslint-disable @typescript-eslint/no-unused-vars */
const postHandler: Handler = async function (context, req, res, next) {
  const contract = res.locals.contract;
  const mutations = res.locals.mutations;

  if (mutations.length === 0) {
    return res.send(contract);
  }

  /* ============================== *
   * TODO: complex mutations may need to go through an entirely separate
   * side-effect orchestration layer
   * ============================== */

  const results = await Promise.all(
    mutations.map((mutation) => mutation.run()),
  );

  return res.send(results);
};

export default postHandler;
