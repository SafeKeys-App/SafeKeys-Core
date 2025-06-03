import { z } from "zod";
import { EntryCategory, FieldType } from "../types";

const urlSchema = z.string().url("Invalid URL format").optional();
const emailSchema = z.string().email("Invalid email format");

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .refine((password) => password.length >= 8, {
    message: "Password should be at least 8 characters long",
    path: ["length"],
  })
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password should contain at least one uppercase letter",
    path: ["uppercase"],
  })
  .refine((password) => /[a-z]/.test(password), {
    message: "Password should contain at least one lowercase letter",
    path: ["lowercase"],
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "Password should contain at least one number",
    path: ["number"],
  })
  .refine((password) => /[^A-Za-z0-9]/.test(password), {
    message: "Password should contain at least one special character",
    path: ["special"],
  });

const customFieldSchema = z
  .object({
    id: z.string().min(1, "Custom field ID is required"),
    name: z.string().min(1, "Custom field name is required").trim(),
    value: z.string(),
    type: z.nativeEnum(FieldType, {
      errorMap: () => ({ message: "Invalid custom field type" }),
    }),
    hidden: z.boolean().default(false),
  })
  .refine(
    (field) => {
      // Type-specific validations
      if (field.type === FieldType.EMAIL && field.value) {
        return emailSchema.safeParse(field.value).success;
      }
      if (field.type === FieldType.URL && field.value) {
        return urlSchema.safeParse(field.value).success;
      }
      if (field.type === FieldType.NUMBER && field.value) {
        return !isNaN(Number(field.value));
      }
      return true;
    },
    {
      message: "Invalid value for the specified field type",
      path: ["value"],
    }
  );

// Username validation with email detection
const usernameSchema = z
  .string()
  .optional()
  .refine(
    (username) => {
      if (!username) return true;
      // If it contains @ but is not a valid email, it's a warning
      if (username.includes("@")) {
        return emailSchema.safeParse(username).success;
      }
      return true;
    },
    {
      message: "Username appears to be an email but format is invalid",
    }
  );

// Main vault entry schema
export const vaultEntrySchema = z.object({
  id: z.string().min(1, "Entry ID is required"),
  title: z.string().min(1, "Entry title is required").trim(),
  username: usernameSchema,
  password: z.string().optional(),
  url: urlSchema,
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  favorite: z.boolean().default(false),
  category: z
    .nativeEnum(EntryCategory, {
      errorMap: () => ({ message: "Invalid entry category" }),
    })
    .default(EntryCategory.LOGIN),
  customFields: z.array(customFieldSchema).default([]),
  createdAt: z.date({
    required_error: "Creation date is required",
    invalid_type_error: "Valid creation date is required",
  }),
  updatedAt: z.date({
    required_error: "Update date is required",
    invalid_type_error: "Valid update date is required",
  }),
});

// Schema for creating new entries (without ID and timestamps)
export const createVaultEntrySchema = z.object({
  title: z.string().min(1, "Entry title is required").trim(),
  username: usernameSchema,
  password: z.string().optional(),
  url: urlSchema,
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
  category: z.nativeEnum(EntryCategory).optional(),
  customFields: z.array(customFieldSchema).optional(),
});

// Schema for updating entries (all fields optional except constraints)
export const updateVaultEntrySchema = z.object({
  title: z.string().min(1, "Entry title is required").trim().optional(),
  username: usernameSchema,
  password: z.string().optional(),
  url: urlSchema,
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
  category: z.nativeEnum(EntryCategory).optional(),
  customFields: z.array(customFieldSchema).optional(),
});

// Schema for custom field creation
export const createCustomFieldSchema = z
  .object({
    name: z.string().min(1, "Custom field name is required").trim(),
    value: z.string(),
    type: z.nativeEnum(FieldType).default(FieldType.TEXT),
    hidden: z.boolean().default(false),
  })
  .refine(
    (field) => {
      // Type-specific validations
      if (field.type === FieldType.EMAIL && field.value) {
        return emailSchema.safeParse(field.value).success;
      }
      if (field.type === FieldType.URL && field.value) {
        return urlSchema.safeParse(field.value).success;
      }
      if (field.type === FieldType.NUMBER && field.value) {
        return !isNaN(Number(field.value));
      }
      return true;
    },
    {
      message: "Invalid value for the specified field type",
      path: ["value"],
    }
  );

// Password strength validation schema (separate for warnings)
export const passwordStrengthSchema = z.object({
  password: passwordSchema,
});

// Export schema utility functions
export const urlSchemaFn = () => urlSchema;
export const emailSchemaFn = () => emailSchema;
export const passwordSchemaFn = () => passwordSchema;
export const customFieldSchemaFn = () => customFieldSchema;
export const usernameSchemaFn = () => usernameSchema;

// Export types inferred from schemas
export type VaultEntryInput = z.infer<typeof vaultEntrySchema>;
export type CreateVaultEntryInput = z.infer<typeof createVaultEntrySchema>;
export type UpdateVaultEntryInput = z.infer<typeof updateVaultEntrySchema>;
export type CustomFieldInput = z.infer<typeof customFieldSchema>;
export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;
