import * as scrypt from 'scrypt-js';

export const encryptKey = async (privateKey: Buffer, password: string): Promise<string> => {
  // Generate random salt and IV using Web Crypto API
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  // Derive key using scrypt-js (async)
  const passwordBuffer = new TextEncoder().encode(password);
  const keyBuffer = await scrypt.scrypt(passwordBuffer, salt, 16384, 8, 1, 32);
  // Ensure we have a proper Uint8Array for crypto.subtle
  const key = new Uint8Array(keyBuffer);

  // Convert privateKey Buffer to Uint8Array
  const privateKeyArray = new Uint8Array(privateKey);

  // Import key for AES-GCM encryption
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt using Web Crypto API
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    cryptoKey,
    privateKeyArray
  );

  // Extract the tag (last 16 bytes of encrypted data)
  const encryptedArray = new Uint8Array(encrypted);
  const tag = encryptedArray.slice(-16);
  const encryptedData = encryptedArray.slice(0, -16);

  // Returns JSON string with hex-encoded buffers
  return JSON.stringify({
    encrypted: Buffer.from(encryptedData).toString('hex'),
    iv: Buffer.from(iv).toString('hex'),
    salt: Buffer.from(salt).toString('hex'),
    tag: Buffer.from(tag).toString('hex'),
  });
};

export const decryptKey = async (encryptedKeyBlob: string, password: string): Promise<Buffer> => {
  try {
    // Handle double-stringified JSON (for backward compatibility)
    let parsed: { encrypted: string; iv: string; salt: string; tag: string };
    try {
      parsed = JSON.parse(encryptedKeyBlob);
    } catch {
      // Try parsing again in case it's double-stringified
      parsed = JSON.parse(JSON.parse(encryptedKeyBlob));
    }

    const { encrypted, iv, salt, tag } = parsed;

    // Convert hex strings to Uint8Arrays
    const saltArray = new Uint8Array(Buffer.from(salt, 'hex'));
    const ivArray = new Uint8Array(Buffer.from(iv, 'hex'));
    const encryptedArray = new Uint8Array(Buffer.from(encrypted, 'hex'));
    const tagArray = new Uint8Array(Buffer.from(tag, 'hex'));

    // Derive key using scrypt-js (async)
    const passwordBuffer = new TextEncoder().encode(password);
    const keyBuffer = await scrypt.scrypt(passwordBuffer, saltArray, 16384, 8, 1, 32);
    // Ensure we have a proper Uint8Array for crypto.subtle
    const key = new Uint8Array(keyBuffer);

    // Combine encrypted data with tag (Web Crypto API expects tag appended)
    const encryptedWithTag = new Uint8Array(encryptedArray.length + tagArray.length);
    encryptedWithTag.set(encryptedArray);
    encryptedWithTag.set(tagArray, encryptedArray.length);

    // Import key for AES-GCM decryption
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt using Web Crypto API
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray,
        tagLength: 128,
      },
      cryptoKey,
      encryptedWithTag
    );

    return Buffer.from(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt key: Invalid password or corrupted data');
  }
};

