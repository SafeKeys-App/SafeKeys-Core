# 🛡️ SafeKeys Core

Librairie de chiffrement/déchiffrement utilisée par toutes les apps SafeKeys (mobile, desktop, extension).

## Fonctionnalités

- 🔐 AES-GCM via `crypto-aes-gcm`
- 🔑 Dérivation de clé via PBKDF2 (SHA-256)
- 📦 Modèle de coffre (`Vault`)
- 🧱 TypeScript & simple à utiliser

## Exemple

```ts
import { encryptVault, decryptVault } from "safekeys-core";

const encrypted = await encryptVault(
  JSON.stringify({ entries: [] }),
  "masterpassword"
);
const decrypted = await decryptVault(encrypted, "masterpassword");
```
