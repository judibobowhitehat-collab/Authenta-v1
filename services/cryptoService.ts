import { EncryptedFileResult } from "../types";

// Convert ArrayBuffer to Hex String
const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const hexToBuffer = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

// Import a raw key for AES-GCM
const importKey = (rawKey: ArrayBuffer) => {
  return window.crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
};

export const encryptFile = async (file: File): Promise<EncryptedFileResult> => {
  const buffer = await file.arrayBuffer();

  // 1. Generate SHA-256 Hash of the original file (The "Fingerprint")
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hash = bufferToHex(hashBuffer);

  // 2. Generate a random AES-GCM key (256-bit)
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );

  // 3. Export the key so we can give it to the user (as a hex string for this demo)
  const exportedKeyBuffer = await window.crypto.subtle.exportKey("raw", key);
  const exportedKey = bufferToHex(exportedKeyBuffer);

  // 4. Encrypt the file
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    buffer
  );

  // 5. Create blob
  const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });

  return {
    fileName: file.name,
    originalSize: file.size,
    encryptedBlob,
    iv: bufferToHex(iv.buffer),
    key: exportedKey,
    hash,
    timestamp: new Date().toISOString()
  };
};

// --- TEXT ENCRYPTION FOR VAULT (PBKDF2 + AES-GCM) ---

const getDerivationKey = async (password: string, salt: Uint8Array) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptText = async (text: string, masterPassword: string) => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getDerivationKey(masterPassword, salt);
  const enc = new TextEncoder();

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );

  // Format: salt(32hex) + iv(24hex) + ciphertext
  return bufferToHex(salt.buffer) + bufferToHex(iv.buffer) + bufferToHex(encrypted);
};

export const decryptText = async (encryptedHex: string, masterPassword: string) => {
  try {
    const saltHex = encryptedHex.slice(0, 32);
    const ivHex = encryptedHex.slice(32, 56);
    const dataHex = encryptedHex.slice(56);

    const salt = hexToBuffer(saltHex);
    const iv = hexToBuffer(ivHex);
    const data = hexToBuffer(dataHex);

    const key = await getDerivationKey(masterPassword, salt);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (e) {
    throw new Error("Incorrect Password or Corrupted Data");
  }
};