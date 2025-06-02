import {
  CreateVaultData,
  CreateVaultEntryData,
  CustomField,
  DEFAULT_VAULT_SETTINGS,
  EntryCategory,
  FieldType,
  UpdateVaultEntryData,
  ValidationResult,
  Vault,
  VAULT_VERSION,
  VaultEntry,
  VaultSearchOptions,
  VaultSearchResult,
  VaultStats,
} from "../types/vault";
import { generateId } from "../utils/id-generator";
import {
  validateCreateCustomField,
  validateCreateVaultEntry,
  validateUpdateVaultEntry,
  validateVaultEntry,
} from "../validation/validator";

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
  updates: UpdateVaultEntryData
): VaultEntry => {
  return {
    ...entry,
    ...updates,
    id: entry.id,
    createdAt: entry.createdAt,
    updatedAt: new Date(),
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
 * Creates a new custom field
 * @param name - Field name
 * @param value - Field value
 * @param type - Field type
 * @param hidden - Whether field should be hidden
 * @returns CustomField object
 */
export const createCustomField = (
  name: string,
  value: string,
  type: FieldType = FieldType.TEXT,
  hidden: boolean = false
): CustomField => {
  return {
    id: generateId(),
    name: name.trim(),
    value,
    type,
    hidden,
  };
};

/**
 * Updates a custom field in an entry
 * @param entry - Entry containing the custom field
 * @param fieldId - ID of the custom field to update
 * @param updates - Updates to apply to the custom field
 * @returns Updated VaultEntry
 */
export const updateCustomField = (
  entry: VaultEntry,
  fieldId: string,
  updates: Partial<Omit<CustomField, "id">>
): VaultEntry => {
  const customFields =
    entry.customFields?.map((field) =>
      field.id === fieldId ? { ...field, ...updates } : field
    ) || [];

  return updateEntryData(entry, { customFields });
};

/**
 * Adds a custom field to an entry
 * @param entry - Entry to add field to
 * @param field - Custom field to add
 * @returns Updated VaultEntry
 */
export const addCustomField = (
  entry: VaultEntry,
  field: CustomField
): VaultEntry => {
  const customFields = [...(entry.customFields || []), field];
  return updateEntryData(entry, { customFields });
};

/**
 * Removes a custom field from an entry
 * @param entry - Entry to remove field from
 * @param fieldId - ID of the custom field to remove
 * @returns Updated VaultEntry
 */
export const removeCustomField = (
  entry: VaultEntry,
  fieldId: string
): VaultEntry => {
  const customFields =
    entry.customFields?.filter((field) => field.id !== fieldId) || [];
  return updateEntryData(entry, { customFields });
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
 * Validates data for creating a custom field
 * @param data - Custom field data to validate
 * @returns ValidationResult with errors and warnings
 */
export const validateCustomFieldData = (
  data: Partial<CustomField>
): ValidationResult => {
  return validateCreateCustomField(data);
};

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
  // Validate entry data
  const validation = validateCreateVaultEntry(entryData);
  if (!validation.isValid) {
    throw new Error(
      `Invalid entry data: ${validation.errors
        .map((e) => e.message)
        .join(", ")}`
    );
  }

  const now = new Date();
  const newEntry: VaultEntry = {
    id: generateId(),
    title: entryData.title,
    username: entryData.username,
    password: entryData.password,
    url: entryData.url,
    notes: entryData.notes,
    tags: entryData.tags || [],
    favorite: entryData.favorite || false,
    category: entryData.category || EntryCategory.LOGIN,
    customFields: entryData.customFields || [],
    createdAt: now,
    updatedAt: now,
  };

  const updatedVault: Vault = {
    ...vault,
    entries: [...vault.entries, newEntry],
    updatedAt: now,
  };

  return {
    vault: updatedVault,
    entry: newEntry,
    validation,
  };
};

/**
 * Updates an existing entry in the vault (immutable operation)
 * @param vault - Vault containing the entry
 * @param entryId - ID of entry to update
 * @param updateData - Data to update
 * @returns Object with updated vault, updated entry, and validation result
 */
export const updateEntry = (
  vault: Vault,
  entryId: string,
  updateData: UpdateVaultEntryData
): { vault: Vault; entry: VaultEntry; validation: ValidationResult } => {
  const entryIndex = vault.entries.findIndex((entry) => entry.id === entryId);
  if (entryIndex === -1) {
    throw new Error(`Entry with ID ${entryId} not found`);
  }

  // Validate update data
  const validation = validateUpdateVaultEntry(updateData);
  if (!validation.isValid) {
    throw new Error(
      `Invalid update data: ${validation.errors
        .map((e) => e.message)
        .join(", ")}`
    );
  }

  const existingEntry = vault.entries[entryIndex];
  const now = new Date();

  const updatedEntry: VaultEntry = {
    ...existingEntry,
    ...updateData,
    id: existingEntry.id, // Preserve ID
    createdAt: existingEntry.createdAt, // Preserve creation date
    updatedAt: now,
  };

  const updatedEntries = [...vault.entries];
  updatedEntries[entryIndex] = updatedEntry;

  const updatedVault: Vault = {
    ...vault,
    entries: updatedEntries,
    updatedAt: now,
  };

  return {
    vault: updatedVault,
    entry: updatedEntry,
    validation,
  };
};

/**
 * Deletes an entry from the vault (immutable operation)
 * @param vault - Vault to delete entry from
 * @param entryId - ID of entry to delete
 * @returns Updated vault without the deleted entry
 */
export const deleteEntry = (vault: Vault, entryId: string): Vault => {
  const entryExists = vault.entries.some((entry) => entry.id === entryId);
  if (!entryExists) {
    throw new Error(`Entry with ID ${entryId} not found`);
  }

  return {
    ...vault,
    entries: vault.entries.filter((entry) => entry.id !== entryId),
    updatedAt: new Date(),
  };
};

/**
 * Gets a specific entry by ID
 * @param vault - Vault to search in
 * @param entryId - ID of entry to find
 * @returns VaultEntry if found, null otherwise
 */
export const getEntry = (vault: Vault, entryId: string): VaultEntry | null => {
  return vault.entries.find((entry) => entry.id === entryId) || null;
};

/**
 * Advanced search with filters and performance optimization
 * @param vault - Vault to search in
 * @param options - Search options and filters
 * @returns Search results with performance metrics
 */
export const searchEntries = (
  vault: Vault,
  options: VaultSearchOptions
): VaultSearchResult => {
  const startTime = performance.now();

  let filteredEntries = vault.entries;

  // Filter by categories
  if (options.categories && options.categories.length > 0) {
    filteredEntries = filteredEntries.filter(
      (entry) => entry.category && options.categories!.includes(entry.category)
    );
  }

  // Filter by favorites
  if (options.favorites !== undefined) {
    filteredEntries = filteredEntries.filter(
      (entry) => Boolean(entry.favorite) === options.favorites
    );
  }

  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    filteredEntries = filteredEntries.filter(
      (entry) =>
        entry.tags && options.tags!.some((tag) => entry.tags!.includes(tag))
    );
  }

  // Text search across multiple fields
  if (options.query && options.query.trim()) {
    const query = options.caseSensitive
      ? options.query.trim()
      : options.query.trim().toLowerCase();

    filteredEntries = filteredEntries.filter((entry) => {
      const searchFields = [
        entry.title,
        entry.username,
        entry.url,
        entry.notes,
        ...(entry.tags || []),
        ...(entry.customFields?.map(
          (field) => `${field.name} ${field.value}`
        ) || []),
      ].filter(Boolean);

      return searchFields.some((field) => {
        const fieldValue = options.caseSensitive ? field : field!.toLowerCase();
        return fieldValue && fieldValue.includes(query);
      });
    });
  }

  const endTime = performance.now();
  const searchTime = endTime - startTime;

  return {
    entries: filteredEntries,
    totalCount: filteredEntries.length,
    searchTime,
  };
};

/**
 * Calculates comprehensive vault statistics
 * @param vault - Vault to analyze
 * @returns Detailed statistics about the vault
 */
export const getVaultStats = (vault: Vault): VaultStats => {
  const entries = vault.entries;

  // Category counts
  const categoryCounts = Object.values(EntryCategory).reduce(
    (acc, category) => {
      acc[category] = entries.filter(
        (entry) => entry.category === category
      ).length;
      return acc;
    },
    {} as Record<EntryCategory, number>
  );

  // Tag counts
  const tagCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    entry.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Password analysis
  const passwords = entries
    .map((entry) => entry.password)
    .filter(Boolean) as string[];

  const weakPasswords = passwords.filter(
    (password) =>
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
  ).length;

  const duplicatePasswords = passwords.length - new Set(passwords).size;

  // Old passwords (entries not updated in 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const oldPasswords = entries.filter(
    (entry) => entry.password && entry.updatedAt < ninetyDaysAgo
  ).length;

  // Last activity
  const lastActivity =
    entries.length > 0
      ? new Date(Math.max(...entries.map((entry) => entry.updatedAt.getTime())))
      : vault.createdAt;

  return {
    totalEntries: entries.length,
    categoryCounts,
    tagCounts,
    lastActivity,
    weakPasswords,
    duplicatePasswords,
    oldPasswords,
  };
};

