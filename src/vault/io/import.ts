import { decryptVault } from "../../crypto/encryption";
import {
  csvHeadersSchema,
  vaultFileSchema,
} from "../../schemas/importExportSchemas";
import { Vault, VAULT_VERSION } from "../../types/core";
import { ImportResult } from "../../types/features";
import { generateId } from "../../utils/id-generator";
import { validateVaultEntry } from "../../validation/validator";
import { deserializeVault, parseCSVLine } from "./utils";

/**
 * Importe un vault à partir d'une chaîne, avec support pour différents formats
 * @param data - Données du vault (JSON, CSV ou format vault chiffré)
 * @param masterPassword - Mot de passe maître pour le déchiffrement si nécessaire
 * @param onProgress - Callback pour la progression (utile pour gros fichiers)
 * @returns Promise<ImportResult> - Résultat de l'importation avec statistiques
 */
export const importVault = async (
  data: string,
  masterPassword?: string,
  onProgress?: (progress: number) => void
): Promise<ImportResult> => {
  const result: ImportResult = {
    vault: {} as Vault,
    importedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    // Déterminer le format basé sur le contenu
    if (
      data.startsWith("{") &&
      data.includes('"data"') &&
      data.includes('"version"')
    ) {
      // Format vault chiffré
      return await importEncryptedVault(data, masterPassword, onProgress);
    } else if (data.startsWith("{") || data.startsWith("[")) {
      // Format JSON
      return importJsonVault(data, onProgress);
    } else if (data.includes(",") && /[\r\n]/.test(data)) {
      // Format CSV
      return importCsvVault(data, onProgress);
    } else {
      throw new Error("Unsupported import format");
    }
  } catch (error) {
    if (error instanceof Error) {
      result.errors.push({ message: `Import failed: ${error.message}` });
    } else {
      result.errors.push({ message: "Unknown import error" });
    }
    return result;
  }
};

/**
 * Charge un vault depuis un fichier
 * @param filePath - Chemin du fichier source
 * @param masterPassword - Mot de passe maître pour le déchiffrement si nécessaire
 * @param onProgress - Callback pour la progression
 * @returns Promise<ImportResult> - Résultat de l'importation
 */
export const loadVaultFromFile = async (
  filePath: string,
  masterPassword?: string,
  onProgress?: (progress: number) => void
): Promise<ImportResult> => {
  try {
    // Lire le fichier
    const fileContent = await readFile(filePath);

    // Importer le vault depuis les données du fichier
    return await importVault(fileContent, masterPassword, onProgress);
  } catch (error) {
    const result: ImportResult = {
      vault: {} as Vault,
      importedCount: 0,
      skippedCount: 0,
      errors: [],
    };

    if (error instanceof Error) {
      result.errors.push({
        message: `Failed to load vault from file: ${error.message}`,
      });
    } else {
      result.errors.push({
        message: "Unknown error occurred while loading vault from file",
      });
    }

    return result;
  }
};

/**
 * Importe un vault chiffré
 */
async function importEncryptedVault(
  data: string,
  masterPassword?: string,
  onProgress?: (progress: number) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    vault: {} as Vault,
    importedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    // Valider le format du fichier vault
    const parsedData = JSON.parse(data);
    const validationResult = vaultFileSchema.safeParse(parsedData);

    if (!validationResult.success) {
      result.errors.push({ message: "Invalid vault file format" });
      return result;
    }

    if (!masterPassword) {
      result.errors.push({
        message: "Master password is required for encrypted vault import",
      });
      return result;
    }

    // Déchiffrer les données
    onProgress?.(10); // Début du déchiffrement
    const decrypted = await decryptVault(parsedData.data, masterPassword);
    onProgress?.(50); // Déchiffrement terminé

    // Parser le vault déchiffré
    const vaultData = JSON.parse(decrypted);
    const deserializedVault = deserializeVault(vaultData);

    // Valider chaque entrée
    const validEntries = [];
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < deserializedVault.entries.length; i++) {
      const entry = deserializedVault.entries[i];
      const validationResult = validateVaultEntry(entry);

      if (validationResult.isValid) {
        validEntries.push(entry);
        importedCount++;
      } else {
        skippedCount++;
        result.errors.push({
          message: `Invalid entry: ${entry.title || "Unknown"}`,
          data: validationResult.errors,
        });
      }

      // Mise à jour de la progression
      if (onProgress) {
        const progress =
          50 + Math.floor((i / deserializedVault.entries.length) * 50);
        onProgress(progress);
      }
    }

    // Mettre à jour les entrées avec seulement celles valides
    deserializedVault.entries = validEntries;

    result.vault = deserializedVault;
    result.importedCount = importedCount;
    result.skippedCount = skippedCount;

    onProgress?.(100); // Importation terminée
    return result;
  } catch (error) {
    if (error instanceof Error) {
      result.errors.push({ message: `Decryption failed: ${error.message}` });
    } else {
      result.errors.push({ message: "Unknown error during vault decryption" });
    }
    return result;
  }
}

/**
 * Importe un vault au format JSON
 */
