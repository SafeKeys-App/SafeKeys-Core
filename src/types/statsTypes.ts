import { EntryCategory } from "./categoryTypes";

export interface VaultStats {
  totalEntries: number;
  categoryCounts: Record<EntryCategory, number>;
  tagCounts: Record<string, number>;
  lastActivity: Date;
  weakPasswords: number;
  duplicatePasswords: number;
  oldPasswords: number;
}
