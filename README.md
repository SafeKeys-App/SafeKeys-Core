# SafeKeys-Core

[![npm version](https://badge.fury.io/js/safekeys-core.svg)](https://badge.fury.io/js/safekeys-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)](https://github.com/SafeKeys-App/SafeKeys-Core)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/SafeKeys-App/SafeKeys-Core)
[![Downloads](https://img.shields.io/npm/dm/safekeys-core.svg)](https://www.npmjs.com/package/safekeys-core)

> 🔐 **TypeScript/JavaScript encryption library for SafeKeys ecosystem** — Cross-platform password management core

## 🛡️ SafeKeys — Sovereign, Simple & Open Source Password Manager

Welcome to **SafeKeys-Core** — the heart of the SafeKeys ecosystem. This TypeScript library provides secure encryption/decryption functionality used across all SafeKeys platforms (React Native, Next.js, Chrome Extension, Electron...).

---

## 🔐 Our Mission

At SafeKeys, we believe in **simple**, **educational**, and **sovereign** credential management. Our goal: to offer a modern and transparent alternative to traditional password managers.

---

## 🌍 Why SafeKeys?

🔸 **Open source**: all our code is public, auditable, and contributory  
🔸 **Zero forced cloud**: you remain in control of your data  
🔸 **Local encryption**: military-grade security (AES-256-GCM)  
🔸 **Multi-platform**: mobile, browser, desktop  
🔸 **UX accessible to everyone**: whether you're tech-savvy or not  
🔸 **No data collection**: never, nowhere

---

## 📦 Ecosystem Components

| Project                                                                    | Description                                                                    |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`safekeys-core`](https://github.com/SafeKeys-App/SafeKeys-Core)           | **TypeScript encryption/decryption library** used across all platforms         |
| [`safekeys-mobile`](https://github.com/SafeKeys-App/SafeKeys-Mobile)       | Mobile app (React Native + Expo) to manage your passwords locally              |
| [`safekeys-web`](https://github.com/SafeKeys-App/SafeKeys-Web)             | Web application (React + Next) to manage your passwords                        |
| [`safekeys-extension`](https://github.com/SafeKeys-App/safekeys-Extension) | Chrome extension (Vite + React) to access your encrypted data from the browser |
| [`safekeys-desktop`](https://github.com/SafeKeys-App/safekeys-Desktop)     | Electron application (coming soon) to read/write your `.vault` file on desktop |
| [`safekeys-docs`](https://github.com/SafeKeys-App/safekeys-Docs)           | Technical documentation, architecture guide, security and contribution         |

---

## 🚀 Quick Start

### Installation

```bash
npm install safekeys-core
# or
yarn add safekeys-core
# or
pnpm add safekeys-core
```

### Basic Usage

```typescript
import { encryptVault, decryptVault } from "safekeys-core";

// Encrypt sensitive data
const masterPassword = "your-secure-master-password";
const sensitiveData = JSON.stringify({
  username: "john",
  password: "secret123",
});

const encrypted = await encryptVault(sensitiveData, masterPassword);
console.log("Encrypted:", encrypted);

// Decrypt data
const decrypted = await decryptVault(encrypted, masterPassword);
console.log("Decrypted:", decrypted);
```

---

## 🔧 Tech Stack

- `TypeScript` • `WebCrypto API` • `PBKDF2` • `AES-256-GCM`
- `Vitest` • `crypto-aes-gcm` • Cross-platform compatibility

---

## 🏗️ Development

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/SafeKeys-App/SafeKeys-Core.git
cd SafeKeys-Core

# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build

# Run tests with coverage
npm run test:coverage
```

### Project Structure

```
src/
├── crypto/
│   ├── encryption.ts          # Main encryption/decryption functions
│   └── keyDerivation.ts       # PBKDF2 key derivation
├── types/
│   ├── vault.ts              # TypeScript interfaces and types
│   └── crypto-aes-gcm.d.ts   # Type declarations
├── vault/                    # Vault management (coming soon)
├── utils/                    # Utility functions (coming soon)
└── index.ts                  # Main entry point

__test__/
├── encryption.test.ts        # Encryption tests
└── ...                       # Additional test files
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

---

## 📚 API Documentation

### Core Functions

#### `encryptVault(plainText: string, password: string): Promise<string>`

Encrypts sensitive data using AES-256-GCM with PBKDF2 key derivation.

#### `decryptVault(cipherText: string, password: string): Promise<string>`

Decrypts data encrypted with `encryptVault`.

### Types

See [`src/types/vault.ts`](./src/types/vault.ts) for complete TypeScript definitions.

---

## 🔒 Security

- **AES-256-GCM**: Authenticated encryption with associated data
- **PBKDF2**: Key derivation with 100,000 iterations and SHA-256
- **WebCrypto API**: Browser-native cryptographic operations
- **Zero dependencies**: Minimal attack surface
- **Cross-platform**: Works in browsers, Node.js, React Native

---

## ✨ Contributing

SafeKeys is a project **open to everyone**:

- 🚀 Want to contribute? [Read our contribution guidelines](https://github.com/SafeKeys-App/safekeys-docs)
- 🐛 Found a bug? [Open an issue](https://github.com/SafeKeys-App/SafeKeys-Core/issues)
- 💬 Have an idea? Let's discuss it in the repo discussions

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🧠 Long-term Vision

We want to create **the simplest and most sovereign password manager on the market**, respecting your digital freedoms while remaining accessible to everyone, including non-technical people.

---

## 📫 Contact

- 🌐 [Official website (coming soon)](https://safekeys.org)
- 🐦 Twitter: [@SafeKeysApp](https://twitter.com/SafeKeysApp) (coming soon)
- 📧 Email: [contact@safekeys.org](mailto:contact@safekeys.org)

---

> ✊ **Take back control of your data. Use SafeKeys.**

---

## 🙏 Acknowledgments

- Thanks to all contributors who help make SafeKeys better
- Inspired by the open-source community's commitment to privacy and security
- Built with ❤️ for digital sovereignty
