export interface VaultEntry {
  id: string;
  title: string;
  username?: string;
  password?: string;
  note?: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Vault {
  version: string;
  entries: VaultEntry[];
}
