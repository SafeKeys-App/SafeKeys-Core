/**
 * Polyfill pour l'API Web Crypto dans des environnements Node.js
 * Cela garantit que l'objet crypto est disponible partout
 */

// Vérifie si nous sommes dans un environnement Node.js et si crypto n'est pas défini globalement
if (typeof globalThis.crypto === "undefined") {
  try {
    // Importe le module 'node:crypto' et le module 'node:crypto' avec webcrypto
    const nodeCrypto = require("node:crypto");

    // Assigne le webcrypto de Node.js à l'objet global
    // @ts-ignore
    globalThis.crypto = nodeCrypto.webcrypto;

    console.log("Node.js crypto polyfill applied");
  } catch (error) {
    console.error("Failed to load crypto polyfill:", error);
    throw new Error(
      "Web Crypto API is required but not available in this environment."
    );
  }
}

export {};
