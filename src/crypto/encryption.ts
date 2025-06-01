import { aes_gcm_decrypt, aes_gcm_encrypt } from "crypto-aes-gcm";

export async function encryptVault(
  plainText: string,
  password: string
): Promise<string> {
  return await aes_gcm_encrypt(plainText, password);
}

export async function decryptVault(
  cipherText: string,
  password: string
): Promise<string> {
  return await aes_gcm_decrypt(cipherText, password);
}
