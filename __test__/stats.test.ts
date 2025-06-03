import { beforeEach, describe, expect, it } from "vitest";
import { CreateVaultEntryData, EntryCategory, Vault } from "../src/types";
import {
  getDuplicatePasswordEntries,
  getVaultStats,
  getWeakPasswordEntries,
} from "../src/vault/stats";
import { addEntry, createVault } from "../src/vault/vault";

describe("Stats Module", () => {
  let testVault: Vault;

  beforeEach(() => {
    // Créer un nouveau vault vide
    testVault = createVault({
      name: "Vault de test",
      description: "Vault pour tester les fonctions de statistiques",
    });

    // Ajouter plusieurs entrées pour les tests
    const entries: CreateVaultEntryData[] = [
      {
        title: "Gmail",
        username: "utilisateur@gmail.com",
        password: "MotDePasse123!",
        url: "https://gmail.com",
        tags: ["email", "google"],
        favorite: true,
        category: EntryCategory.LOGIN,
      },
      {
        title: "Facebook",
        username: "utilisateur@gmail.com",
        password: "MotDePasse123!", // Mot de passe en double
        url: "https://facebook.com",
        tags: ["social"],
        category: EntryCategory.LOGIN,
      },
      {
        title: "Twitter",
        username: "utilisateur",
        password: "faible", // Mot de passe faible
        url: "https://twitter.com",
        tags: ["social"],
        category: EntryCategory.LOGIN,
      },
      {
        title: "Carte Visa",
        username: "John Doe",
        password: "1234", // Mot de passe faible
        category: EntryCategory.CREDIT_CARD,
      },
      {
        title: "Licence Windows",
        notes: "Clé d'activation: XXXXX-XXXXX-XXXXX",
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

  describe("getVaultStats", () => {
    it("calcule correctement les statistiques générales du vault", () => {
      const stats = getVaultStats(testVault);

      expect(stats.totalEntries).toBe(5);
      expect(stats.lastActivity).toBeInstanceOf(Date);
    });

    it("compte correctement les entrées par catégorie", () => {
      const stats = getVaultStats(testVault);

      expect(stats.categoryCounts[EntryCategory.LOGIN]).toBe(3);
      expect(stats.categoryCounts[EntryCategory.CREDIT_CARD]).toBe(1);
      expect(stats.categoryCounts[EntryCategory.SOFTWARE_LICENSE]).toBe(1);
      expect(stats.categoryCounts[EntryCategory.IDENTITY]).toBe(0);
    });

    it("compte correctement les tags", () => {
      const stats = getVaultStats(testVault);

      expect(stats.tagCounts["email"]).toBe(1);
      expect(stats.tagCounts["google"]).toBe(1);
      expect(stats.tagCounts["social"]).toBe(2);
    });

    it("détecte correctement les mots de passe faibles", () => {
      const stats = getVaultStats(testVault);

      expect(stats.weakPasswords).toBe(2);
    });

    it("détecte correctement les mots de passe en double", () => {
      const stats = getVaultStats(testVault);

      expect(stats.duplicatePasswords).toBe(1); // 1 groupe de doublons
    });
  });

  describe("getWeakPasswordEntries", () => {
    it("identifie correctement les entrées avec des mots de passe faibles", () => {
      const weakEntries = getWeakPasswordEntries(testVault);

      expect(weakEntries.length).toBe(2);
      expect(weakEntries.some((e) => e.title === "Twitter")).toBe(true);
      expect(weakEntries.some((e) => e.title === "Carte Visa")).toBe(true);
    });

    it("ne retourne pas les entrées sans mot de passe", () => {
      const weakEntries = getWeakPasswordEntries(testVault);

      expect(weakEntries.some((e) => e.title === "Licence Windows")).toBe(
        false
      );
    });
  });

  describe("getDuplicatePasswordEntries", () => {
    it("identifie correctement les groupes de mots de passe en double", () => {
      const duplicateGroups = getDuplicatePasswordEntries(testVault);

      expect(duplicateGroups.length).toBe(1); // 1 groupe de doublons
      expect(duplicateGroups[0].length).toBe(2); // 2 entrées dans ce groupe

      // Vérifie que les bonnes entrées sont regroupées
      const titles = duplicateGroups[0].map((e) => e.title).sort();
      expect(titles).toEqual(["Facebook", "Gmail"]);
    });

    it("retourne un tableau vide s'il n'y a pas de doublons", () => {
      // Créer un vault sans doublons
      const vaultData = createVault({
        name: "Vault sans doublons",
        description: "Test",
      });

      const entryData = {
        title: "Entrée unique",
        password: "Unique123!",
      };

      const { vault } = addEntry(vaultData, entryData);

      const duplicateGroups = getDuplicatePasswordEntries(vault);
      expect(duplicateGroups.length).toBe(0);
    });
  });
});
