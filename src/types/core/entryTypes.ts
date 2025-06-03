import { FieldType } from "../utils/fieldTypes";
import { EntryCategory } from "./categoryTypes";

export interface VaultEntry {
  id: string;
  title: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  favorite?: boolean;
  category?: EntryCategory;
  customFields?: CustomField[];
}

export interface CustomField {
  id: string;
  name: string;
  value: string;
  type: FieldType;
  hidden?: boolean;
}

// Types utilitaires pour les entrées
export type CreateVaultEntryData = Omit<
  VaultEntry,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateVaultEntryData = Partial<
  Omit<VaultEntry, "id" | "createdAt">
>;
