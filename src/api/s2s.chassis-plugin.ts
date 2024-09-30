import SensitiveString from "@earnest-labs/ts-sensitivestring";

const S2S_KEY_PREFIX = "S2S_KEY_";

/**
 * Read environment variables prefixed with `S2S_KEY_` and create a source mapping
 */
export const plugin: Plugin = {
  name: "credentials",
  version: "1.0.0",
  registerOrder: 1,
  register: async (context: Context) => {
    /**
     * This object is only available in this scope to prevent outside concerns from dumping credentials
     */
    const privateSources = Object.keys(context.env)
      .filter((variableName) => variableName.startsWith(S2S_KEY_PREFIX))
      .reduce((obj, variableKey) => {
        const sourceName = variableKey
          .slice(S2S_KEY_PREFIX.length)
          .toLowerCase()
          .replace(/_/gi, "-");
        const credential = SensitiveString.ExtractValue(
          context.env[variableKey],
        );
        if (credential) {
          /**
           *
           */
          Object.defineProperty(obj, credential, {
            value: sourceName,
            enumerable: false,
            writable: false,
          });
        }

        return obj;
      }, {});

    /**
     * The plugin instance is obscured behind a proxy so that the private
     * sources target object is not revealed anywhere, but it will treat any
     * attempted property access as though it's attempting to access an owned
     * property (for the sake of convincing any accessor that any credential
     * qualifies as a valid property access)
     */
    plugin.instance = new Proxy({} as unknown as typeof privateSources, {
      get(target, path: string) {
        return Reflect.get(privateSources, path) || null;
      },
      getOwnPropertyDescriptor(target, property) {
        return { configurable: true, enumerable: false, writable: false };
      },
    });
  },
};
