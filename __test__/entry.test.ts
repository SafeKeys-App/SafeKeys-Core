import { describe, expect, it } from "vitest";

import {
  CreateVaultEntryData,
  CustomField,
  EntryCategory,
  FieldType,
} from "../src/types";
import {
  createEntry,
  updateEntryData,
  validateCreateEntryData,
  validateEntry,
} from "../src/vault";

describe("Entry Module", () => {
  describe("createEntry", () => {
    it("crée une entrée avec les valeurs par défaut appropriées", () => {
      const data = {
        title: "Mon entrée",
        username: "utilisateur",
        password: "Mot2Passe!",
      };

      const entry = createEntry(data);

      expect(entry.id).toBeDefined();
      expect(entry.title).toBe("Mon entrée");
      expect(entry.username).toBe("utilisateur");
      expect(entry.password).toBe("Mot2Passe!");
      expect(entry.tags).toEqual([]);
      expect(entry.favorite).toBe(false);
      expect(entry.category).toBe(EntryCategory.LOGIN);
      expect(entry.customFields).toEqual([]);
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.updatedAt).toBeInstanceOf(Date);
    });

    it("utilise les valeurs fournies plutôt que les valeurs par défaut", () => {
      const customFields: CustomField[] = [
        {
          id: "123",
          name: "CVC",
          value: "123",
          type: FieldType.TEXT,
        },
      ];

      const data = {
        title: "Mon entrée",
        username: "utilisateur",
        password: "Mot2Passe!",
        tags: ["personnel", "important"],
        favorite: true,
        category: EntryCategory.CREDIT_CARD,
        customFields,
      };

      const entry = createEntry(data);

      expect(entry.tags).toEqual(["personnel", "important"]);
      expect(entry.favorite).toBe(true);
      expect(entry.category).toBe(EntryCategory.CREDIT_CARD);
      expect(entry.customFields).toHaveLength(1);
    });
  });

  describe("updateEntryData", () => {
    it("met à jour une entrée existante", () => {
      const originalEntry = createEntry({
        title: "Original",
        username: "utilisateur",
        password: "password",
      });

      const originalCreatedAt = originalEntry.createdAt;
      const originalId = originalEntry.id;

      const updatedEntry = updateEntryData(originalEntry, {
        title: "Mis à jour",
        password: "nouveau_password",
      });

      expect(updatedEntry.title).toBe("Mis à jour");
      expect(updatedEntry.username).toBe("utilisateur"); // inchangé
      expect(updatedEntry.password).toBe("nouveau_password");
      expect(updatedEntry.id).toBe(originalId); // préservé
      expect(updatedEntry.createdAt).toBe(originalCreatedAt); // préservé
      expect(updatedEntry.updatedAt).not.toEqual(originalEntry.updatedAt); // mis à jour
    });
  });

  describe("validateEntry", () => {
    it("valide une entrée correcte", () => {
      const entry = createEntry({
        title: "Entrée valide",
        username: "utilisateur",
        password: "Mot2Passe!",
      });

      const result = validateEntry(entry);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("détecte une entrée invalide", () => {
      // Création d'une entrée puis modification pour la rendre invalide
      const entry = createEntry({
        title: "Entrée valide",
        username: "utilisateur",
        password: "Mot2Passe!",
      });

      // @ts-ignore - test volontairement invalide
      entry.title = "";

      const result = validateEntry(entry);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateCreateEntryData", () => {
    it("valide des données de création correctes", () => {
      const data = {
        title: "Nouvelle entrée",
        username: "utilisateur",
        password: "Mot2Passe!",
      };

      const result = validateCreateEntryData(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("détecte des données de création invalides", () => {
      const invalidData: Partial<CreateVaultEntryData> = {
        // Titre manquant
        username: "utilisateur",
        password: "Mot2Passe!",
      };

      // @ts-ignore - test volontairement invalide
      const result = validateCreateEntryData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
