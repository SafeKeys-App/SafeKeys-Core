import { decryptVault, encryptVault } from "../../crypto/encryption";
import {
  csvHeadersSchema,
  vaultFileSchema,
} from "../../schemas/importExportSchemas";
import {
  EncryptedVault,
  EntryCategory,
  Vault,
  VAULT_VERSION,
  VaultEntry,
} from "../../types/core";
import { ExportOptions, ImportResult } from "../../types/features";
import { generateId } from "../../utils/id-generator";
import { validateVaultEntry } from "../../validation/validator";

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
      // Pour le format vault, on chiffre toujours les données
      if (!masterPassword && options.encrypted) {
        throw new Error(
          "Master password is required for encrypted vault export"
        );
      }

      // Convertir les dates en chaînes pour la sérialisation
      const serializedVault = serializeVault(vaultCopy);

      // Si l'encryption est demandée
      if (options.encrypted) {
        const encrypted = await encryptVault(
          JSON.stringify(serializedVault),
          masterPassword!
        );

        // Créer l'objet EncryptedVault
        const encryptedVault: EncryptedVault = {
          data: encrypted,
          salt: "", // Automatiquement géré par encryptVault
          iv: "", // Automatiquement géré par encryptVault
          version: VAULT_VERSION,
          metadata: {
            name: vaultCopy.name,
            createdAt: vaultCopy.createdAt.toISOString(),
            lastModified: vaultCopy.updatedAt.toISOString(),
            entryCount: vaultCopy.entries.length,
            checksum: calculateChecksum(JSON.stringify(serializedVault)),
          },
        };

        return JSON.stringify(encryptedVault);
      }

      // Sinon retourner le vault non chiffré en JSON
      return JSON.stringify(serializedVault);
  }
};

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

// Fonctions utilitaires

/**
 * Sérialiser les dates dans le vault pour le stockage JSON
 */
function serializeVault(vault: Vault): any {
  const serialized = { ...vault };

  // Convertir les dates en chaînes ISO
  if (serialized.createdAt instanceof Date) {
    (serialized as any).createdAt = serialized.createdAt.toISOString();
  }
  if (serialized.updatedAt instanceof Date) {
    (serialized as any).updatedAt = serialized.updatedAt.toISOString();
  }

  // Sérialiser les dates dans les entrées
  if (Array.isArray(serialized.entries)) {
    serialized.entries = serialized.entries.map((entry: VaultEntry) => {
      const serializedEntry = { ...entry };
      if (serializedEntry.createdAt instanceof Date) {
        (serializedEntry as any).createdAt =
          serializedEntry.createdAt.toISOString();
      }
      if (serializedEntry.updatedAt instanceof Date) {
        (serializedEntry as any).updatedAt =
          serializedEntry.updatedAt.toISOString();
      }
      return serializedEntry;
    });
  }

  return serialized;
}

/**
 * Désérialiser un vault (convertir les chaînes ISO en dates)
 */
function deserializeVault(vault: any): Vault {
  const deserialized = { ...vault };

  // Convertir les chaînes ISO en dates
  if (typeof deserialized.createdAt === "string") {
    deserialized.createdAt = new Date(deserialized.createdAt);
  }
  if (typeof deserialized.updatedAt === "string") {
    deserialized.updatedAt = new Date(deserialized.updatedAt);
  }

  // Désérialiser les dates dans les entrées
  if (Array.isArray(deserialized.entries)) {
    deserialized.entries = deserialized.entries.map((entry: any) => {
      const deserializedEntry = { ...entry };
      if (typeof deserializedEntry.createdAt === "string") {
        deserializedEntry.createdAt = new Date(deserializedEntry.createdAt);
      }
      if (typeof deserializedEntry.updatedAt === "string") {
        deserializedEntry.updatedAt = new Date(deserializedEntry.updatedAt);
      }
      return deserializedEntry;
    });
  }

  return deserialized as Vault;
}

/**
 * Calculer un checksum simple pour vérifier l'intégrité
 */
function calculateChecksum(data: string): string {
  // Implémentation simple d'un hash, à remplacer par un algorithme plus robuste
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir en un entier 32 bits
  }
  return Math.abs(hash).toString(16);
}

/**
 * Importer un vault chiffré
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
 * Importer un vault au format JSON
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
 * Importer un vault au format CSV
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
 * Parser une ligne CSV en tenant compte des guillemets
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Si on a deux guillemets consécutifs à l'intérieur d'une chaîne entre guillemets,
      // c'est un guillemet échappé
      if (inQuotes && i < line.length - 1 && line[i + 1] === '"') {
        current += '"';
        i++; // Sauter le prochain guillemet
      } else {
        // Sinon, c'est un début ou une fin de chaîne entre guillemets
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Fin d'une valeur, si on n'est pas entre guillemets
      result.push(current);
      current = "";
    } else {
      // Ajouter le caractère à la valeur courante
      current += char;
    }
  }

  // Ajouter la dernière valeur
  result.push(current);

  return result;
}

/**
 * Convertir un vault en format CSV
 */
function convertVaultToCsv(vault: Vault): string {
  // Définir les en-têtes CSV
  const headers = [
    "title",
    "username",
    "password",
    "url",
    "notes",
    "category",
    "tags",
    "favorite",
  ];

  // Créer la ligne d'en-tête
  let csv = headers.join(",") + "\n";

  // Ajouter chaque entrée
  for (const entry of vault.entries) {
    const row = [
      escapeCSV(entry.title),
      escapeCSV(entry.username || ""),
      escapeCSV(entry.password || ""),
      escapeCSV(entry.url || ""),
      escapeCSV(entry.notes || ""),
      escapeCSV(entry.category?.toString() || ""),
      escapeCSV(entry.tags ? entry.tags.join(";") : ""),
      String(entry.favorite || false),
    ];

    csv += row.join(",") + "\n";
  }

  return csv;
}

/**
 * Échapper une valeur pour le CSV
 */
function escapeCSV(value: string): string {
  if (value === null || value === undefined) {
    return "";
  }

  const strValue = String(value);

  // Si la valeur contient des virgules, des guillemets ou des sauts de ligne,
  // l'entourer de guillemets et échapper les guillemets internes
  if (/[",\n\r]/.test(strValue)) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }

  return strValue;
}

/**
 * Fonctions d'accès au système de fichiers
 * À implémenter selon la plateforme cible (Node.js, Electron, Web, etc.)
 */
async function writeFile(filePath: string, data: string): Promise<void> {
  // Implémentation à adapter selon la plateforme
  throw new Error("File system access not implemented");
}

async function readFile(filePath: string): Promise<string> {
  // Implémentation à adapter selon la plateforme
  throw new Error("File system access not implemented");
}
