import { EntryCategory, Vault, VaultEntry, VaultStats } from "../types";

/**
 * Gets comprehensive statistics about the vault
 * @param vault - Vault to analyze
 * @returns VaultStats object with statistics
 */
export const getVaultStats = (vault: Vault): VaultStats => {
  const now = new Date();

  // Initialiser le compteur de catégories avec toutes les valeurs possibles de l'enum
  const categoryCounts = Object.values(EntryCategory).reduce(
    (acc, category) => {
      acc[category as EntryCategory] = 0;
      return acc;
    },
    {} as Record<EntryCategory, number>
  );

  const tagCounts: Record<string, number> = {};
  const passwords: string[] = [];
  const passwordIds: Record<string, string[]> = {};

  // Date for "old" password calculation (90 days)
  const oldPasswordCutoff = new Date(now);
  oldPasswordCutoff.setDate(oldPasswordCutoff.getDate() - 90);

  let oldPasswords = 0;
  let lastActivity = new Date(0); // Unix epoch start

  // Process each entry
  vault.entries.forEach((entry: VaultEntry) => {
    // Update last activity
    if (entry.updatedAt > lastActivity) {
      lastActivity = new Date(entry.updatedAt);
    }

    // Count by category
    if (entry.category) {
      categoryCounts[entry.category as EntryCategory] += 1;
    } else {
      // Default to LOGIN category if not specified
      categoryCounts[EntryCategory.LOGIN] += 1;
    }

    // Count tags
    if (entry.tags && entry.tags.length > 0) {
      entry.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }

    // Process password for security analysis
    if (entry.password) {
      // Store for duplicate detection
      passwords.push(entry.password);

      if (!passwordIds[entry.password]) {
        passwordIds[entry.password] = [];
      }
      passwordIds[entry.password].push(entry.id);

      // Check for old passwords
      if (entry.updatedAt < oldPasswordCutoff) {
        oldPasswords++;
      }
    }
  });

  // Calculate weak passwords (too short or simple)
  const weakPasswords = passwords.filter(isWeakPassword).length;

  // Calculate duplicate passwords
  const duplicatePasswordsCount = Object.values(passwordIds).filter(
    (ids) => ids.length > 1
  ).length;

  return {
    totalEntries: vault.entries.length,
    categoryCounts,
    tagCounts,
    lastActivity,
    weakPasswords,
    duplicatePasswords: duplicatePasswordsCount,
    oldPasswords,
  };
};

/**
 * Gets entries with weak passwords
 * @param vault - Vault to analyze
 * @returns Array of entries with weak passwords
 */
export const getWeakPasswordEntries = (vault: Vault): VaultEntry[] => {
  return vault.entries.filter(
    (entry: VaultEntry) => entry.password && isWeakPassword(entry.password)
  );
};

/**
 * Gets groups of entries with duplicate passwords
 * @param vault - Vault to analyze
 * @returns Array of entry arrays, each inner array containing entries with the same password
 */
export const getDuplicatePasswordEntries = (vault: Vault): VaultEntry[][] => {
  const passwordMap: Record<string, VaultEntry[]> = {};

  // Group entries by password
  vault.entries.forEach((entry: VaultEntry) => {
    if (entry.password) {
      if (!passwordMap[entry.password]) {
        passwordMap[entry.password] = [];
      }
      passwordMap[entry.password].push(entry);
    }
  });

  // Filter out unique passwords and return groups
  return Object.values(passwordMap).filter((entries) => entries.length > 1);
};

/**
 * Simple password strength check
 * @param password - Password to check
 * @returns Whether the password is considered weak
 */
function isWeakPassword(password: string): boolean {
  // Password is weak if:
  // - Less than 8 characters
  // - Only lowercase letters
  // - Only uppercase letters
  // - Only numbers
  // - Only one character type (letters, numbers, symbols)

  if (password.length < 8) return true;

  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  // Count character types
  const charTypesCount = [
    hasLowerCase,
    hasUpperCase,
    hasNumbers,
    hasSpecial,
  ].filter(Boolean).length;

  // Password is weak if it has only one character type
  return charTypesCount <= 1;
}
