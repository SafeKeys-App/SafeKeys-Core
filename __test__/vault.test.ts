import { beforeEach, describe, expect, it } from "vitest";
import {
  CreateVaultData,
  CreateVaultEntryData,
  EntryCategory,
  Vault,
} from "../src/types";
import {
  addEntry,
  createVault,
  deleteEntry,
  getEntry,
  updateEntry,
} from "../src/vault";

describe("Vault Module", () => {
  let testVault: Vault;
  let sampleEntryData: CreateVaultEntryData;

  beforeEach(() => {
    const vaultData: CreateVaultData = {
      name: "Vault de Test",
      description: "Un vault pour les tests unitaires",
    };
    testVault = createVault(vaultData);

    sampleEntryData = {
      title: "Entrée de test",
      username: "utilisateur_test",
      password: "MotDePasse123!",
      url: "https://exemple.fr",
      notes: "Notes de test",
      tags: ["test", "exemple"],
      favorite: false,
      category: EntryCategory.LOGIN,
    };
  });

  describe("createVault", () => {
    it("crée un nouveau vault avec les paramètres par défaut", () => {
      const vaultData: CreateVaultData = {
        name: "Mon Vault",
        description: "Vault personnel",
      };

      const vault = createVault(vaultData);

      expect(vault.id).toBeDefined();
      expect(vault.name).toBe("Mon Vault");
      expect(vault.description).toBe("Vault personnel");
      expect(vault.entries).toEqual([]);
      expect(vault.createdAt).toBeInstanceOf(Date);
      expect(vault.updatedAt).toBeInstanceOf(Date);
      expect(vault.settings).toBeDefined();
    });

    it("fusionne les paramètres personnalisés avec les paramètres par défaut", () => {
      const vaultData: CreateVaultData = {
        name: "Vault Personnalisé",
        description: "Avec paramètres personnalisés",
        settings: {
          security: {
            lockTimeout: 30,
            requireMasterPasswordOnStart: false,
            maxFailedAttempts: 3,
          },
        },
      };

      const vault = createVault(vaultData);

      expect(vault.settings?.security?.lockTimeout).toBe(30);
      expect(vault.settings?.security?.requireMasterPasswordOnStart).toBe(
        false
      );
      expect(vault.settings?.security?.maxFailedAttempts).toBe(3);
      // Vérifie que les paramètres par défaut sont toujours présents
      expect(vault.settings?.ui?.theme).toBeDefined();
    });
  });

  describe("addEntry", () => {
    it("ajoute une nouvelle entrée au vault", () => {
      const result = addEntry(testVault, sampleEntryData);

      expect(result.vault.entries).toHaveLength(1);
      expect(result.entry.id).toBeDefined();
      expect(result.entry.title).toBe("Entrée de test");
      expect(result.validation.isValid).toBe(true);
    });

    it("renvoie des erreurs de validation pour une entrée invalide", () => {
      const invalidData = {
        // Titre manquant
        username: "utilisateur_test",
      } as CreateVaultEntryData;

      const result = addEntry(testVault, invalidData);

      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
      // Le vault original ne devrait pas être modifié
      expect(result.vault).toEqual(testVault);
    });

    it("préserve l'immutabilité du vault original", () => {
      const originalLength = testVault.entries.length;
      addEntry(testVault, sampleEntryData);

      // Le vault original ne doit pas être modifié
      expect(testVault.entries).toHaveLength(originalLength);
    });
  });

  describe("updateEntry", () => {
    it("met à jour une entrée existante", () => {
      // Ajouter d'abord une entrée
      const { vault: vaultWithEntry, entry } = addEntry(
        testVault,
        sampleEntryData
      );

      // Mettre à jour l'entrée
      const updateData = {
        title: "Titre mis à jour",
        password: "NouveauMotDePasse456!",
      };

      const result = updateEntry(vaultWithEntry, entry.id, updateData);

      expect(result.entry.title).toBe("Titre mis à jour");
      expect(result.entry.password).toBe("NouveauMotDePasse456!");
      expect(result.entry.username).toBe("utilisateur_test"); // inchangé
      expect(result.entry.id).toBe(entry.id); // préservé
      expect(result.entry.createdAt).toEqual(entry.createdAt); // préservé
      expect(result.entry.updatedAt.getTime()).toBeGreaterThan(
        entry.updatedAt.getTime()
      );
      expect(result.validation.isValid).toBe(true);
    });

    it("renvoie une erreur pour une entrée inexistante", () => {
      const result = updateEntry(testVault, "id-inexistant", {
        title: "Nouveau titre",
      });

      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors[0].message).toContain("Entry not found");
    });

    it("renvoie des erreurs de validation pour des données invalides", () => {
      // Ajouter d'abord une entrée
      const { vault: vaultWithEntry, entry } = addEntry(
        testVault,
        sampleEntryData
      );

      // Mise à jour avec un titre vide (invalide)
      const result = updateEntry(vaultWithEntry, entry.id, { title: "" });

      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe("deleteEntry", () => {
    it("supprime une entrée existante", () => {
      // Ajouter d'abord une entrée
      const { vault: vaultWithEntry, entry } = addEntry(
        testVault,
        sampleEntryData
      );

      // Supprimer l'entrée
      const updatedVault = deleteEntry(vaultWithEntry, entry.id);

      expect(updatedVault.entries).toHaveLength(0);
      expect(updatedVault.updatedAt.getTime()).toBeGreaterThanOrEqual(
        vaultWithEntry.updatedAt.getTime()
      );
    });

    it("ne modifie pas le vault si l'entrée n'existe pas", () => {
      const updatedVault = deleteEntry(testVault, "id-inexistant");

      // Le vault ne devrait pas être modifié
      expect(updatedVault).toEqual(testVault);
    });
  });

  describe("getEntry", () => {
    it("récupère une entrée par son ID", () => {
      // Ajouter d'abord une entrée
      const { vault: vaultWithEntry, entry } = addEntry(
        testVault,
        sampleEntryData
      );

      // Récupérer l'entrée
      const retrievedEntry = getEntry(vaultWithEntry, entry.id);

      expect(retrievedEntry).toBeDefined();
      expect(retrievedEntry?.id).toBe(entry.id);
      expect(retrievedEntry?.title).toBe(entry.title);
    });

    it("retourne null pour un ID inexistant", () => {
      const entry = getEntry(testVault, "id-inexistant");
      expect(entry).toBeNull();
    });
  });
});