/**
 * Gets entries by category (performance optimized)
 * @param vault - Vault to search in
 * @param category - Category to filter by
 * @returns Array of entries in the specified category
 */
export const getEntriesByCategory = (
  vault: Vault,
  category: EntryCategory
): VaultEntry[] => {
  return vault.entries.filter((entry) => entry.category === category);
};

/**
 * Gets favorite entries
 * @param vault - Vault to search in
 * @returns Array of favorite entries
 */
export const getFavoriteEntries = (vault: Vault): VaultEntry[] => {
  return vault.entries.filter((entry) => entry.favorite === true);
};

/**
 * Gets entries with weak passwords
 * @param vault - Vault to analyze
 * @returns Array of entries with weak passwords
 */
export const getWeakPasswordEntries = (vault: Vault): VaultEntry[] => {
  return vault.entries.filter((entry) => {
    if (!entry.password) return false;

    const password = entry.password;
    return (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    );
  });
};

/**
 * Gets entries with duplicate passwords
 * @param vault - Vault to analyze
 * @returns Array of arrays, each containing entries with the same password
 */
export const getDuplicatePasswordEntries = (vault: Vault): VaultEntry[][] => {
  const passwordGroups = new Map<string, VaultEntry[]>();

  vault.entries.forEach((entry) => {
    if (entry.password) {
      if (!passwordGroups.has(entry.password)) {
        passwordGroups.set(entry.password, []);
      }
      passwordGroups.get(entry.password)!.push(entry);
    }
  });

  return Array.from(passwordGroups.values()).filter(
    (group) => group.length > 1
  );
};

