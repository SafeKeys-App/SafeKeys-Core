import { z } from "zod";
import {
  createCustomFieldSchema,
  createVaultEntrySchema,
  passwordStrengthSchema,
  updateVaultEntrySchema,
  vaultEntrySchema,
} from "../schemas/entrySchemas";
import { ValidationError, ValidationResult, ValidationWarning } from "../types";

/**
 * Converts Zod validation errors to our ValidationError format
 */
const zodErrorToValidationErrors = (error: z.ZodError): ValidationError[] => {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code.toUpperCase(),
  }));
};

/**
 * Extracts password strength warnings from Zod validation
 */
const extractPasswordWarnings = (data: any): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];

  if (!data.password) return warnings;

  const passwordResult = passwordStrengthSchema.safeParse({
    password: data.password,
  });

  if (!passwordResult.success) {
    passwordResult.error.errors.forEach((err) => {
      if (err.path.includes("length")) {
        warnings.push({
          field: "password",
          message: err.message,
          code: "WEAK_PASSWORD_LENGTH",
        });
      } else if (err.path.includes("uppercase")) {
        warnings.push({
          field: "password",
          message: err.message,
          code: "WEAK_PASSWORD_UPPERCASE",
        });
      } else if (err.path.includes("lowercase")) {
        warnings.push({
          field: "password",
          message: err.message,
          code: "WEAK_PASSWORD_LOWERCASE",
        });
      } else if (err.path.includes("number")) {
        warnings.push({
          field: "password",
          message: err.message,
          code: "WEAK_PASSWORD_NUMBER",
        });
      } else if (err.path.includes("special")) {
        warnings.push({
          field: "password",
          message: err.message,
          code: "WEAK_PASSWORD_SPECIAL",
        });
      }
    });
  }

  return warnings;
};

/**
 * Extracts username email format warnings
 */
const extractUsernameWarnings = (data: any): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];

  if (data.username && data.username.includes("@")) {
    // Try to validate as email
    const emailSchema = z.string().email();
    const emailResult = emailSchema.safeParse(data.username);

    if (!emailResult.success) {
      warnings.push({
        field: "username",
        message: "Username appears to be an email but format is invalid",
        code: "INVALID_EMAIL_FORMAT",
      });
    }
  }

  return warnings;
};

/**
 * Validates a vault entry and returns validation result with errors and warnings
 */
export const validateVaultEntry = (entry: any): ValidationResult => {
  const result = vaultEntrySchema.safeParse(entry);
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!result.success) {
    errors.push(...zodErrorToValidationErrors(result.error));
  }

  // Extract warnings (these don't make the entry invalid)
  warnings.push(...extractPasswordWarnings(entry));
  warnings.push(...extractUsernameWarnings(entry));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validates data for creating a new vault entry
 */
export const validateCreateVaultEntry = (data: any): ValidationResult => {
  const result = createVaultEntrySchema.safeParse(data);
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!result.success) {
    errors.push(...zodErrorToValidationErrors(result.error));
  }

  // Extract warnings
  warnings.push(...extractPasswordWarnings(data));
  warnings.push(...extractUsernameWarnings(data));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validates data for updating a vault entry
 */
export const validateUpdateVaultEntry = (data: any): ValidationResult => {
  const result = updateVaultEntrySchema.safeParse(data);
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!result.success) {
    errors.push(...zodErrorToValidationErrors(result.error));
  }

  // Extract warnings
  warnings.push(...extractPasswordWarnings(data));
  warnings.push(...extractUsernameWarnings(data));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validates data for creating a custom field
 */
export const validateCreateCustomField = (data: any): ValidationResult => {
  const result = createCustomFieldSchema.safeParse(data);
  const errors: ValidationError[] = [];

  if (!result.success) {
    errors.push(...zodErrorToValidationErrors(result.error));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
};

/**
 * Validates password strength and returns only warnings
 */
export const validatePasswordStrength = (
  password: string
): ValidationWarning[] => {
  return extractPasswordWarnings({ password });
};

/**
 * Type-safe parsing functions that throw on validation failure
 */
export const parseVaultEntry = (data: unknown) => vaultEntrySchema.parse(data);
export const parseCreateVaultEntry = (data: unknown) =>
  createVaultEntrySchema.parse(data);
export const parseUpdateVaultEntry = (data: unknown) =>
  updateVaultEntrySchema.parse(data);
export const parseCreateCustomField = (data: unknown) =>
  createCustomFieldSchema.parse(data);

/**
 * Safe parsing functions that return success/error results
 */
export const safeParseVaultEntry = (data: unknown) =>
  vaultEntrySchema.safeParse(data);
export const safeParseCreateVaultEntry = (data: unknown) =>
  createVaultEntrySchema.safeParse(data);
export const safeParseUpdateVaultEntry = (data: unknown) =>
  updateVaultEntrySchema.safeParse(data);
export const safeParseCreateCustomField = (data: unknown) =>
  createCustomFieldSchema.safeParse(data);
