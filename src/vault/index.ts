/**
 * Vault Manager
 *
 * This module serves as a facade for all vault-related operations.
 * It re-exports all specific functionalities from dedicated modules.
 */

// Re-export core vault operations
export * from "./core";

// Re-export entry operations
export * from "./entries";

// Re-export import/export operations
export * from "./io";

// Re-export analysis operations (search & stats)
export * from "./analysis";
