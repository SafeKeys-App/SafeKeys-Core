export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generates a cryptographically secure random salt
 * @returns A 32-byte Uint8Array salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Serializes a CryptoKey to a string for storage/transmission
 * @param key - The CryptoKey to serialize
 * @returns Promise<string> - Base64 encoded JWK string
 */
export async function keyToString(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  const jwkString = JSON.stringify(jwk);
  return btoa(jwkString);
}

/**
 * Deserializes a string back to a CryptoKey
 * @param keyString - Base64 encoded JWK string
 * @returns Promise<CryptoKey> - The reconstructed CryptoKey
 */
export async function stringToKey(keyString: string): Promise<CryptoKey> {
  try {
    const jwkString = atob(keyString);
    const jwk = JSON.parse(jwkString);

    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    throw new Error(
      `Failed to deserialize key: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
