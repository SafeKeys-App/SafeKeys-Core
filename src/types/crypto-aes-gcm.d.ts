declare module "crypto-aes-gcm" {
  export function aes_gcm_encrypt(
    plainText: string,
    password: string
  ): Promise<string>;
  export function aes_gcm_decrypt(
    cipherText: string,
    password: string
  ): Promise<string>;
}
