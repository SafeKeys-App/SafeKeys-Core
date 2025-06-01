import {
  deriveKey,
  generateSalt,
  keyToString,
  stringToKey,
} from "../src/crypto/keyDerivation";

// Test made by AI

describe("Key Derivation", () => {
  const testPassword = "TestPassword123!";
  let testSalt: Uint8Array;
  let testKey: CryptoKey;

  beforeEach(async () => {
    testSalt = generateSalt();
    testKey = await deriveKey(testPassword, testSalt);
  });

  describe("generateSalt", () => {
    it("should generate a 32-byte salt", () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32);
    });

    it("should generate different salts each time", () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toEqual(salt2);
    });

    it("should generate cryptographically secure random values", () => {
      const salt = generateSalt();
      // Check that it's not all zeros
      const isAllZeros = salt.every((byte) => byte === 0);
      expect(isAllZeros).toBe(false);
    });
  });

  describe("deriveKey", () => {
    it("should derive a key from password and salt", async () => {
      const key = await deriveKey(testPassword, testSalt);
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.type).toBe("secret");
      expect(key.algorithm.name).toBe("AES-GCM");
    });

    it("should derive the same key for same password and salt", async () => {
      const key1 = await deriveKey(testPassword, testSalt);
      const key2 = await deriveKey(testPassword, testSalt);

      // Export both keys to compare them
      const key1Exported = await crypto.subtle.exportKey("jwk", key1);
      const key2Exported = await crypto.subtle.exportKey("jwk", key2);

      expect(key1Exported).toEqual(key2Exported);
    });

    it("should derive different keys for different passwords", async () => {
      const key1 = await deriveKey("password1", testSalt);
      const key2 = await deriveKey("password2", testSalt);

      const key1Exported = await crypto.subtle.exportKey("jwk", key1);
      const key2Exported = await crypto.subtle.exportKey("jwk", key2);

      expect(key1Exported).not.toEqual(key2Exported);
    });

    it("should derive different keys for different salts", async () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      const key1 = await deriveKey(testPassword, salt1);
      const key2 = await deriveKey(testPassword, salt2);

      const key1Exported = await crypto.subtle.exportKey("jwk", key1);
      const key2Exported = await crypto.subtle.exportKey("jwk", key2);

      expect(key1Exported).not.toEqual(key2Exported);
    });
  });

  describe("keyToString", () => {
    it("should serialize a CryptoKey to a string", async () => {
      const keyString = await keyToString(testKey);
      expect(typeof keyString).toBe("string");
      expect(keyString.length).toBeGreaterThan(0);
    });

    it("should produce a valid base64 string", async () => {
      const keyString = await keyToString(testKey);
      // Base64 regex pattern
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(base64Pattern.test(keyString)).toBe(true);
    });

    it("should produce the same string for the same key", async () => {
      const keyString1 = await keyToString(testKey);
      const keyString2 = await keyToString(testKey);
      expect(keyString1).toBe(keyString2);
    });

    it("should produce different strings for different keys", async () => {
      const salt2 = generateSalt();
      const key2 = await deriveKey("DifferentPassword", salt2);

      const keyString1 = await keyToString(testKey);
      const keyString2 = await keyToString(key2);

      expect(keyString1).not.toBe(keyString2);
    });
  });

  describe("stringToKey", () => {
    it("should deserialize a string back to a CryptoKey", async () => {
      const keyString = await keyToString(testKey);
      const deserializedKey = await stringToKey(keyString);

      expect(deserializedKey).toBeInstanceOf(CryptoKey);
      expect(deserializedKey.type).toBe("secret");
      expect(deserializedKey.algorithm.name).toBe("AES-GCM");
    });

    it("should recreate the exact same key", async () => {
      const keyString = await keyToString(testKey);
      const deserializedKey = await stringToKey(keyString);

      // Export both keys to compare them
      const originalExported = await crypto.subtle.exportKey("jwk", testKey);
      const deserializedExported = await crypto.subtle.exportKey(
        "jwk",
        deserializedKey
      );

      expect(originalExported).toEqual(deserializedExported);
    });

    it("should throw an error for invalid key string", async () => {
      await expect(stringToKey("invalid-key-string")).rejects.toThrow(
        "Failed to deserialize key"
      );
    });

    it("should throw an error for malformed base64", async () => {
      await expect(stringToKey("not-base64!@#")).rejects.toThrow(
        "Failed to deserialize key"
      );
    });

    it("should throw an error for valid base64 but invalid JWK", async () => {
      const invalidJwk = btoa('{"invalid": "jwk"}');
      await expect(stringToKey(invalidJwk)).rejects.toThrow(
        "Failed to deserialize key"
      );
    });
  });

  describe("Round-trip serialization", () => {
    it("should maintain key functionality after serialization/deserialization", async () => {
      // Serialize and deserialize the key
      const keyString = await keyToString(testKey);
      const deserializedKey = await stringToKey(keyString);

      // Test that both keys can encrypt/decrypt the same data
      const testData = new TextEncoder().encode("Hello, SafeKeys!");
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt with original key
      const encrypted1 = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        testKey,
        testData
      );

      // Decrypt with deserialized key
      const decrypted1 = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        deserializedKey,
        encrypted1
      );

      expect(new TextDecoder().decode(decrypted1)).toBe("Hello, SafeKeys!");

      // Encrypt with deserialized key
      const encrypted2 = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        deserializedKey,
        testData
      );

      // Decrypt with original key
      const decrypted2 = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        testKey,
        encrypted2
      );

      expect(new TextDecoder().decode(decrypted2)).toBe("Hello, SafeKeys!");
    });

    it("should work with multiple round trips", async () => {
      let currentKey = testKey;

      // Perform multiple serialization/deserialization cycles
      for (let i = 0; i < 3; i++) {
        const keyString = await keyToString(currentKey);
        currentKey = await stringToKey(keyString);
      }

      // Verify the key still works
      const testData = new TextEncoder().encode("Round trip test");
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        currentKey,
        testData
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        currentKey,
        encrypted
      );

      expect(new TextDecoder().decode(decrypted)).toBe("Round trip test");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty password", async () => {
      const key = await deriveKey("", testSalt);
      expect(key).toBeInstanceOf(CryptoKey);
    });

    it("should handle very long password", async () => {
      const longPassword = "a".repeat(1000);
      const key = await deriveKey(longPassword, testSalt);
      expect(key).toBeInstanceOf(CryptoKey);
    });

    it("should handle unicode characters in password", async () => {
      const unicodePassword = "🔐SafeKeys🔑测试密码";
      const key = await deriveKey(unicodePassword, testSalt);
      expect(key).toBeInstanceOf(CryptoKey);
    });
  });
});
