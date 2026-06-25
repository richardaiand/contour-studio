import crypto from 'crypto';
import { config } from '../config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function hasValidKey() {
  const key = (config.encryptionKey || '').replace(/\s/g, '');
  return key.length === 64 && /^[0-9a-fA-F]+$/.test(key);
}

function getKeyBuffer() {
  const key = (config.encryptionKey || '').replace(/\s/g, '');
  return Buffer.from(key, 'hex');
}

export function encrypt(text) {
  if (!text) return '';
  // If no valid encryption key, store plain text (prefixed so decrypt knows)
  if (!hasValidKey()) {
    return `plain:${text}`;
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKeyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedText) {
  if (!encryptedText) return '';
  // Plain text fallback (no encryption key configured)
  if (encryptedText.startsWith('plain:')) {
    return encryptedText.slice(6);
  }
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) throw new Error('Invalid encrypted value format');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKeyBuffer(),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function sanitizeFilename(name) {
  return String(name).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function now() {
  return Date.now();
}

export function parseJson(json, fallback = null) {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
