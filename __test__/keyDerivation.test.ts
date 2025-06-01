import { deriveKey } from "../src/crypto/keyDerivation";

describe("Key Derivation", () => {
  const password = "SafeKeysPassword123!";
  const salt = crypto.getRandomValues(new Uint8Array(16));

  it("Should derive a key from password and salt", async () => {
    const key = await deriveKey(password, salt);
    expect(key).toBeInstanceOf(CryptoKey);
  });

  it("should derive different keys for different salts", async () => {
    const otherSalt = crypto.getRandomValues(new Uint8Array(16));
    const key1 = await deriveKey(password, salt);
    const key2 = await deriveKey(password, otherSalt);
    expect(key1).not.toEqual(key2);
  });
});
