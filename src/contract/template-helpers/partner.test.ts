import { describe, it } from "node:test";
import { partnerLogo, partnerName, formatDiscount } from "./partner.js";
import assert from "node:assert";

describe("partner", () => {
  describe("partnerLogo", () => {
    it("should return the correct logo for a direct match", () => {
      assert.strictEqual(partnerLogo("engine"), "logos.partnerLogoEngine");
      assert.strictEqual(partnerLogo("gradfin"), "logos.partnerLogoGradfin");
      assert.strictEqual(partnerLogo("juno"), "logos.partnerLogoJuno");
      assert.strictEqual(partnerLogo("purefy"), "logos.partnerLogoPurefy");
      assert.strictEqual(partnerLogo("sparrow"), "logos.partnerLogoSparrow");
      assert.strictEqual(partnerLogo("splash"), "logos.partnerLogoSplash");
    });
  
    it("should return the correct logo for a name in the names array", () => {
      assert.strictEqual(partnerLogo("Engine"), "logos.partnerLogoEngine");
      assert.strictEqual(partnerLogo("Gradfin"), "logos.partnerLogoGradfin");
      assert.strictEqual(partnerLogo("Juno"), "logos.partnerLogoJuno");
      assert.strictEqual(partnerLogo("Purefy"), "logos.partnerLogoPurefy");
      assert.strictEqual(partnerLogo("Sparrow"), "logos.partnerLogoSparrow");
      assert.strictEqual(partnerLogo("Splash"), "logos.partnerLogoSplash");
    });
  
    it("should return undefined for an unknown partner", () => {
      assert.strictEqual(partnerLogo("unknown"), undefined);
    });
  });

  describe("partnerName", () => {
    it("should return the correct name for a direct match", () => {
      assert.strictEqual(partnerName("engine"), "Engine");
      assert.strictEqual(partnerName("gradfin"), "GradFin");
      assert.strictEqual(partnerName("juno"), "Juno");
      assert.strictEqual(partnerName("purefy"), "Purefy");
      assert.strictEqual(partnerName("sparrow"), "Sparrow");
      assert.strictEqual(partnerName("splash"), "Splash");
    });
  
    it("should return the correct name for a name in the names array", () => {
      assert.strictEqual(partnerName("Engine"), "Engine");
      assert.strictEqual(partnerName("Gradfin"), "GradFin");
      assert.strictEqual(partnerName("Juno"), "Juno");
      assert.strictEqual(partnerName("Purefy"), "Purefy");
      assert.strictEqual(partnerName("Sparrow"), "Sparrow");
      assert.strictEqual(partnerName("Splash"), "Splash");
    });
  
    it("should return undefined for an unknown partner", () => {
      assert.strictEqual(partnerName("unknown"), undefined);
    });
  });

  describe("formatDiscount", () => {
    it("should return the correct formatted discount", () => {
      assert.strictEqual(formatDiscount(-10), "10%");
      assert.strictEqual(formatDiscount(-15), "15%");
      assert.strictEqual(formatDiscount(-20), "20%");
      assert.strictEqual(formatDiscount(-25), "25%");
      assert.strictEqual(formatDiscount(-30.5), "30.5%");
    });
  });
});
