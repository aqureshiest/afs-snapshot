import { describe, it } from 'node:test';
import assert from 'node:assert';

import { getEndpointsFromGlob } from './index.js';

describe('getEndpointsFromGlob', () => {
  it('should return the correct endpoints', async () => {
    const endpoints = await getEndpointsFromGlob();
    const endpoint = endpoints[0];

    assert.strictEqual(Boolean(endpoints), true);
    assert.strictEqual(["GET", "POST", "PUT", "PATCH", "DELETE"].includes(endpoint.method), true);
    assert.strictEqual(typeof endpoint.manifest, 'string');
    assert.strictEqual(typeof endpoint.handler, 'function');
  });
});