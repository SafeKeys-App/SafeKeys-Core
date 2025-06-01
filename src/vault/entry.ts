import {
  CreateVaultEntryData,
  CustomField,
  EntryCategory,
  FieldType,
  UpdateVaultEntryData,
  ValidationResult,
  VaultEntry,
} from "../types/vault";
import { generateId } from "../utils/id-generator";
import {
  validateCreateCustomField,
  validateCreateVaultEntry,
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
export const updateEntry = (
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

  return updateEntry(entry, { customFields });
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
  return updateEntry(entry, { customFields });
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
  return updateEntry(entry, { customFields });
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
