import { z } from "zod";

/**
 * Schéma pour valider le format du fichier vault importé
 */
export const vaultFileSchema = z.object({
  data: z.string(),
  salt: z.string(),
  iv: z.string(),
  version: z.string(),
  metadata: z
    .object({
      name: z.string(),
      createdAt: z.string(),
      lastModified: z.string(),
      entryCount: z.number(),
      checksum: z.string().optional(),
    })
    .optional(),
});

/**
 * Schéma pour valider le format CSV minimum requis
 */
export const csvHeadersSchema = z.object({
  headers: z.array(z.string()).refine((headers) => headers.includes("title"), {
    message: "CSV must contain at least a 'title' column",
  }),
});
