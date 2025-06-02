import { beforeEach, describe, expect, it } from "vitest";
import {
  CreateVaultData,
  CreateVaultEntryData,
  EntryCategory,
  FieldType,
  Vault,
  VaultSearchOptions,
} from "../src/types/vault";
import {
  addCustomField,
  addEntry,
  bulkAddEntries,
  bulkDeleteEntries,
  createCustomField,
  createEntry,
  createVault,
  deleteEntry,
  getDuplicatePasswordEntries,
  getEntriesByCategory,
  getEntry,
  getFavoriteEntries,
  getRecentlyModifiedEntries,
  getVaultStats,
  getWeakPasswordEntries,
  removeCustomField,
  searchEntries,
  updateCustomField,
  updateEntry,
  updateEntryData,
  validateEntry,
} from "../src/vault/manager";

describe("Vault Manager", () => {
  let testVault: Vault;
  let sampleEntryData: CreateVaultEntryData;

  beforeEach(() => {
    const vaultData: CreateVaultData = {
      name: "Test Vault",
      description: "A test vault for unit tests",
    };
    testVault = createVault(vaultData);

    sampleEntryData = {
      title: "Test Entry",
      username: "testuser",
      password: "TestPassword123!",
      url: "https://example.com",
      notes: "Test notes",
      tags: ["test", "sample"],
      favorite: false,
      category: EntryCategory.LOGIN,
    };
  });

  describe("createVault", () => {
    it("should create a new vault with default settings", () => {
      const vaultData: CreateVaultData = {
        name: "My Vault",
        description: "Personal password vault",
      };

      const vault = createVault(vaultData);

      expect(vault.id).toBeDefined();
      expect(vault.name).toBe("My Vault");
      expect(vault.description).toBe("Personal password vault");
      expect(vault.entries).toEqual([]);
      expect(vault.createdAt).toBeInstanceOf(Date);
      expect(vault.updatedAt).toBeInstanceOf(Date);
      expect(vault.version).toBeDefined();
      expect(vault.settings).toBeDefined();
    });

    it("should merge custom settings with defaults", () => {
      const vaultData: CreateVaultData = {
        name: "Custom Vault",
        description: "Vault with custom settings",
        settings: {
          security: {
            lockTimeout: 300,
            requireMasterPasswordOnStart: true,
            maxFailedAttempts: 5,
          },
        },
      };

      const vault = createVault(vaultData);

      expect(vault.settings?.security?.lockTimeout).toBe(300);
      expect(vault.settings?.ui?.theme).toBeDefined(); // Should have default theme
    });
  });

  describe("addEntry", () => {
    it("should add a new entry to the vault", () => {
      const result = addEntry(testVault, sampleEntryData);

      expect(result.vault.entries).toHaveLength(1);
      expect(result.entry.id).toBeDefined();
      expect(result.entry.title).toBe("Test Entry");
      expect(result.entry.username).toBe("testuser");
      expect(result.entry.createdAt).toBeInstanceOf(Date);
      expect(result.entry.updatedAt).toBeInstanceOf(Date);
      expect(result.validation.isValid).toBe(true);
    });

    it("should throw error for invalid entry data", () => {
      const invalidData = {
        ...sampleEntryData,
        title: "", // Invalid empty title
      };

      expect(() => addEntry(testVault, invalidData)).toThrow(
        "Invalid entry data"
      );
    });

    it("should preserve original vault immutability", () => {
      const originalEntriesLength = testVault.entries.length;
      addEntry(testVault, sampleEntryData);

      expect(testVault.entries).toHaveLength(originalEntriesLength);
    });
  });

  describe("updateEntry", () => {
    it("should update an existing entry", async () => {
      const { vault: vaultWithEntry, entry } = addEntry(
        testVault,
        sampleEntryData
      );

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));

      const updateData = {
        title: "Updated Title",
        password: "NewPassword456!",
      };

      const result = updateEntry(vaultWithEntry, entry.id, updateData);

      expect(result.entry.title).toBe("Updated Title");
      expect(result.entry.password).toBe("NewPassword456!");
      expect(result.entry.id).toBe(entry.id); // ID should be preserved
      expect(result.entry.createdAt).toEqual(entry.createdAt); // Creation date preserved
      expect(result.entry.updatedAt.getTime()).toBeGreaterThanOrEqual(
        entry.updatedAt.getTime()
      );
      expect(result.validation.isValid).toBe(true);
    });

    it("should throw error for non-existent entry", () => {
      expect(() =>
        updateEntry(testVault, "non-existent-id", { title: "New Title" })
      ).toThrow("Entry with ID non-existent-id not found");
    });

    it("should throw error for invalid update data", () => {
      const { vault: vaultWithEntry, entry } = addEntry(
        testVault,
        sampleEntryData
      );

      expect(() =>
        updateEntry(vaultWithEntry, entry.id, { title: "" })
      ).toThrow("Invalid update data");
    });
  });

  describe("deleteEntry", () => {
    it("should delete an existing entry", async () => {
      const { vault: vaultWithEntry, entry } = addEntry(
        testVault,
        sampleEntryData
      );

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));

      const updatedVault = deleteEntry(vaultWithEntry, entry.id);

      expect(updatedVault.entries).toHaveLength(0);
      expect(updatedVault.updatedAt.getTime()).toBeGreaterThanOrEqual(
        vaultWithEntry.updatedAt.getTime()
      );
    });

    it("should throw error for non-existent entry", () => {
      expect(() => deleteEntry(testVault, "non-existent-id")).toThrow(
        "Entry with ID non-existent-id not found"
      );
    });

    it("should preserve original vault immutability", () => {
      const { vault: vaultWithEntry, entry } = addEntry(
        testVault,
        sampleEntryData
      );
      const originalLength = vaultWithEntry.entries.length;

      deleteEntry(vaultWithEntry, entry.id);

      expect(vaultWithEntry.entries).toHaveLength(originalLength);
    });
  });

  describe("getEntry", () => {
    it("should return entry by ID", () => {
      const { vault: vaultWithEntry, entry } = addEntry(
        testVault,
        sampleEntryData
      );

      const foundEntry = getEntry(vaultWithEntry, entry.id);

      expect(foundEntry).toEqual(entry);
    });

    it("should return null for non-existent entry", () => {
      const foundEntry = getEntry(testVault, "non-existent-id");

      expect(foundEntry).toBeNull();
    });
  });

  describe("searchEntries", () => {
    let vaultWithMultipleEntries: Vault;

    beforeEach(() => {
      let vault = testVault;

      // Add multiple test entries
      const entries = [
        {
          ...sampleEntryData,
          title: "Gmail",
          category: EntryCategory.LOGIN,
          tags: ["email", "google"],
        },
        {
          ...sampleEntryData,
          title: "Facebook",
          category: EntryCategory.OTHER,
          favorite: true,
        },
        {
          ...sampleEntryData,
          title: "Bank Account",
          category: EntryCategory.BANK_ACCOUNT,
          tags: ["banking"],
        },
        {
          ...sampleEntryData,
          title: "Work Email",
          category: EntryCategory.LOGIN,
          tags: ["email", "work"],
        },
      ];

      for (const entryData of entries) {
        const result = addEntry(vault, entryData);
        vault = result.vault;
      }

      vaultWithMultipleEntries = vault;
    });

    it("should search by text query", () => {
      const options: VaultSearchOptions = {
        query: "gmail",
        caseSensitive: false,
      };

      const result = searchEntries(vaultWithMultipleEntries, options);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].title).toBe("Gmail");
      expect(result.totalCount).toBe(1);
      expect(result.searchTime).toBeGreaterThanOrEqual(0);
    });

    it("should filter by category", () => {
      const options: VaultSearchOptions = {
        query: "",
        categories: [EntryCategory.LOGIN],
      };

      const result = searchEntries(vaultWithMultipleEntries, options);

      expect(result.entries).toHaveLength(2);
      expect(
        result.entries.every((entry) => entry.category === EntryCategory.LOGIN)
      ).toBe(true);
    });

    it("should filter by favorites", () => {
      const options: VaultSearchOptions = {
        query: "",
        favorites: true,
      };

      const result = searchEntries(vaultWithMultipleEntries, options);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].title).toBe("Facebook");
    });

    it("should filter by tags", () => {
      const options: VaultSearchOptions = {
        query: "",
        tags: ["email"],
      };

      const result = searchEntries(vaultWithMultipleEntries, options);

      expect(result.entries).toHaveLength(2);
      expect(
        result.entries.every((entry) => entry.tags?.includes("email"))
      ).toBe(true);
    });

    it("should combine multiple filters", () => {
      const options: VaultSearchOptions = {
        query: "",
        categories: [EntryCategory.LOGIN],
        tags: ["email"],
      };

      const result = searchEntries(vaultWithMultipleEntries, options);

      expect(result.entries).toHaveLength(2);
    });

    it("should handle case sensitive search", () => {
      const options: VaultSearchOptions = {
        query: "GMAIL",
        caseSensitive: true,
      };

      const result = searchEntries(vaultWithMultipleEntries, options);

      expect(result.entries).toHaveLength(0);
    });
  });

  describe("getVaultStats", () => {
    let vaultWithStats: Vault;

    beforeEach(() => {
      let vault = testVault;

      const entries = [
        {
          ...sampleEntryData,
          title: "Strong Password",
          password: "StrongPass123!",
          category: EntryCategory.LOGIN,
        },
        {
          ...sampleEntryData,
          title: "Weak Password",
          password: "weak",
          category: EntryCategory.LOGIN,
        },
        {
          ...sampleEntryData,
          title: "Duplicate 1",
          password: "duplicate",
          category: EntryCategory.OTHER,
        },
        {
          ...sampleEntryData,
          title: "Duplicate 2",
          password: "duplicate",
          category: EntryCategory.OTHER,
        },
        {
          ...sampleEntryData,
          title: "Finance Entry",
          password: "FinancePass123!",
          category: EntryCategory.BANK_ACCOUNT,
          tags: ["bank", "money"],
        },
      ];

      for (const entryData of entries) {
        const result = addEntry(vault, entryData);
        vault = result.vault;
      }

      vaultWithStats = vault;
    });

    it("should calculate comprehensive vault statistics", () => {
      const stats = getVaultStats(vaultWithStats);

      expect(stats.totalEntries).toBe(5);
      expect(stats.categoryCounts[EntryCategory.LOGIN]).toBe(2);
      expect(stats.categoryCounts[EntryCategory.OTHER]).toBe(2);
      expect(stats.categoryCounts[EntryCategory.BANK_ACCOUNT]).toBe(1);
      expect(stats.weakPasswords).toBe(3); // "weak", "duplicate", "duplicate" are all weak
      expect(stats.duplicatePasswords).toBe(1); // One duplicate password pair
      expect(stats.tagCounts["bank"]).toBe(1);
      expect(stats.tagCounts["money"]).toBe(1);
      expect(stats.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe("getEntriesByCategory", () => {
    it("should return entries filtered by category", () => {
      let vault = testVault;

      const loginEntry = { ...sampleEntryData, category: EntryCategory.LOGIN };
      const socialEntry = {
        ...sampleEntryData,
        category: EntryCategory.OTHER,
      };

      vault = addEntry(vault, loginEntry).vault;
      vault = addEntry(vault, socialEntry).vault;

      const loginEntries = getEntriesByCategory(vault, EntryCategory.LOGIN);
      const socialEntries = getEntriesByCategory(vault, EntryCategory.OTHER);

      expect(loginEntries).toHaveLength(1);
      expect(socialEntries).toHaveLength(1);
      expect(loginEntries[0].category).toBe(EntryCategory.LOGIN);
      expect(socialEntries[0].category).toBe(EntryCategory.OTHER);
    });
  });

  describe("getFavoriteEntries", () => {
    it("should return only favorite entries", () => {
      let vault = testVault;

      const favoriteEntry = { ...sampleEntryData, favorite: true };
      const regularEntry = { ...sampleEntryData, favorite: false };

      vault = addEntry(vault, favoriteEntry).vault;
      vault = addEntry(vault, regularEntry).vault;

      const favorites = getFavoriteEntries(vault);

      expect(favorites).toHaveLength(1);
      expect(favorites[0].favorite).toBe(true);
    });
  });

  describe("getWeakPasswordEntries", () => {
    it("should identify entries with weak passwords", () => {
      let vault = testVault;

      const weakEntry = { ...sampleEntryData, password: "weak" };
      const strongEntry = { ...sampleEntryData, password: "StrongPass123!" };

      vault = addEntry(vault, weakEntry).vault;
      vault = addEntry(vault, strongEntry).vault;

      const weakEntries = getWeakPasswordEntries(vault);

      expect(weakEntries).toHaveLength(1);
      expect(weakEntries[0].password).toBe("weak");
    });
  });

  describe("getDuplicatePasswordEntries", () => {
    it("should group entries with duplicate passwords", () => {
      let vault = testVault;

      const entry1 = {
        ...sampleEntryData,
        title: "Entry 1",
        password: "duplicate",
      };
      const entry2 = {
        ...sampleEntryData,
        title: "Entry 2",
        password: "duplicate",
      };
      const entry3 = {
        ...sampleEntryData,
        title: "Entry 3",
        password: "unique",
      };

      vault = addEntry(vault, entry1).vault;
      vault = addEntry(vault, entry2).vault;
      vault = addEntry(vault, entry3).vault;

      const duplicateGroups = getDuplicatePasswordEntries(vault);

      expect(duplicateGroups).toHaveLength(1);
      expect(duplicateGroups[0]).toHaveLength(2);
      expect(
        duplicateGroups[0].every((entry) => entry.password === "duplicate")
      ).toBe(true);
    });
  });

  describe("getRecentlyModifiedEntries", () => {
    it("should return recently modified entries", () => {
      let vault = testVault;

      // Add an entry
      const result = addEntry(vault, sampleEntryData);
      vault = result.vault;

      // Update it to make it recently modified
      vault = updateEntry(vault, result.entry.id, { title: "Updated" }).vault;

      const recentEntries = getRecentlyModifiedEntries(vault, 1);

      expect(recentEntries).toHaveLength(1);
      expect(recentEntries[0].title).toBe("Updated");
    });

    it("should sort by most recent first", () => {
      let vault = testVault;

      const entry1 = addEntry(vault, { ...sampleEntryData, title: "First" });
      vault = entry1.vault;

      // Wait a bit to ensure different timestamps
      setTimeout(() => {
        const entry2 = addEntry(vault, { ...sampleEntryData, title: "Second" });
        vault = entry2.vault;

        const recentEntries = getRecentlyModifiedEntries(vault, 1);

        expect(recentEntries[0].title).toBe("Second");
      }, 10);
    });
  });

  describe("bulkAddEntries", () => {
    it("should add multiple entries at once", () => {
      const entriesData = [
        { ...sampleEntryData, title: "Bulk Entry 1" },
        { ...sampleEntryData, title: "Bulk Entry 2" },
        { ...sampleEntryData, title: "Bulk Entry 3" },
      ];

      const result = bulkAddEntries(testVault, entriesData);

      expect(result.vault.entries).toHaveLength(3);
      expect(result.entries).toHaveLength(3);
      expect(result.validationResults).toHaveLength(3);
      expect(result.validationResults.every((v) => v.isValid)).toBe(true);
    });

    it("should throw error if any entry is invalid", () => {
      const entriesData = [
        { ...sampleEntryData, title: "Valid Entry" },
        { ...sampleEntryData, title: "" }, // Invalid
      ];

      expect(() => bulkAddEntries(testVault, entriesData)).toThrow(
        "Invalid entry data"
      );
    });
  });

  describe("bulkDeleteEntries", () => {
    it("should delete multiple entries at once", () => {
      let vault = testVault;
      const entryIds: string[] = [];

      // Add multiple entries
      for (let i = 0; i < 3; i++) {
        const result = addEntry(vault, {
          ...sampleEntryData,
          title: `Entry ${i}`,
        });
        vault = result.vault;
        entryIds.push(result.entry.id);
      }

      const updatedVault = bulkDeleteEntries(vault, entryIds);

      expect(updatedVault.entries).toHaveLength(0);
    });

    it("should throw error if no entries found", () => {
      expect(() =>
        bulkDeleteEntries(testVault, ["non-existent-1", "non-existent-2"])
      ).toThrow("No entries found with the provided IDs");
    });
  });

  describe("Legacy Functions", () => {
    describe("createEntry", () => {
      it("should create a standalone entry", () => {
        const entry = createEntry(sampleEntryData);

        expect(entry.id).toBeDefined();
        expect(entry.title).toBe("Test Entry");
        expect(entry.createdAt).toBeInstanceOf(Date);
        expect(entry.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe("updateEntryData", () => {
      it("should update entry data", async () => {
        const entry = createEntry(sampleEntryData);

        // Wait a bit to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 1));

        const updatedEntry = updateEntryData(entry, { title: "Updated Title" });

        expect(updatedEntry.title).toBe("Updated Title");
        expect(updatedEntry.id).toBe(entry.id);
        expect(updatedEntry.createdAt).toEqual(entry.createdAt);
        expect(updatedEntry.updatedAt.getTime()).toBeGreaterThanOrEqual(
          entry.updatedAt.getTime()
        );
      });
    });

    describe("validateEntry", () => {
      it("should validate entry data", () => {
        const entry = createEntry(sampleEntryData);
        const validation = validateEntry(entry);

        expect(validation.isValid).toBe(true);
      });
    });

    describe("Custom Field Operations", () => {
      it("should create custom field", () => {
        const field = createCustomField(
          "API Key",
          "secret-key",
          FieldType.PASSWORD,
          true
        );

        expect(field.id).toBeDefined();
        expect(field.name).toBe("API Key");
        expect(field.value).toBe("secret-key");
        expect(field.type).toBe(FieldType.PASSWORD);
        expect(field.hidden).toBe(true);
      });

      it("should add custom field to entry", () => {
        const entry = createEntry(sampleEntryData);
        const field = createCustomField(
          "Security Question",
          "What is your pet's name?"
        );

        const updatedEntry = addCustomField(entry, field);

        expect(updatedEntry.customFields).toHaveLength(1);
        expect(updatedEntry.customFields![0]).toEqual(field);
      });

      it("should update custom field in entry", () => {
        const entry = createEntry(sampleEntryData);
        const field = createCustomField(
          "Security Question",
          "What is your pet's name?"
        );
        const entryWithField = addCustomField(entry, field);

        const updatedEntry = updateCustomField(entryWithField, field.id, {
          value: "What is your mother's maiden name?",
        });

        expect(updatedEntry.customFields![0].value).toBe(
          "What is your mother's maiden name?"
        );
      });

      it("should remove custom field from entry", () => {
        const entry = createEntry(sampleEntryData);
        const field = createCustomField(
          "Security Question",
          "What is your pet's name?"
        );
        const entryWithField = addCustomField(entry, field);

        const updatedEntry = removeCustomField(entryWithField, field.id);

        expect(updatedEntry.customFields).toHaveLength(0);
      });
    });
  });
});
