import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 32 bytes = 256 bits

// Get encryption key from environment
// Should be a 64-character hex string (32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required. Generate with: openssl rand -hex 32');
}

// Convert hex string to buffer
let keyBuffer: Buffer;
try {
  keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH * 2} characters (${KEY_LENGTH} bytes)`);
  }
} catch (error) {
  throw new Error(`Invalid ENCRYPTION_KEY format. Expected hex string of length ${KEY_LENGTH * 2}`);
}

/**
 * Encrypts a string using AES-256-GCM
 * @param text Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encrypted
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty string');
  }

  const iv = crypto.randomBytes(16); // 16 bytes for AES
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with encrypt()
 * @param encryptedText Encrypted string in format: iv:authTag:encrypted
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty string');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected: iv:authTag:encrypted');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}