/**
 * Gets recently modified entries (within specified days)
 * @param vault - Vault to search in
 * @param days - Number of days to look back (default: 7)
 * @returns Array of recently modified entries, sorted by update time
 */
export const getRecentlyModifiedEntries = (
  vault: Vault,
  days: number = 7
): VaultEntry[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return vault.entries
    .filter((entry) => entry.updatedAt > cutoffDate)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

/**
 * Bulk operations for performance - Add multiple entries at once
 * @param vault - Vault to add entries to
 * @param entriesData - Array of entry data to add
 * @returns Object with updated vault, new entries, and validation results
 */
export const bulkAddEntries = (
  vault: Vault,
  entriesData: CreateVaultEntryData[]
): {
  vault: Vault;
  entries: VaultEntry[];
  validationResults: ValidationResult[];
} => {
  const now = new Date();
  const newEntries: VaultEntry[] = [];
  const validationResults: ValidationResult[] = [];

  // Validate all entries first
  for (const entryData of entriesData) {
    const validation = validateCreateVaultEntry(entryData);
    validationResults.push(validation);

    if (!validation.isValid) {
      throw new Error(
        `Invalid entry data: ${validation.errors
          .map((e) => e.message)
          .join(", ")}`
      );
    }

    const newEntry: VaultEntry = {
      id: generateId(),
      title: entryData.title,
      username: entryData.username,
      password: entryData.password,
      url: entryData.url,
      notes: entryData.notes,
      tags: entryData.tags || [],
      favorite: entryData.favorite || false,
      category: entryData.category || EntryCategory.LOGIN,
      customFields: entryData.customFields || [],
      createdAt: now,
      updatedAt: now,
    };

    newEntries.push(newEntry);
  }

  const updatedVault: Vault = {
    ...vault,
    entries: [...vault.entries, ...newEntries],
    updatedAt: now,
  };

  return {
    vault: updatedVault,
    entries: newEntries,
    validationResults,
  };
};

/**
 * Bulk delete entries
 * @param vault - Vault to delete entries from
 * @param entryIds - Array of entry IDs to delete
 * @returns Updated vault without the deleted entries
 */
export const bulkDeleteEntries = (vault: Vault, entryIds: string[]): Vault => {
  const idsSet = new Set(entryIds);
  const remainingEntries = vault.entries.filter(
    (entry) => !idsSet.has(entry.id)
  );

  if (remainingEntries.length === vault.entries.length) {
    throw new Error("No entries found with the provided IDs");
  }

  return {
    ...vault,
    entries: remainingEntries,
    updatedAt: new Date(),
  };
};
