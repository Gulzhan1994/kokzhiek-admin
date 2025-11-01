export interface RegistrationKey {
  keyCode: string;
  role: 'student' | 'teacher' | 'author' | 'admin' | 'school' | 'moderator';
  description: string;
  usedCount: number;
  maxUses?: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
  keyPrefix?: string;
  status?: KeyStatus;
  usedBy?: Array<{
    userId: string;
    usedAt: string;
  }>;
}

export type KeyStatus = 'active' | 'expired' | 'exhausted' | 'inactive';

export interface CreateKeyData {
  role: 'student' | 'teacher' | 'author' | 'admin' | 'school' | 'moderator';
  description: string;
  maxUses?: number;
  expiresAt?: string;
  prefix?: string;
}

export interface BulkCreateData {
  role: string;
  count: number;
  description: string;
  maxUses?: number;
  expiresAt?: string;
  keyPrefix?: string;
}

export interface KeysResponse {
  keys: RegistrationKey[];
  total: number;
  page: number;
  limit: number;
}
