import { Vault, VaultEntry } from "../../types/core";

/**
 * Sérialiser les dates dans le vault pour le stockage JSON
 * @param vault - Le vault à sérialiser
 * @returns Le vault avec les dates converties en chaînes
 */
export function serializeVault(vault: Vault): any {
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
 * @param vault - Le vault à désérialiser
 * @returns Le vault avec les chaînes converties en dates
 */
export function deserializeVault(vault: any): Vault {
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
 * @param data - Les données à hasher
 * @returns Le hash sous forme de chaîne hexadécimale
 */
export function calculateChecksum(data: string): string {
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
 * Parser une ligne CSV en tenant compte des guillemets
 * @param line - La ligne CSV à parser
 * @returns Tableau de valeurs
 */
export function parseCSVLine(line: string): string[] {
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
 * @param vault - Le vault à convertir
 * @returns Chaîne CSV
 */
export function convertVaultToCsv(vault: Vault): string {
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
 * @param value - La valeur à échapper
 * @returns La valeur échappée
 */
export function escapeCSV(value: string): string {
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
