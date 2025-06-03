import { EntryCategory, FieldType } from "../src/types";
import {
  parseCreateVaultEntry,
  parseVaultEntry,
  safeParseVaultEntry,
  validateCreateCustomField,
  validateCreateVaultEntry,
  validatePasswordStrength,
  validateVaultEntry,
} from "../src/validation/validator";

describe("Zod Validation System", () => {
  describe("validateVaultEntry", () => {
    it("should validate a complete valid entry", () => {
      const validEntry = {
        id: "test-id",
        title: "Test Entry",
        username: "user@example.com",
        password: "StrongPass123!",
        url: "https://example.com",
        notes: "Test notes",
        tags: ["work", "important"],
        favorite: true,
        category: EntryCategory.LOGIN,
        customFields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateVaultEntry(validEntry);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should detect missing required fields", () => {
      const invalidEntry = {
        id: "",
        title: "",
        createdAt: "invalid-date",
        updatedAt: new Date(),
      };

      const result = validateVaultEntry(invalidEntry);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.field === "id")).toBe(true);
      expect(result.errors.some((e) => e.field === "title")).toBe(true);
      expect(result.errors.some((e) => e.field === "createdAt")).toBe(true);
    });

    it("should detect invalid URL format", () => {
      const entryWithInvalidUrl = {
        id: "test-id",
        title: "Test Entry",
        url: "not-a-valid-url",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateVaultEntry(entryWithInvalidUrl);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "url")).toBe(true);
    });

    it("should warn about weak passwords", () => {
      const entryWithWeakPassword = {
        id: "test-id",
        title: "Test Entry",
        password: "weak",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateVaultEntry(entryWithWeakPassword);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some((w) => w.code === "WEAK_PASSWORD_LENGTH")
      ).toBe(true);
      expect(
        result.warnings.some((w) => w.code === "WEAK_PASSWORD_UPPERCASE")
      ).toBe(true);
    });

    it("should warn about invalid email format in username", () => {
      const entryWithInvalidEmail = {
        id: "test-id",
        title: "Test Entry",
        username: "invalid-email@",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateVaultEntry(entryWithInvalidEmail);

      expect(
        result.warnings.some((w) => w.code === "INVALID_EMAIL_FORMAT")
      ).toBe(true);
    });

    it("should validate custom fields", () => {
      const entryWithInvalidCustomFields = {
        id: "test-id",
        title: "Test Entry",
        customFields: [
          {
            id: "",
            name: "",
            value: "test",
            type: FieldType.TEXT,
            hidden: false,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateVaultEntry(entryWithInvalidCustomFields);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("customFields"))).toBe(
        true
      );
    });

    it("should validate custom field types", () => {
      const entryWithInvalidEmailField = {
        id: "test-id",
        title: "Test Entry",
        customFields: [
          {
            id: "field-id",
            name: "Email Field",
            value: "invalid-email",
            type: FieldType.EMAIL,
            hidden: false,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateVaultEntry(entryWithInvalidEmailField);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(
          (e) => e.field.includes("customFields") && e.field.includes("value")
        )
      ).toBe(true);
    });
  });

  describe("validateCreateVaultEntry", () => {
    it("should validate valid creation data", () => {
      const validData = {
        title: "New Entry",
        username: "user@example.com",
        password: "StrongPass123!",
        url: "https://example.com",
      };

      const result = validateCreateVaultEntry(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should require title for creation", () => {
      const invalidData = {
        username: "user@example.com",
      };

      const result = validateCreateVaultEntry(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "title")).toBe(true);
    });

    it("should validate optional fields when provided", () => {
      const dataWithInvalidUrl = {
        title: "New Entry",
        url: "invalid-url",
      };

      const result = validateCreateVaultEntry(dataWithInvalidUrl);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "url")).toBe(true);
    });
  });

  describe("validateCreateCustomField", () => {
    it("should validate valid custom field data", () => {
      const validFieldData = {
        name: "API Key",
        value: "abc123",
        type: FieldType.TEXT,
        hidden: false,
      };

      const result = validateCreateCustomField(validFieldData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should require name for custom field", () => {
      const invalidFieldData = {
        value: "test",
        type: FieldType.TEXT,
      };

      const result = validateCreateCustomField(invalidFieldData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "name")).toBe(true);
    });

    it("should validate email type custom fields", () => {
      const invalidEmailField = {
        name: "Email Field",
        value: "invalid-email",
        type: FieldType.EMAIL,
      };

      const result = validateCreateCustomField(invalidEmailField);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "value")).toBe(true);
    });

    it("should validate URL type custom fields", () => {
      const invalidUrlField = {
        name: "URL Field",
        value: "invalid-url",
        type: FieldType.URL,
      };

      const result = validateCreateCustomField(invalidUrlField);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "value")).toBe(true);
    });

    it("should validate number type custom fields", () => {
      const invalidNumberField = {
        name: "Number Field",
        value: "not-a-number",
        type: FieldType.NUMBER,
      };

      const result = validateCreateCustomField(invalidNumberField);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "value")).toBe(true);
    });

    it("should accept valid number type custom fields", () => {
      const validNumberField = {
        name: "Number Field",
        value: "123.45",
        type: FieldType.NUMBER,
      };

      const result = validateCreateCustomField(validNumberField);

      expect(result.isValid).toBe(true);
    });
  });

  describe("validatePasswordStrength", () => {
    it("should return no warnings for strong password", () => {
      const strongPassword = "StrongPass123!";
      const warnings = validatePasswordStrength(strongPassword);

      expect(warnings).toHaveLength(0);
    });

    it("should warn about short password", () => {
      const shortPassword = "Abc1!";
      const warnings = validatePasswordStrength(shortPassword);

      expect(warnings.some((w) => w.code === "WEAK_PASSWORD_LENGTH")).toBe(
        true
      );
    });

    it("should warn about missing character types", () => {
      const weakPassword = "password";
      const warnings = validatePasswordStrength(weakPassword);

      expect(warnings.some((w) => w.code === "WEAK_PASSWORD_UPPERCASE")).toBe(
        true
      );
      expect(warnings.some((w) => w.code === "WEAK_PASSWORD_NUMBER")).toBe(
        true
      );
      expect(warnings.some((w) => w.code === "WEAK_PASSWORD_SPECIAL")).toBe(
        true
      );
    });
  });

  describe("Parsing functions", () => {
    it("should parse valid vault entry", () => {
      const validEntry = {
        id: "test-id",
        title: "Test Entry",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => parseVaultEntry(validEntry)).not.toThrow();
    });

    it("should throw on invalid vault entry", () => {
      const invalidEntry = {
        id: "",
        title: "",
      };

      expect(() => parseVaultEntry(invalidEntry)).toThrow();
    });

    it("should parse valid creation data", () => {
      const validData = {
        title: "New Entry",
      };

      expect(() => parseCreateVaultEntry(validData)).not.toThrow();
    });

    it("should safely parse and return success/error", () => {
      const validEntry = {
        id: "test-id",
        title: "Test Entry",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = safeParseVaultEntry(validEntry);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("test-id");
      }
    });

    it("should safely parse and return error for invalid data", () => {
      const invalidEntry = {
        id: "",
        title: "",
      };

      const result = safeParseVaultEntry(invalidEntry);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Entry categories and field types", () => {
    it("should validate all entry categories", () => {
      const categories = Object.values(EntryCategory);

      categories.forEach((category) => {
        const entry = {
          id: "test-id",
          title: "Test Entry",
          category,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = validateVaultEntry(entry);
        expect(result.isValid).toBe(true);
      });
    });

    it("should validate all field types", () => {
      const fieldTypes = Object.values(FieldType);

      fieldTypes.forEach((type) => {
        const fieldData = {
          name: `${type} Field`,
          value: "test-value",
          type,
        };

        // For specific types, use valid values
        if (type === FieldType.EMAIL) {
          fieldData.value = "test@example.com";
        } else if (type === FieldType.URL) {
          fieldData.value = "https://example.com";
        } else if (type === FieldType.NUMBER) {
          fieldData.value = "123";
        }

        const result = validateCreateCustomField(fieldData);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle empty strings and undefined values", () => {
      const entryWithOptionalFields = {
        id: "test-id",
        title: "Test Entry",
        username: undefined,
        password: undefined,
        url: undefined,
        notes: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateVaultEntry(entryWithOptionalFields);
      expect(result.isValid).toBe(true);
    });

    it("should trim whitespace in field names", () => {
      const fieldData = {
        name: "  Trimmed Name  ",
        value: "test",
        type: FieldType.TEXT,
      };

      const result = validateCreateCustomField(fieldData);
      expect(result.isValid).toBe(true);
    });

    it("should handle empty arrays", () => {
      const entryWithEmptyArrays = {
        id: "test-id",
        title: "Test Entry",
        tags: [],
        customFields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateVaultEntry(entryWithEmptyArrays);
      expect(result.isValid).toBe(true);
    });
  });
});
