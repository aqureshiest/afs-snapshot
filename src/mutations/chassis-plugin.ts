import effects from "./effects/index.js";

export const plugin: Plugin = {
  name: "mutations",
  version: "1.0.0",
  registerOrder: 1,
  register: async () => {
    plugin.instance = effects;
  },
};
