import { encryptVault } from "../../crypto/encryption";
import {
  EncryptedVault,
  EntryCategory,
  Vault,
  VAULT_VERSION,
  VaultEntry,
} from "../../types/core";
import { ExportOptions } from "../../types/features";
import { calculateChecksum, convertVaultToCsv, serializeVault } from "./utils";

/**
 * Exporte un vault dans un format spécifié, avec ou sans chiffrement
 * @param vault - Le vault à exporter
 * @param masterPassword - Mot de passe maître pour le chiffrement (obligatoire si encrypted=true)
 * @param options - Options d'exportation
 * @returns Promise<string> - Données exportées (JSON ou format brut)
 */
export const exportVault = async (
  vault: Vault,
  masterPassword?: string,
  options: ExportOptions = {
    format: "vault",
    includePasswords: true,
    encrypted: true,
  }
): Promise<string> => {
  // Créer une copie profonde du vault pour éviter de modifier l'original
  const vaultCopy = JSON.parse(JSON.stringify(vault));

  // Filtrer par catégories si spécifié
  if (options.categories && options.categories.length > 0) {
    vaultCopy.entries = vaultCopy.entries.filter((entry: VaultEntry) =>
      options.categories!.includes(entry.category as EntryCategory)
    );
  }

  // Supprimer les mots de passe si non inclus
  if (!options.includePasswords) {
    vaultCopy.entries = vaultCopy.entries.map((entry: VaultEntry) => {
      const { password, ...rest } = entry;
      return rest;
    });
  }

  // Gérer les différents formats d'export
  switch (options.format) {
    case "csv":
      return convertVaultToCsv(vaultCopy);

    case "json":
      return JSON.stringify(vaultCopy, null, 2);

    case "vault":
    default:
      return exportEncryptedVault(vaultCopy, masterPassword, options.encrypted);
  }
};

/**
 * Exporte un vault au format chiffré
 * @param vault - Le vault à exporter
 * @param masterPassword - Mot de passe maître pour le chiffrement
 * @param encrypted - Si true, le vault sera chiffré
 * @returns Promise<string> - Données du vault exporté
 */
async function exportEncryptedVault(
  vault: Vault,
  masterPassword?: string,
  encrypted: boolean = true
): Promise<string> {
  // Pour le format vault, on chiffre toujours les données
  if (!masterPassword && encrypted) {
    throw new Error("Master password is required for encrypted vault export");
  }

  // Convertir les dates en chaînes pour la sérialisation
  const serializedVault = serializeVault(vault);

  // Si l'encryption est demandée
  if (encrypted) {
    const encrypted = await encryptVault(
      JSON.stringify(serializedVault),
      masterPassword!
    );

    // S'assurer que les dates sont au format string pour le metadata
    const createdAtStr =
      typeof vault.createdAt === "string"
        ? vault.createdAt
        : vault.createdAt instanceof Date
        ? vault.createdAt.toISOString()
        : new Date().toISOString();

    const updatedAtStr =
      typeof vault.updatedAt === "string"
        ? vault.updatedAt
        : vault.updatedAt instanceof Date
        ? vault.updatedAt.toISOString()
        : new Date().toISOString();

    // Créer l'objet EncryptedVault
    const encryptedVault: EncryptedVault = {
      data: encrypted,
      salt: "", // Automatiquement géré par encryptVault
      iv: "", // Automatiquement géré par encryptVault
      version: VAULT_VERSION,
      metadata: {
        name: vault.name,
        createdAt: createdAtStr,
        lastModified: updatedAtStr,
        entryCount: vault.entries.length,
        checksum: calculateChecksum(JSON.stringify(serializedVault)),
      },
    };

    return JSON.stringify(encryptedVault);
  }

  // Sinon retourner le vault non chiffré en JSON
  return JSON.stringify(serializedVault);
}

/**
 * Sauvegarde un vault dans un fichier
 * @param vault - Le vault à sauvegarder
 * @param filePath - Chemin du fichier de destination
 * @param masterPassword - Mot de passe maître pour le chiffrement
 * @param options - Options d'exportation
 * @returns Promise<void>
 */
export const saveVaultToFile = async (
  vault: Vault,
  filePath: string,
  masterPassword: string,
  options: ExportOptions = {
    format: "vault",
    includePasswords: true,
    encrypted: true,
  }
): Promise<void> => {
  try {
    // Exporter le vault
    const exportedData = await exportVault(vault, masterPassword, options);

    // Utiliser l'API FileSystem pour sauvegarder le fichier
    await writeFile(filePath, exportedData);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to save vault to file: ${error.message}`);
    }
    throw new Error("Unknown error occurred while saving vault to file");
  }
};

/**
 * Écrit des données dans un fichier
 * @param filePath - Chemin du fichier
 * @param data - Données à écrire
 */
async function writeFile(filePath: string, data: string): Promise<void> {
  // Implémentation à adapter selon la plateforme
  throw new Error("File system access not implemented");
}
