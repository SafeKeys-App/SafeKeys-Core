/**
 * Vault Manager
 *
 * This module serves as a facade for all vault-related operations.
 * It re-exports all specific functionalities from dedicated modules.
 */

// Re-export entry operations
export * from "./entry";

// Re-export custom field operations
export * from "./customFields";

// Re-export vault operations
export * from "./vault";

// Re-export search operations
export * from "./search";

// Re-export stats operations
export * from "./stats";

// Re-export bulk operations
export * from "./bulk";
