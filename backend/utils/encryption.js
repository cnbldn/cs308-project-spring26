const crypto = require('crypto');

const ENCRYPTION_PREFIX = 'enc:v1:';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const getEncryptionKey = () => {
  const secret =
    process.env.FIELD_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.MONGO_URI ||
    'cs308-development-field-encryption-key';

  return crypto.createHash('sha256').update(secret).digest();
};

const isEncrypted = (value) =>
  typeof value === 'string' && value.startsWith(ENCRYPTION_PREFIX);

const encryptField = (value) => {
  if (value === undefined || value === null || value === '') return value;
  if (isEncrypted(value)) return value;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
};

const decryptField = (value) => {
  if (!isEncrypted(value)) return value;

  try {
    const [, , ivBase64, authTagBase64, encryptedBase64] = value.split(':');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      Buffer.from(ivBase64, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedBase64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch (error) {
    return value;
  }
};

module.exports = {
  decryptField,
  encryptField,
  isEncrypted,
};
