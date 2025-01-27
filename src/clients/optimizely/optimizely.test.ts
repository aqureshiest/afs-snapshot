import { describe, it, before, mock, afterEach } from 'node:test';
import assert from 'assert';
import OptimizelySDK from '@optimizely/optimizely-sdk';
import PluginContext from '@earnest-labs/microservice-chassis/PluginContext.js';
import readJsonFile from '@earnest-labs/microservice-chassis/readJsonFile.js';
import createPluginContext from '@earnest-labs/microservice-chassis/createPluginContext.js';
import registerChassisPlugins from '@earnest-labs/microservice-chassis/registerChassisPlugins.js';

import OptimizelyClient, { FeatureFlagKey } from './client.js';

describe('[0defb22a] OptimizelyClient', () => {
  let context: PluginContext;
  let optimizelyClient: OptimizelyClient;

  before(async () => {
    const pkg = await readJsonFile('./package.json');
    pkg.logging = { level: 'error' };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);

    if (context.loadedPlugins.optimizelyClient.instance) {
      optimizelyClient = context.loadedPlugins.optimizelyClient.instance;
    }
  });

  describe('[2023aa31] createInstance', () => {
    afterEach(() => {
      mock.restoreAll();
    });

    it('[193338ae] should create an Optimizely SDK instance', () => {
      const mockFn = mock.fn(async () => true);
      mock.method(OptimizelySDK, 'createInstance', mockFn);

      const instance = optimizelyClient.createInstance();
      assert(instance);
    });

    it('[0e58c24e] should throw an error if sdkKey is not provided', () => {
      optimizelyClient.sdkKey = '';
      assert.throws(() => optimizelyClient.createInstance(), {
        message: '[4134f35a] no sdk key found',
      });
    });

    it('[a254461c] should throw an error if Optimizely SDK instance creation fails', () => {
      const originalCreateInstance = OptimizelySDK.createInstance;
      OptimizelySDK.createInstance = () => null;
      optimizelyClient.sdkKey = 'ABCD12345';
      assert.throws(() => optimizelyClient.createInstance(), {
        message: '[7719511a] Failed to create Optimizely SDK instance',
      });
      OptimizelySDK.createInstance = originalCreateInstance;
    });
  });

  describe('[fc0b691d] getFeatureFlag', () => {
    afterEach(() => {
      mock.restoreAll();
    });

    it('[18dd7551] cis_person flag should return true if feature flag is enabled', async () => {
      const mockClient = {
        onReady: () => Promise.resolve(),
        isFeatureEnabled: mock.fn(() => true),
      };

      const mockFn = mock.fn(() => mockClient);
      mock.method(OptimizelySDK, 'createInstance', mockFn);
      const result = await optimizelyClient.getFeatureFlag(
        FeatureFlagKey.CIS_PERSON,
        undefined,
        undefined
      );
      assert.strictEqual(result, true);
    });

    it('[8d465a5b] cis_person should return false if feature flag is not enabled', async () => {
      const mockClient = {
        onReady: () => Promise.resolve(),
        isFeatureEnabled: mock.fn(() => false),
      };

      const mockFn = mock.fn(() => mockClient);
      mock.method(OptimizelySDK, 'createInstance', mockFn);
      const result = await optimizelyClient.getFeatureFlag(
        FeatureFlagKey.CIS_PERSON,
        undefined,
        undefined
      );
      assert.strictEqual(result, false);
    });

    it('[6bc01db3] cis_person should log and throw an error if something goes wrong', async () => {
      const error = new Error('Test error');
      const mockClient = {
        onReady: () => Promise.reject(error),
      };

      const mockFn = mock.fn(() => mockClient);
      mock.method(OptimizelySDK, 'createInstance', mockFn);

      await assert.rejects(
        async () =>
          await optimizelyClient.getFeatureFlag(
            FeatureFlagKey.CIS_PERSON,
            undefined,
            undefined
          ),
        error
      );
    });
  });
});
