import { decryptVault, encryptVault } from "../src/crypto/encryption";

describe("Encryption", () => {
  const password = "SuperSecret123!";
  const data = JSON.stringify({ message: "Hello SafeKeys!" });

  it("should encrypt and decrypt data correctly", async () => {
    const encrypted = await encryptVault(data, password);
    const decrypted = await decryptVault(encrypted, password);
    expect(decrypted).toBe(data);
  });

  it("should fail with wrong password", async () => {
    const encrypted = await encryptVault(data, password);
    await expect(decryptVault(encrypted, "WrongPassword")).rejects.toThrow();
  });
});
