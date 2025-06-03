import { EntryCategory } from "./categoryTypes";
import { VaultEntry } from "./entryTypes";

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
