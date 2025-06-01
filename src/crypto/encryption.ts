import { aes_gcm_decrypt, aes_gcm_encrypt } from "crypto-aes-gcm";

export const encryptVault = async (
  plainText: string,
  password: string
): Promise<string> => {
  return await aes_gcm_encrypt(plainText, password);
};

export const decryptVault = async (
  cipherText: string,
  password: string
): Promise<string> => {
  return await aes_gcm_decrypt(cipherText, password);
};
