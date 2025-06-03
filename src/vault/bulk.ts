import {
  CreateVaultEntryData,
  ValidationResult,
  Vault,
  VaultEntry,
} from "../types";
import { createEntry, validateCreateEntryData } from "./entry";

/**
 * Adds multiple entries to a vault in a single operation
 * @param vault - Vault to add entries to
 * @param entriesData - Array of entry data to add
 * @returns Object with updated vault, created entries, and validation results
 */
export const bulkAddEntries = (
  vault: Vault,
  entriesData: CreateVaultEntryData[]
): {
  vault: Vault;
  entries: VaultEntry[];
  validationResults: ValidationResult[];
} => {
  // Validate all entries first
  const validationResults = entriesData.map((data) =>
    validateCreateEntryData(data)
  );

  // Check if all entries are valid
  const allValid = validationResults.every(
    (result) => result.errors.length === 0
  );

  // If any entry is invalid, return early with validation results
  if (!allValid) {
    return {
      vault,
      entries: [],
      validationResults,
    };
  }

  // Create entries
  const newEntries = entriesData.map((data) => createEntry(data));

  // Add entries to vault
  const updatedVault = {
    ...vault,
    entries: [...vault.entries, ...newEntries],
    updatedAt: new Date(),
  };

  return {
    vault: updatedVault,
    entries: newEntries,
    validationResults,
  };
};

/**
 * Deletes multiple entries from a vault in a single operation
 * @param vault - Vault to delete entries from
 * @param entryIds - Array of entry IDs to delete
 * @returns Updated vault without the specified entries
 */
export const bulkDeleteEntries = (vault: Vault, entryIds: string[]): Vault => {
  // Create a set for faster lookups
  const idsToDelete = new Set(entryIds);

  // Filter out entries to delete
  const remainingEntries = vault.entries.filter(
    (entry) => !idsToDelete.has(entry.id)
  );

  // If no entries were deleted, return the original vault
  if (remainingEntries.length === vault.entries.length) {
    return vault;
  }

  // Return updated vault
  return {
    ...vault,
    entries: remainingEntries,
    updatedAt: new Date(),
  };
};
