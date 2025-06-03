import { beforeEach, describe, expect, it } from "vitest";
import {
  CreateVaultEntryData,
  EntryCategory,
  Vault,
  VaultSearchOptions,
} from "../src/types";
import {
  addEntry,
  createVault,
  getEntriesByCategory,
  getFavoriteEntries,
  getRecentlyModifiedEntries,
  searchEntries,
} from "../src/vault";

describe("Search Module", () => {
  let testVault: Vault;

  beforeEach(() => {
    // Créer un nouveau vault vide
    testVault = createVault({
      name: "Vault de test",
      description: "Vault pour tester les fonctions de recherche",
    });

    // Ajouter plusieurs entrées pour les tests
    const entries: CreateVaultEntryData[] = [
      {
        title: "Gmail",
        username: "utilisateur@gmail.com",
        password: "MotDePasse123!",
        url: "https://gmail.com",
        notes: "Mon compte principal",
        tags: ["email", "google", "important"],
        favorite: true,
        category: EntryCategory.LOGIN,
      },
      {
        title: "Facebook",
        username: "utilisateur@gmail.com",
        password: "AutreMotDePasse456!",
        url: "https://facebook.com",
        notes: "Réseau social",
        tags: ["social", "personnel"],
        favorite: false,
        category: EntryCategory.LOGIN,
      },
      {
        title: "Carte Visa",
        username: "John Doe",
        password: "1234",
        notes: "Expire en 12/25",
        tags: ["finance", "important"],
        favorite: true,
        category: EntryCategory.CREDIT_CARD,
      },
      {
        title: "Licence Windows",
        notes: "Clé d'activation: XXXXX-XXXXX-XXXXX",
        tags: ["logiciel"],
        favorite: false,
        category: EntryCategory.SOFTWARE_LICENSE,
      },
    ];

    // Ajouter chaque entrée au vault
    let vaultWithEntries = testVault;
    for (const entryData of entries) {
      const result = addEntry(vaultWithEntries, entryData);
      vaultWithEntries = result.vault;
    }
    testVault = vaultWithEntries;
  });

  describe("searchEntries", () => {
    it("trouve des entrées par texte simple", () => {
      const options: VaultSearchOptions = {
        query: "gmail",
        exactMatch: true,
      };

      const result = searchEntries(testVault, options);

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].title).toBe("Gmail");
      expect(result.totalCount).toBe(1);
      expect(result.searchTime).toBeGreaterThanOrEqual(0);
    });

    it("trouve des entrées par correspondance partielle d'URL", () => {
      const options: VaultSearchOptions = {
        query: "facebook",
      };

      const result = searchEntries(testVault, options);

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].title).toBe("Facebook");
    });

    it("recherche dans les tags", () => {
      const options: VaultSearchOptions = {
        query: "important",
      };

      const result = searchEntries(testVault, options);

      expect(result.entries.length).toBe(2);
      expect(result.entries.some((e) => e.title === "Gmail")).toBe(true);
      expect(result.entries.some((e) => e.title === "Carte Visa")).toBe(true);
    });

    it("filtre par catégorie", () => {
      const options: VaultSearchOptions = {
        query: "",
        categories: [EntryCategory.CREDIT_CARD],
      };

      const result = searchEntries(testVault, options);

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].title).toBe("Carte Visa");
    });

    it("filtre par plusieurs tags", () => {
      const options: VaultSearchOptions = {
        query: "",
        tags: ["social", "personnel"],
      };

      const result = searchEntries(testVault, options);

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].title).toBe("Facebook");
    });

    it("filtre par favoris", () => {
      const options: VaultSearchOptions = {
        query: "",
        favorites: true,
      };

      const result = searchEntries(testVault, options);

      expect(result.entries.length).toBe(2);
      expect(result.entries.every((e) => e.favorite === true)).toBe(true);
    });

    it("combine plusieurs critères de recherche", () => {
      const options: VaultSearchOptions = {
        query: "gmail",
        favorites: true,
      };

      const result = searchEntries(testVault, options);

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].title).toBe("Gmail");
      expect(result.entries[0].favorite).toBe(true);
    });

    it("retourne toutes les entrées si aucun critère n'est spécifié", () => {
      const options: VaultSearchOptions = {
        query: "",
      };

      const result = searchEntries(testVault, options);

      expect(result.entries.length).toBe(4);
    });
  });

  describe("getEntriesByCategory", () => {
    it("récupère les entrées par catégorie", () => {
      const loginEntries = getEntriesByCategory(testVault, EntryCategory.LOGIN);
      expect(loginEntries.length).toBe(2);

      const creditCardEntries = getEntriesByCategory(
        testVault,
        EntryCategory.CREDIT_CARD
      );
      expect(creditCardEntries.length).toBe(1);
      expect(creditCardEntries[0].title).toBe("Carte Visa");
    });

    it("retourne un tableau vide si aucune entrée ne correspond", () => {
      const bankAccountEntries = getEntriesByCategory(
        testVault,
        EntryCategory.BANK_ACCOUNT
      );
      expect(bankAccountEntries.length).toBe(0);
    });
  });

  describe("getFavoriteEntries", () => {
    it("récupère toutes les entrées favorites", () => {
      const favorites = getFavoriteEntries(testVault);

      expect(favorites.length).toBe(2);
      expect(favorites.every((e) => e.favorite === true)).toBe(true);
      expect(favorites.some((e) => e.title === "Gmail")).toBe(true);
      expect(favorites.some((e) => e.title === "Carte Visa")).toBe(true);
    });
  });

  describe("getRecentlyModifiedEntries", () => {
    it("récupère les entrées récemment modifiées", () => {
      // Toutes les entrées viennent d'être créées, donc toutes sont récentes
      const recentEntries = getRecentlyModifiedEntries(testVault, 1); // 1 jour

      expect(recentEntries.length).toBe(4);

      // Les entrées devraient être triées par date de modification (la plus récente en premier)
      for (let i = 1; i < recentEntries.length; i++) {
        expect(recentEntries[i - 1].updatedAt.getTime()).toBeGreaterThanOrEqual(
          recentEntries[i].updatedAt.getTime()
        );
      }
    });
  });
});
