export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}

export interface EncryptedFileResult {
  fileName: string;
  originalSize: number;
  encryptedBlob: Blob;
  iv: string; 
  key: string; 
  hash: string; 
  timestamp: string;
}

export interface Version {
  versionNumber: number;
  fileName: string;
  fileUrl: string;
  hash: string;
  iv: string;
  createdAt: any;
}

export interface Collaborator {
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  addedAt: string;
  status: 'online' | 'offline' | 'busy';
  lastActive?: string;
}

export interface Invention {
  id: string;
  userId: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string; // Firebase Storage URL
  hash: string; // SHA-256
  iv: string; // Store IV to allow decryption (User must provide Key)
  license: string;
  createdAt: any; // Timestamp
  
  // Security
  accessHash?: string; // SHA-256 hash of the user-set password for this specific file

  // Blockchain
  blockchainTxHash?: string;
  blockchainTimestamp?: string;
  
  // Version Control
  versions?: Version[];
  
  // Marketplace
  isPublic?: boolean;
  price?: number;
  
  // Collaboration
  collaborators?: Collaborator[];
  
  // Sharing
  sharedId?: string;
}

export interface VaultItem {
  id: string;
  userId: string;
  fileId: string;
  fileName: string;
  fileHash: string; // The fingerprint
  encryptedPassword: string; // PBKDF2 Encrypted text
  iv: string; // IV for the password decryption
  createdAt: any;
}

export type RewriteMode = 'creative' | 'grammar' | 'professional' | 'academic' | 'auto-correct' | 'business-pitch' | 'technical-plan' | 'market-ready';

export interface HistoryItem {
  id: string;
  type: 'encryption' | 'rewrite' | 'classify';
  summary: string;
  timestamp: string;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  status: 'idle' | 'encrypting' | 'uploading' | 'success' | 'error';
  progress: number; // 0 to 100
  speed: number;
  eta: number;
  resultKey?: string; // The encryption key to show user
  resultHash?: string;
  errorMsg?: string;
}