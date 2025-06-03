import { beforeEach, describe, expect, it } from "vitest";
import { bulkAddEntries, bulkDeleteEntries } from "../src/vault/bulk";
import { createVault } from "../src/vault/vault";
import { CreateVaultEntryData, EntryCategory, Vault } from "../src/types";

describe("Bulk Operations Module", () => {
  let testVault: Vault;
  let sampleEntries: CreateVaultEntryData[];

  beforeEach(() => {
    // Créer un nouveau vault vide
    testVault = createVault({
      name: "Vault de test",
      description: "Vault pour tester les opérations en masse",
    });

    // Préparer des entrées de test
    sampleEntries = [
      {
        title: "Gmail",
        username: "utilisateur@gmail.com",
        password: "MotDePasse123!",
        url: "https://gmail.com",
        tags: ["email"],
        category: EntryCategory.LOGIN,
      },
      {
        title: "Facebook",
        username: "utilisateur@gmail.com",
        password: "AutreMotDePasse456!",
        url: "https://facebook.com",
        tags: ["social"],
        category: EntryCategory.LOGIN,
      },
      {
        title: "Carte Visa",
        username: "John Doe",
        password: "1234",
        category: EntryCategory.CREDIT_CARD,
      },
    ];
  });

  describe("bulkAddEntries", () => {
    it("ajoute plusieurs entrées en une seule opération", () => {
      const result = bulkAddEntries(testVault, sampleEntries);

      expect(result.vault.entries.length).toBe(3);
      expect(result.entries.length).toBe(3);
      expect(result.validationResults.length).toBe(3);

      // Vérifie que toutes les entrées ont été ajoutées
      const titles = result.vault.entries.map((e) => e.title).sort();
      expect(titles).toEqual(["Carte Visa", "Facebook", "Gmail"]);

      // Vérifie que toutes les validations sont réussies
      expect(result.validationResults.every((v) => v.isValid)).toBe(true);
    });

    it("ne modifie pas le vault en cas d'entrée invalide", () => {
      // Créer une entrée invalide (sans titre)
      const invalidEntries = [
        ...sampleEntries,
        {
          // Titre manquant
          username: "invalide",
          password: "MotDePasse",
        } as CreateVaultEntryData,
      ];

      const result = bulkAddEntries(testVault, invalidEntries);

      // Le vault ne devrait pas être modifié
      expect(result.vault).toEqual(testVault);
      expect(result.entries).toHaveLength(0);

      // Une validation devrait échouer
      expect(result.validationResults.some((v) => !v.isValid)).toBe(true);
    });

    it("préserve l'immutabilité du vault original", () => {
      const originalEntriesLength = testVault.entries.length;
      bulkAddEntries(testVault, sampleEntries);

      // Le vault original ne doit pas être modifié
      expect(testVault.entries).toHaveLength(originalEntriesLength);
    });
  });

  describe("bulkDeleteEntries", () => {
    it("supprime plusieurs entrées en une seule opération", () => {
      // D'abord ajouter les entrées
      const { vault: vaultWithEntries, entries } = bulkAddEntries(
        testVault,
        sampleEntries
      );

      // Récupérer les IDs des deux premières entrées
      const idsToDelete = [entries[0].id, entries[1].id];

      // Supprimer ces entrées
      const updatedVault = bulkDeleteEntries(vaultWithEntries, idsToDelete);

      // Il ne devrait rester qu'une entrée
      expect(updatedVault.entries.length).toBe(1);

      // Vérifier que les bonnes entrées ont été supprimées
      expect(
        updatedVault.entries.find((e) => e.id === idsToDelete[0])
      ).toBeUndefined();
      expect(
        updatedVault.entries.find((e) => e.id === idsToDelete[1])
      ).toBeUndefined();
      expect(
        updatedVault.entries.find((e) => e.id === entries[2].id)
      ).toBeDefined();
    });

    it("ne modifie pas le vault si aucun ID n'est trouvé", () => {
      // D'abord ajouter les entrées
      const { vault: vaultWithEntries } = bulkAddEntries(
        testVault,
        sampleEntries
      );

      // Tenter de supprimer des entrées inexistantes
      const updatedVault = bulkDeleteEntries(vaultWithEntries, [
        "id-inexistant-1",
        "id-inexistant-2",
      ]);

      // Le vault ne devrait pas être modifié
      expect(updatedVault).toEqual(vaultWithEntries);
    });

    it("préserve l'immutabilité du vault original", () => {
      // D'abord ajouter les entrées
      const { vault: vaultWithEntries, entries } = bulkAddEntries(
        testVault,
        sampleEntries
      );

      const originalEntriesLength = vaultWithEntries.entries.length;
      const idsToDelete = [entries[0].id];

      bulkDeleteEntries(vaultWithEntries, idsToDelete);

      // Le vault original ne doit pas être modifié
      expect(vaultWithEntries.entries).toHaveLength(originalEntriesLength);
    });
  });
});
