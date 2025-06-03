import {
  CustomField,
  FieldType,
  ValidationResult,
  VaultEntry,
} from "../../types";
import { generateId } from "../../utils/id-generator";
import { validateCreateCustomField } from "../../validation/validator";
import { updateEntryData } from "./entry";

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
 * Validates data for creating a custom field
 * @param data - Custom field data to validate
 * @returns ValidationResult with errors and warnings
 */
export const validateCustomFieldData = (
  data: Partial<CustomField>
): ValidationResult => {
  return validateCreateCustomField(data);
};
