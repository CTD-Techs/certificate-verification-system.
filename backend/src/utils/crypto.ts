import crypto from 'crypto';
import bcrypt from 'bcrypt';
import config from '../config';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.security.bcryptRounds);
};

/**
 * Compare a password with a hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a SHA-256 hash of a string
 */
export const sha256 = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a random token
 */
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash sensitive data (for PII protection)
 */
export const hashSensitiveData = (data: string): string => {
  return sha256(data.toLowerCase().trim());
};

/**
 * Generate hash chain for audit logs
 */
export const generateAuditHash = (
  data: Record<string, any>,
  previousHash?: string
): string => {
  const dataString = JSON.stringify(data);
  const combined = previousHash ? `${previousHash}:${dataString}` : dataString;
  return sha256(combined);
};

/**
 * Verify audit chain integrity
 */
export const verifyAuditChain = (
  currentHash: string,
  data: Record<string, any>,
  previousHash?: string
): boolean => {
  const expectedHash = generateAuditHash(data, previousHash);
  return currentHash === expectedHash;
};