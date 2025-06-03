import {
  EntryCategory,
  Vault,
  VaultEntry,
  VaultSearchOptions,
  VaultSearchResult,
} from "../../types";

/**
 * Performs a search on vault entries based on provided options
 * @param vault - Vault to search in
 * @param options - Search options
 * @returns Search results with matching entries
 */
export const searchEntries = (
  vault: Vault,
  options: VaultSearchOptions
): VaultSearchResult => {
  const startTime = Date.now();

  // Default options
  const query = options.query || "";
  const caseSensitive = options.caseSensitive || false;
  const exactMatch = options.exactMatch || false;

  // If query is empty and no filters, return all entries
  if (
    !query &&
    !options.categories?.length &&
    !options.tags?.length &&
    options.favorites === undefined
  ) {
    return {
      entries: [...vault.entries],
      totalCount: vault.entries.length,
      searchTime: Date.now() - startTime,
    };
  }

  // Filter function
  const matches = (entry: VaultEntry): boolean => {
    // Category filter
    if (
      options.categories?.length &&
      (!entry.category || !options.categories.includes(entry.category))
    ) {
      return false;
    }

    // Tags filter
    if (options.tags?.length) {
      if (!entry.tags || entry.tags.length === 0) {
        return false;
      }

      // Check if entry has at least one of the required tags
      const hasMatchingTag = entry.tags.some((tag: string) =>
        options.tags?.includes(tag)
      );

      if (!hasMatchingTag) {
        return false;
      }
    }

    // Favorites filter
    if (
      options.favorites !== undefined &&
      entry.favorite !== options.favorites
    ) {
      return false;
    }

    // If no search query, we've passed all filters
    if (!query) {
      return true;
    }

    // Text search logic
    const searchableFields: Array<keyof VaultEntry> = [
      "title",
      "username",
      "url",
      "notes",
    ];

    // Prepare query for case-insensitive search if needed
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    // Function to check if a field matches the query
    const fieldMatches = (fieldValue: string): boolean => {
      if (!fieldValue) return false;

      const normalizedValue = caseSensitive
        ? fieldValue
        : fieldValue.toLowerCase();

      if (exactMatch) {
        return normalizedValue === searchQuery;
      } else {
        return normalizedValue.includes(searchQuery);
      }
    };

    // Check standard fields
    for (const field of searchableFields) {
      const value = entry[field];
      if (typeof value === "string" && fieldMatches(value)) {
        return true;
      }
    }

    // Check tags
    if (entry.tags) {
      for (const tag of entry.tags) {
        if (fieldMatches(tag)) {
          return true;
        }
      }
    }

    // Check custom fields
    if (entry.customFields) {
      for (const field of entry.customFields) {
        if (fieldMatches(field.name) || fieldMatches(field.value)) {
          return true;
        }
      }
    }

    return false;
  };

  // Apply filter to entries
  const matchingEntries = vault.entries.filter(matches);

  return {
    entries: matchingEntries,
    totalCount: matchingEntries.length,
    searchTime: Date.now() - startTime,
  };
};

/**
 * Gets entries by category
 * @param vault - Vault to search in
 * @param category - Category to filter by
 * @returns Array of matching entries
 */
export const getEntriesByCategory = (
  vault: Vault,
  category: EntryCategory
): VaultEntry[] => {
  return vault.entries.filter(
    (entry: VaultEntry) => entry.category === category
  );
};

/**
 * Gets favorite entries
 * @param vault - Vault to search in
 * @returns Array of favorite entries
 */
export const getFavoriteEntries = (vault: Vault): VaultEntry[] => {
  return vault.entries.filter((entry: VaultEntry) => entry.favorite === true);
};

/**
 * Gets recently modified entries
 * @param vault - Vault to search in
 * @param days - Number of days to look back
 * @returns Array of recently modified entries
 */
export const getRecentlyModifiedEntries = (
  vault: Vault,
  days: number = 7
): VaultEntry[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return vault.entries
    .filter((entry: VaultEntry) => entry.updatedAt > cutoffDate)
    .sort(
      (a: VaultEntry, b: VaultEntry) =>
        b.updatedAt.getTime() - a.updatedAt.getTime()
    );
};
