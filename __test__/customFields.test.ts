import { describe, expect, it } from "vitest";

import { FieldType } from "../src/types";
import {
  addCustomField,
  createCustomField,
  createEntry,
  removeCustomField,
  updateCustomField,
  validateCustomFieldData,
} from "../src/vault";

describe("Custom Fields Module", () => {
  describe("createCustomField", () => {
    it("crée un champ personnalisé avec les valeurs par défaut", () => {
      const field = createCustomField("Nom du champ", "Valeur");

      expect(field.id).toBeDefined();
      expect(field.name).toBe("Nom du champ");
      expect(field.value).toBe("Valeur");
      expect(field.type).toBe(FieldType.TEXT);
      expect(field.hidden).toBe(false);
    });

    it("utilise le type et l'état de visibilité fournis", () => {
      const field = createCustomField(
        "Mot de passe",
        "secret123",
        FieldType.PASSWORD,
        true
      );

      expect(field.name).toBe("Mot de passe");
      expect(field.value).toBe("secret123");
      expect(field.type).toBe(FieldType.PASSWORD);
      expect(field.hidden).toBe(true);
    });

    it("supprime les espaces autour du nom", () => {
      const field = createCustomField("  Nom avec espaces  ", "Valeur");
      expect(field.name).toBe("Nom avec espaces");
    });
  });

  describe("addCustomField", () => {
    it("ajoute un champ personnalisé à une entrée", () => {
      const entry = createEntry({
        title: "Mon entrée",
        username: "utilisateur",
        password: "password",
      });

      const field = createCustomField("Site de récupération", "exemple.com");
      const updatedEntry = addCustomField(entry, field);

      expect(updatedEntry.customFields).toHaveLength(1);
      expect(updatedEntry.customFields?.[0].name).toBe("Site de récupération");
      expect(updatedEntry.customFields?.[0].value).toBe("exemple.com");
      expect(updatedEntry.updatedAt).not.toEqual(entry.updatedAt);
    });
  });

  describe("updateCustomField", () => {
    it("met à jour un champ personnalisé existant", () => {
      // Créer une entrée avec un champ personnalisé
      const entry = createEntry({
        title: "Mon entrée",
        username: "utilisateur",
        password: "password",
      });

      const field = createCustomField("Ancien nom", "Ancienne valeur");
      const entryWithField = addCustomField(entry, field);

      // Mettre à jour le champ
      const fieldId = entryWithField.customFields?.[0].id as string;
      const updatedEntry = updateCustomField(entryWithField, fieldId, {
        name: "Nouveau nom",
        value: "Nouvelle valeur",
        hidden: true,
      });

      expect(updatedEntry.customFields).toHaveLength(1);
      expect(updatedEntry.customFields?.[0].id).toBe(fieldId);
      expect(updatedEntry.customFields?.[0].name).toBe("Nouveau nom");
      expect(updatedEntry.customFields?.[0].value).toBe("Nouvelle valeur");
      expect(updatedEntry.customFields?.[0].hidden).toBe(true);
    });

    it("ne modifie pas les autres champs", () => {
      // Créer une entrée avec deux champs personnalisés
      const entry = createEntry({
        title: "Mon entrée",
        username: "utilisateur",
        password: "password",
      });

      const field1 = createCustomField("Champ 1", "Valeur 1");
      const field2 = createCustomField("Champ 2", "Valeur 2");

      let entryWithFields = addCustomField(entry, field1);
      entryWithFields = addCustomField(entryWithFields, field2);

      // Mettre à jour le premier champ
      const fieldId = entryWithFields.customFields?.[0].id as string;
      const updatedEntry = updateCustomField(entryWithFields, fieldId, {
        name: "Champ 1 modifié",
      });

      expect(updatedEntry.customFields).toHaveLength(2);
      expect(updatedEntry.customFields?.[0].name).toBe("Champ 1 modifié");
      expect(updatedEntry.customFields?.[1].name).toBe("Champ 2"); // inchangé
    });
  });

  describe("removeCustomField", () => {
    it("supprime un champ personnalisé", () => {
      // Créer une entrée avec un champ personnalisé
      const entry = createEntry({
        title: "Mon entrée",
        username: "utilisateur",
        password: "password",
      });

      const field = createCustomField("Champ à supprimer", "Valeur");
      const entryWithField = addCustomField(entry, field);

      // Supprimer le champ
      const fieldId = entryWithField.customFields?.[0].id as string;
      const updatedEntry = removeCustomField(entryWithField, fieldId);

      expect(updatedEntry.customFields).toHaveLength(0);
    });
  });

  describe("validateCustomFieldData", () => {
    it("valide un champ personnalisé correct", () => {
      const data = {
        name: "Champ valide",
        value: "Valeur",
        type: FieldType.TEXT,
      };

      const result = validateCustomFieldData(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("détecte un champ personnalisé invalide", () => {
      const data = {
        name: "", // Nom vide invalide
        value: "Valeur",
        type: FieldType.TEXT,
      };

      const result = validateCustomFieldData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
