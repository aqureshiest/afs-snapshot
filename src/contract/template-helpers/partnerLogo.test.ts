import { describe, it } from "node:test";
import partnerLogo from './partnerLogo.js';
import assert from "node:assert";

describe('partnerLogo', () => {
  it('should return the correct logo for a direct match', () => {
    assert.strictEqual(partnerLogo('engine'), 'logos.partnerLogoEngine');
    assert.strictEqual(partnerLogo('gradfin'), 'logos.partnerLogoGradfin');
    assert.strictEqual(partnerLogo('juno'), 'logos.partnerLogoJuno');
    assert.strictEqual(partnerLogo('purefy'), 'logos.partnerLogoPurefy');
    assert.strictEqual(partnerLogo('sparrow'), 'logos.partnerLogoSparrow');
    assert.strictEqual(partnerLogo('splash'), 'logos.partnerLogoSplash');
  });

  it('should return the correct logo for a name in the names array', () => {
    assert.strictEqual(partnerLogo('Engine'), 'logos.partnerLogoEngine');
    assert.strictEqual(partnerLogo('Gradfin'), 'logos.partnerLogoGradfin');
    assert.strictEqual(partnerLogo('Juno'), 'logos.partnerLogoJuno');
    assert.strictEqual(partnerLogo('Purefy'), 'logos.partnerLogoPurefy');
    assert.strictEqual(partnerLogo('Sparrow'), 'logos.partnerLogoSparrow');
    assert.strictEqual(partnerLogo('Splash'), 'logos.partnerLogoSplash');
  });

  it('should return undefined for an unknown partner', () => {
    assert.strictEqual(partnerLogo('unknown'), undefined);
  });
});