import {
  CreateVaultData,
  CreateVaultEntryData,
  DEFAULT_VAULT_SETTINGS,
  ValidationResult,
  Vault,
  VAULT_VERSION,
  VaultEntry,
} from "../types";
import { generateId } from "../utils/id-generator";
import { createEntry, validateCreateEntryData } from "./entry";

/**
 * Creates a new vault with default settings
 * @param data - Vault creation data
 * @returns New Vault instance
 */
export const createVault = (data: CreateVaultData): Vault => {
  const now = new Date();

  return {
    id: generateId(),
    name: data.name,
    description: data.description,
    entries: [],
    createdAt: now,
    updatedAt: now,
    version: VAULT_VERSION,
    settings: { ...DEFAULT_VAULT_SETTINGS, ...data.settings },
  };
};

/**
 * Adds a new entry to the vault (immutable operation)
 * @param vault - Vault to add entry to
 * @param entryData - Entry data to add
 * @returns Object with updated vault, new entry, and validation result
 */
export const addEntry = (
  vault: Vault,
  entryData: CreateVaultEntryData
): { vault: Vault; entry: VaultEntry; validation: ValidationResult } => {
  const validation = validateCreateEntryData(entryData);

  if (validation.errors.length > 0) {
    return {
      vault,
      entry: null as unknown as VaultEntry, // Type assertion because we're early returning
      validation,
    };
  }

  const newEntry = createEntry(entryData);

  return {
    vault: {
      ...vault,
      entries: [...vault.entries, newEntry],
      updatedAt: new Date(),
    },
    entry: newEntry,
    validation,
  };
};

/**
 * Updates an existing entry in the vault (immutable operation)
 * @param vault - Vault containing the entry
 * @param entryId - ID of the entry to update
 * @param updateData - Updates to apply to the entry
 * @returns Object with updated vault, updated entry, and validation result
 */
export const updateEntry = (
  vault: Vault,
  entryId: string,
  updateData: Partial<VaultEntry>
): { vault: Vault; entry: VaultEntry; validation: ValidationResult } => {
  const entryIndex = vault.entries.findIndex((e) => e.id === entryId);

  if (entryIndex === -1) {
    return {
      vault,
      entry: null as unknown as VaultEntry,
      validation: {
        isValid: false,
        errors: [
          {
            field: "id",
            message: "Entry not found",
            code: "ENTRY_NOT_FOUND",
          },
        ],
        warnings: [],
      },
    };
  }

  const originalEntry = vault.entries[entryIndex];

  // Créer une nouvelle date avec 1ms de plus que la date actuelle pour garantir qu'elle est différente
  const now = new Date();
  now.setMilliseconds(now.getMilliseconds() + 1);

  const updatedEntry = {
    ...originalEntry,
    ...updateData,
    id: originalEntry.id,
    createdAt: originalEntry.createdAt,
    updatedAt: now,
  };

  const validation = validateCreateEntryData(updatedEntry);

  if (validation.errors.length > 0) {
    return {
      vault,
      entry: null as unknown as VaultEntry,
      validation,
    };
  }

  const updatedEntries = [...vault.entries];
  updatedEntries[entryIndex] = updatedEntry;

  return {
    vault: {
      ...vault,
      entries: updatedEntries,
      updatedAt: now,
    },
    entry: updatedEntry,
    validation,
  };
};

/**
 * Deletes an entry from the vault (immutable operation)
 * @param vault - Vault containing the entry
 * @param entryId - ID of the entry to delete
 * @returns Updated Vault without the entry
 */
export const deleteEntry = (vault: Vault, entryId: string): Vault => {
  const entryIndex = vault.entries.findIndex((e) => e.id === entryId);

  if (entryIndex === -1) {
    return vault;
  }

  const updatedEntries = vault.entries.filter((e) => e.id !== entryId);

  return {
    ...vault,
    entries: updatedEntries,
    updatedAt: new Date(),
  };
};

/**
 * Gets an entry from the vault by ID
 * @param vault - Vault containing the entry
 * @param entryId - ID of the entry to get
 * @returns VaultEntry if found, null otherwise
 */
export const getEntry = (vault: Vault, entryId: string): VaultEntry | null => {
  return vault.entries.find((e) => e.id === entryId) || null;
};
