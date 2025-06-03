import { EntryCategory } from "../core/categoryTypes";
import { VaultEntry } from "../core/entryTypes";

export interface VaultSearchOptions {
  query: string;
  categories?: EntryCategory[];
  tags?: string[];
  favorites?: boolean;
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

export interface VaultSearchResult {
  entries: VaultEntry[];
  totalCount: number;
  searchTime: number;
}
