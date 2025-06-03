import {
  CreateVaultEntryData,
  EntryCategory,
  ValidationResult,
  VaultEntry,
} from "../../types";
import { generateId } from "../../utils/id-generator";
import {
  validateCreateVaultEntry,
  validateUpdateVaultEntry,
  validateVaultEntry,
} from "../../validation/validator";

/**
 * Creates a new vault entry with generated ID and timestamps
 * @param data - Entry data without ID and timestamps
 * @returns Complete VaultEntry with ID and timestamps
 */
export const createEntry = (data: CreateVaultEntryData): VaultEntry => {
  const now = new Date();

  return {
    id: generateId(),
    title: data.title,
    username: data.username,
    password: data.password,
    url: data.url,
    notes: data.notes,
    tags: data.tags || [],
    favorite: data.favorite || false,
    category: data.category || EntryCategory.LOGIN,
    customFields: data.customFields || [],
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Updates an existing vault entry
 * @param entry - Original entry
 * @param updates - Partial updates to apply
 * @returns Updated VaultEntry with new updatedAt timestamp
 */
export const updateEntryData = (
  entry: VaultEntry,
  updates: Partial<VaultEntry>
): VaultEntry => {
  const now = new Date();
  now.setMilliseconds(now.getMilliseconds() + 1);

  return {
    ...entry,
    ...updates,
    id: entry.id,
    createdAt: entry.createdAt,
    updatedAt: now,
  };
};

/**
 * Validates a vault entry for correctness and completeness
 * @param entry - Entry to validate
 * @returns ValidationResult with errors and warnings
 */
export const validateEntry = (entry: VaultEntry): ValidationResult => {
  return validateVaultEntry(entry);
};

/**
 * Validates data for creating a new vault entry
 * @param data - Entry creation data to validate
 * @returns ValidationResult with errors and warnings
 */
export const validateCreateEntryData = (
  data: CreateVaultEntryData
): ValidationResult => {
  return validateCreateVaultEntry(data);
};

/**
 * Validates data for updating a vault entry
 * @param data - Entry update data to validate
 * @returns ValidationResult with errors and warnings
 */
export const validateUpdateEntryData = (
  data: Partial<VaultEntry>
): ValidationResult => {
  return validateUpdateVaultEntry(data);
};
