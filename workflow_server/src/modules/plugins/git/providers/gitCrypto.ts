import crypto from 'crypto';

const SECRET_KEY = process.env.GIT_PLUGIN_SECRET_KEY || 'antigravity-git-plugin-secret-key-32b';
const ALGORITHM = 'aes-256-cbc';

function getDerivedKey(): Buffer {
  return crypto.scryptSync(SECRET_KEY, 'antigravity-salt-2026', 32);
}

export function encryptGitToken(plainToken: string): string {
  if (!plainToken) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getDerivedKey(), iv);
  let encrypted = cipher.update(plainToken, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptGitToken(encryptedToken: string): string {
  if (!encryptedToken) return '';
  try {
    const parts = encryptedToken.split(':');
    if (parts.length !== 2) return '';
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getDerivedKey(), iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt Git token:', err);
    return '';
  }
}

export function maskGitToken(token: string): string {
  if (!token) return '';
  if (token.length <= 8) return '********';
  const prefix = token.slice(0, 4);
  const suffix = token.slice(-4);
  return `${prefix}************${suffix}`;
}
