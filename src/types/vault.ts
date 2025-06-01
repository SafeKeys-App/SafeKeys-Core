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

export enum FieldType {
  TEXT = "text",
  PASSWORD = "password",
  EMAIL = "email",
  URL = "url",
  NUMBER = "number",
  DATE = "date",
  TEXTAREA = "textarea",
}

export enum EntryCategory {
  LOGIN = "login",
  SECURE_NOTE = "secure_note",
  CREDIT_CARD = "credit_card",
  IDENTITY = "identity",
  SOFTWARE_LICENSE = "software_license",
  BANK_ACCOUNT = "bank_account",
  OTHER = "other",
}

export interface Vault {
  id: string;
  name: string;
  description?: string;
  entries: VaultEntry[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
  settings?: VaultSettings;
}

export interface VaultSettings {
  passwordGenerator?: PasswordGeneratorSettings;
  security?: SecuritySettings;
  ui?: UISettings;
}

export interface PasswordGeneratorSettings {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  customSymbols?: string;
}

export interface SecuritySettings {
  lockTimeout: number; // en minutes
  requireMasterPasswordOnStart: boolean;
  enableBiometric?: boolean;
  maxFailedAttempts: number;
}

export interface UISettings {
  theme: "light" | "dark" | "auto";
  language: string;
  showFavorites: boolean;
  defaultView: "list" | "grid" | "cards";
}

export interface EncryptedVault {
  data: string; // Données chiffrées
  salt: string; // Salt pour la dérivation de clé
  iv: string; // Vecteur d'initialisation
  version: string;
  metadata?: VaultMetadata;
}

export interface VaultMetadata {
  name: string;
  createdAt: string;
  lastModified: string;
  entryCount: number;
  checksum?: string;
}

// Types pour les opérations
export interface VaultSearchOptions {
  query: string;
  categories?: EntryCategory[];
  tags?: string[];
  favorites?: boolean;
  caseSensitive?: boolean;
}

export interface VaultSearchResult {
  entries: VaultEntry[];
  totalCount: number;
  searchTime: number;
}

export interface VaultStats {
  totalEntries: number;
  categoryCounts: Record<EntryCategory, number>;
  tagCounts: Record<string, number>;
  lastActivity: Date;
  weakPasswords: number;
  duplicatePasswords: number;
  oldPasswords: number;
}

// Types pour l'import/export
export interface ImportResult {
  vault: Vault;
  importedCount: number;
  skippedCount: number;
  errors: ImportError[];
}

export interface ImportError {
  line?: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ExportOptions {
  format: "json" | "csv" | "vault";
  includePasswords: boolean;
  categories?: EntryCategory[];
  encrypted?: boolean;
}

// Types pour la validation
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Constantes
export const VAULT_VERSION = "1.0.0";
export const SUPPORTED_VERSIONS = ["1.0.0"];

export const DEFAULT_VAULT_SETTINGS: VaultSettings = {
  passwordGenerator: {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
  },
  security: {
    lockTimeout: 15,
    requireMasterPasswordOnStart: true,
    maxFailedAttempts: 5,
  },
  ui: {
    theme: "auto",
    language: "en",
    showFavorites: true,
    defaultView: "list",
  },
};

// Types utilitaires
export type CreateVaultEntryData = Omit<
  VaultEntry,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateVaultEntryData = Partial<
  Omit<VaultEntry, "id" | "createdAt">
>;
export type CreateVaultData = Omit<
  Vault,
  "id" | "entries" | "createdAt" | "updatedAt" | "version"
>;
export type UpdateVaultData = Partial<
  Omit<Vault, "id" | "entries" | "createdAt" | "version">
>;
