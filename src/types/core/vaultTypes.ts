import config from "../../../config.json";
import { VaultEntry } from "./entryTypes";

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

// Constantes importées depuis config.json
export const VAULT_VERSION = config.VAULT_VERSION;
export const SUPPORTED_VERSIONS = config.SUPPORTED_VERSIONS;
export const DEFAULT_VAULT_SETTINGS: VaultSettings =
  config.DEFAULT_VAULT_SETTINGS as VaultSettings;

// Types utilitaires pour les vaults
export type CreateVaultData = Omit<
  Vault,
  "id" | "entries" | "createdAt" | "updatedAt" | "version"
>;

export type UpdateVaultData = Partial<
  Omit<Vault, "id" | "entries" | "createdAt" | "version">
>;