function importJsonVault(
  data: string,
  onProgress?: (progress: number) => void
): ImportResult {
  const result: ImportResult = {
    vault: {} as Vault,
    importedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    onProgress?.(10);
    const parsedData = JSON.parse(data);

    // Vérifier si c'est un tableau (liste d'entrées) ou un objet (vault complet)
    if (Array.isArray(parsedData)) {
      // C'est une liste d'entrées, créer un nouveau vault
      const validEntries = [];
      let importedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < parsedData.length; i++) {
        const entry = parsedData[i];
        const validationResult = validateVaultEntry(entry);

        if (validationResult.isValid) {
          validEntries.push(entry);
          importedCount++;
        } else {
          skippedCount++;
          result.errors.push({
            message: `Invalid entry at index ${i}`,
            data: validationResult.errors,
          });
        }

        if (onProgress) {
          const progress = 10 + Math.floor((i / parsedData.length) * 90);
          onProgress(progress);
        }
      }

      // Créer un nouveau vault avec les entrées valides
      result.vault = {
        id: generateId(),
        name: "Imported Vault",
        entries: validEntries,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: VAULT_VERSION,
      } as Vault;

      result.importedCount = importedCount;
      result.skippedCount = skippedCount;
    } else {
      // C'est un objet vault complet
      const deserializedVault = deserializeVault(parsedData);

      // Valider chaque entrée
      const validEntries = [];
      let importedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < deserializedVault.entries.length; i++) {
        const entry = deserializedVault.entries[i];
        const validationResult = validateVaultEntry(entry);

        if (validationResult.isValid) {
          validEntries.push(entry);
          importedCount++;
        } else {
          skippedCount++;
          result.errors.push({
            message: `Invalid entry: ${entry.title || "Unknown"}`,
            data: validationResult.errors,
          });
        }

        if (onProgress) {
          const progress =
            10 + Math.floor((i / deserializedVault.entries.length) * 90);
          onProgress(progress);
        }
      }

      // Mettre à jour les entrées avec seulement celles valides
      deserializedVault.entries = validEntries;

      result.vault = deserializedVault;
      result.importedCount = importedCount;
      result.skippedCount = skippedCount;
    }

    onProgress?.(100);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      result.errors.push({ message: `JSON parsing failed: ${error.message}` });
    } else {
      result.errors.push({ message: "Unknown error during JSON parsing" });
    }
    return result;
  }
}

/**
 * Importe un vault au format CSV
 */
function importCsvVault(
  data: string,
  onProgress?: (progress: number) => void
): ImportResult {
  const result: ImportResult = {
    vault: {} as Vault,
    importedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    onProgress?.(10);

    // Parser le CSV
    const lines = data.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      result.errors.push({ message: "Empty CSV file" });
      return result;
    }

    // Extraire les en-têtes
    const headers = lines[0].split(",").map((h) => h.trim());

    // Valider les en-têtes avec le schéma
    const headersValidation = csvHeadersSchema.safeParse({ headers });
    if (!headersValidation.success) {
      result.errors.push({
        message:
          headersValidation.error.errors[0].message || "Invalid CSV headers",
      });
      return result;
    }

    // Convertir les lignes en entrées
    const entries = [];
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);

        if (values.length !== headers.length) {
          result.errors.push({
            line: i + 1,
            message: `Invalid CSV line: column count mismatch`,
          });
          skippedCount++;
          continue;
        }

        // Créer l'objet d'entrée à partir des en-têtes et des valeurs
        const entry: any = {
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = values[j];

          // Gestion spéciale pour certains champs
          if (header === "tags" && value) {
            entry.tags = value.split(";").map((tag: string) => tag.trim());
          } else {
            entry[header] = value;
          }
        }

        // Valider l'entrée
        const validationResult = validateVaultEntry(entry);

        if (validationResult.isValid) {
          entries.push(entry);
          importedCount++;
        } else {
          skippedCount++;
          result.errors.push({
            line: i + 1,
            message: `Invalid entry: ${entry.title || "Unknown"}`,
            data: validationResult.errors,
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          result.errors.push({
            line: i + 1,
            message: `CSV parsing error: ${error.message}`,
          });
        } else {
          result.errors.push({
            line: i + 1,
            message: "Unknown error during CSV parsing",
          });
        }
        skippedCount++;
      }

      if (onProgress) {
        const progress = 10 + Math.floor((i / lines.length) * 90);
        onProgress(progress);
      }
    }

    // Créer un nouveau vault avec les entrées
    result.vault = {
      id: generateId(),
      name: "Imported CSV Vault",
      entries: entries,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: VAULT_VERSION,
    } as Vault;

    result.importedCount = importedCount;
    result.skippedCount = skippedCount;

    onProgress?.(100);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      result.errors.push({ message: `CSV parsing failed: ${error.message}` });
    } else {
      result.errors.push({ message: "Unknown error during CSV parsing" });
    }
    return result;
  }
}

/**
 * Lit un fichier
 * @param filePath - Chemin du fichier
 * @returns Promise<string> - Contenu du fichier
 */
async function readFile(filePath: string): Promise<string> {
  // Implémentation à adapter selon la plateforme
  throw new Error("File system access not implemented");
}
