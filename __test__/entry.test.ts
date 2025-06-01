import { EntryCategory, FieldType } from "../src/types/vault";
import {
  addCustomField,
  createCustomField,
  createEntry,
  removeCustomField,
  updateCustomField,
  updateEntry,
  validateEntry,
} from "../src/vault/entry";

describe("Vault Entry Management", () => {
  describe("createEntry", () => {
    it("should create a valid entry with required fields", () => {
      const entryData = {
        title: "Test Entry",
        username: "testuser",
        password: "testpass123",
      };

      const entry = createEntry(entryData);

      expect(entry.id).toBeDefined();
      expect(entry.title).toBe("Test Entry");
      expect(entry.username).toBe("testuser");
      expect(entry.password).toBe("testpass123");
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.updatedAt).toBeInstanceOf(Date);
      expect(entry.tags).toEqual([]);
      expect(entry.favorite).toBe(false);
      expect(entry.category).toBe(EntryCategory.LOGIN);
      expect(entry.customFields).toEqual([]);
    });

    it("should create entry with all optional fields", () => {
      const entryData = {
        title: "Complete Entry",
        username: "user@example.com",
        password: "SecurePass123!",
        url: "https://example.com",
        notes: "Important notes",
        tags: ["work", "important"],
        favorite: true,
        category: EntryCategory.CREDIT_CARD,
        customFields: [],
      };

      const entry = createEntry(entryData);

      expect(entry.title).toBe("Complete Entry");
      expect(entry.url).toBe("https://example.com");
      expect(entry.notes).toBe("Important notes");
      expect(entry.tags).toEqual(["work", "important"]);
      expect(entry.favorite).toBe(true);
      expect(entry.category).toBe(EntryCategory.CREDIT_CARD);
    });

    it("should generate unique IDs for different entries", () => {
      const entry1 = createEntry({ title: "Entry 1" });
      const entry2 = createEntry({ title: "Entry 2" });

      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe("updateEntry", () => {
    let originalEntry: any;

    beforeEach(() => {
      originalEntry = createEntry({
        title: "Original Title",
        username: "original@example.com",
        password: "originalpass",
      });
    });

    it("should update specified fields", () => {
      const updates = {
        title: "Updated Title",
        password: "newpassword123",
      };

      const updatedEntry = updateEntry(originalEntry, updates);

      expect(updatedEntry.title).toBe("Updated Title");
      expect(updatedEntry.password).toBe("newpassword123");
      expect(updatedEntry.username).toBe("original@example.com");
      expect(updatedEntry.id).toBe(originalEntry.id);
      expect(updatedEntry.createdAt).toBe(originalEntry.createdAt);
      expect(updatedEntry.updatedAt).not.toBe(originalEntry.updatedAt);
    });

    it("should not allow ID modification", () => {
      const updates = {
        id: "new-id",
        title: "Updated Title",
      };

      const updatedEntry = updateEntry(originalEntry, updates);

      expect(updatedEntry.id).toBe(originalEntry.id);
      expect(updatedEntry.title).toBe("Updated Title");
    });

    it("should not allow createdAt modification", () => {
      const newDate = new Date("2020-01-01");
      const updates = {
        createdAt: newDate,
        title: "Updated Title",
      };

      const updatedEntry = updateEntry(originalEntry, updates);

      expect(updatedEntry.createdAt).toBe(originalEntry.createdAt);
      expect(updatedEntry.title).toBe("Updated Title");
    });
  });

  describe("validateEntry", () => {
    it("should validate a correct entry", () => {
      const entry = createEntry({
        title: "Valid Entry",
        username: "user@example.com",
        password: "StrongPass123!",
        url: "https://example.com",
      });

      const result = validateEntry(entry);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing required fields", () => {
      const invalidEntry = {
        id: "",
        title: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const result = validateEntry(invalidEntry);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "id",
        message: "Entry ID is required",
        code: "TOO_SMALL",
      });
      expect(result.errors).toContainEqual({
        field: "title",
        message: "Entry title is required",
        code: "TOO_SMALL",
      });
    });

    it("should detect invalid URL format", () => {
      const entry = createEntry({
        title: "Test Entry",
        url: "not-a-valid-url",
      });

      const result = validateEntry(entry);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "url",
        message: "Invalid URL format",
        code: "INVALID_STRING",
      });
    });

    it("should warn about weak passwords", () => {
      const entry = createEntry({
        title: "Test Entry",
        password: "weak",
      });

      const result = validateEntry(entry);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some((w) => w.code === "WEAK_PASSWORD_LENGTH")
      ).toBe(true);
    });

    it("should warn about invalid email format in username", () => {
      const entry = createEntry({
        title: "Test Entry",
        username: "invalid-email@",
      });

      const result = validateEntry(entry);

      expect(result.warnings).toContainEqual({
        field: "username",
        message: "Username appears to be an email but format is invalid",
        code: "INVALID_EMAIL_FORMAT",
      });
    });

    it("should validate custom fields", () => {
      const entry = createEntry({
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
      });

      const result = validateEntry(entry);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(
          (e) =>
            e.code === "TOO_SMALL" &&
            e.field.includes("customFields") &&
            e.field.includes("id")
        )
      ).toBe(true);
      expect(
        result.errors.some(
          (e) =>
            e.code === "TOO_SMALL" &&
            e.field.includes("customFields") &&
            e.field.includes("name")
        )
      ).toBe(true);
    });
  });

  describe("Custom Fields", () => {
    describe("createCustomField", () => {
      it("should create a custom field with default values", () => {
        const field = createCustomField("API Key", "abc123");

        expect(field.id).toBeDefined();
        expect(field.name).toBe("API Key");
        expect(field.value).toBe("abc123");
        expect(field.type).toBe(FieldType.TEXT);
        expect(field.hidden).toBe(false);
      });

      it("should create a custom field with specified type and hidden flag", () => {
        const field = createCustomField(
          "Secret",
          "hidden-value",
          FieldType.PASSWORD,
          true
        );

        expect(field.name).toBe("Secret");
        expect(field.value).toBe("hidden-value");
        expect(field.type).toBe(FieldType.PASSWORD);
        expect(field.hidden).toBe(true);
      });

      it("should trim field name", () => {
        const field = createCustomField("  Trimmed Name  ", "value");

        expect(field.name).toBe("Trimmed Name");
      });
    });

    describe("addCustomField", () => {
      it("should add a custom field to an entry", () => {
        const entry = createEntry({ title: "Test Entry" });
        const customField = createCustomField("API Key", "abc123");

        const updatedEntry = addCustomField(entry, customField);

        expect(updatedEntry.customFields).toHaveLength(1);
        expect(updatedEntry.customFields![0]).toEqual(customField);
        expect(updatedEntry.updatedAt).not.toBe(entry.updatedAt);
      });

      it("should add multiple custom fields", () => {
        let entry = createEntry({ title: "Test Entry" });
        const field1 = createCustomField("Field 1", "value1");
        const field2 = createCustomField("Field 2", "value2");

        entry = addCustomField(entry, field1);
        entry = addCustomField(entry, field2);

        expect(entry.customFields).toHaveLength(2);
        expect(entry.customFields![0]).toEqual(field1);
        expect(entry.customFields![1]).toEqual(field2);
      });
    });

    describe("updateCustomField", () => {
      it("should update a specific custom field", () => {
        const entry = createEntry({ title: "Test Entry" });
        const customField = createCustomField("API Key", "old-value");
        const entryWithField = addCustomField(entry, customField);

        const updatedEntry = updateCustomField(entryWithField, customField.id, {
          value: "new-value",
          hidden: true,
        });

        const updatedField = updatedEntry.customFields!.find(
          (f) => f.id === customField.id
        );
        expect(updatedField!.value).toBe("new-value");
        expect(updatedField!.hidden).toBe(true);
        expect(updatedField!.name).toBe("API Key");
      });

      it("should not affect other custom fields", () => {
        let entry = createEntry({ title: "Test Entry" });
        const field1 = createCustomField("Field 1", "value1");
        const field2 = createCustomField("Field 2", "value2");

        entry = addCustomField(entry, field1);
        entry = addCustomField(entry, field2);

        const updatedEntry = updateCustomField(entry, field1.id, {
          value: "updated-value1",
        });

        const updatedField1 = updatedEntry.customFields!.find(
          (f) => f.id === field1.id
        );
        const unchangedField2 = updatedEntry.customFields!.find(
          (f) => f.id === field2.id
        );

        expect(updatedField1!.value).toBe("updated-value1");
        expect(unchangedField2!.value).toBe("value2");
      });
    });

    describe("removeCustomField", () => {
      it("should remove a specific custom field", () => {
        let entry = createEntry({ title: "Test Entry" });
        const field1 = createCustomField("Field 1", "value1");
        const field2 = createCustomField("Field 2", "value2");

        entry = addCustomField(entry, field1);
        entry = addCustomField(entry, field2);

        const updatedEntry = removeCustomField(entry, field1.id);

        expect(updatedEntry.customFields).toHaveLength(1);
        expect(updatedEntry.customFields![0]).toEqual(field2);
      });

      it("should handle removing non-existent field", () => {
        const entry = createEntry({ title: "Test Entry" });
        const customField = createCustomField("API Key", "value");
        const entryWithField = addCustomField(entry, customField);

        const updatedEntry = removeCustomField(
          entryWithField,
          "non-existent-id"
        );

        expect(updatedEntry.customFields).toHaveLength(1);
        expect(updatedEntry.customFields![0]).toEqual(customField);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle entry with no optional fields", () => {
      const entry = createEntry({ title: "Minimal Entry" });

      const result = validateEntry(entry);

      expect(result.isValid).toBe(true);
      expect(entry.username).toBeUndefined();
      expect(entry.password).toBeUndefined();
      expect(entry.url).toBeUndefined();
      expect(entry.notes).toBeUndefined();
    });

    it("should handle empty arrays and undefined values", () => {
      const entry = createEntry({
        title: "Test Entry",
        tags: [],
        customFields: [],
      });

      const result = validateEntry(entry);

      expect(result.isValid).toBe(true);
      expect(entry.tags).toEqual([]);
      expect(entry.customFields).toEqual([]);
    });

    it("should validate different entry categories", () => {
      const categories = Object.values(EntryCategory);

      categories.forEach((category) => {
        const entry = createEntry({
          title: `${category} Entry`,
          category,
        });

        const result = validateEntry(entry);
        expect(result.isValid).toBe(true);
      });
    });

    it("should validate different field types in custom fields", () => {
      const fieldTypes = Object.values(FieldType);

      fieldTypes.forEach((type) => {
        const field = createCustomField(`${type} Field`, "test-value", type);
        expect(field.type).toBe(type);
      });
    });
  });
});
