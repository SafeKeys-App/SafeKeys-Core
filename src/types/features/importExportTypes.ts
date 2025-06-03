import { EntryCategory } from "../core/categoryTypes";
import { Vault } from "../core/vaultTypes";

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
