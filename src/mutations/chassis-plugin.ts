import machine from "./machine.js";

export const plugin: Plugin = {
  name: "mutations",
  version: "1.0.0",
  registerOrder: 1,
  register: async () => {
    /* ============================== *
     * Define the plugin instance as a getter that always returns a fresh clone of the machine;
     * ============================== */
    Object.defineProperty(plugin, "instance", {
      get() {
        return machine.clone();
      },
    });
  },
};
