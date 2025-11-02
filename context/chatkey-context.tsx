import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as bip39 from 'bip39';
import { derivePath, getPublicKey } from 'ed25519-hd-key';
import crypto from 'crypto';
import { E2EE_PATH } from '@/lib/constants';

const STORAGE_KEYS = {
  SESSION_KEY: 'session_key',
  CHAT_KEY_BLOB: 'chat_key_blob',
} as const;
const MIN_PASSWORD_LENGTH = 8;

export const encryptKey = (privateKey: Buffer, password: string): string => {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(password, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([cipher.update(privateKey), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Returns JSON string with hex-encoded buffers
  return JSON.stringify({
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex'),
  });
};

export const decryptKey = (encryptedKeyBlob: string, password: string): Buffer => {
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

    const key = crypto.scryptSync(password, salt, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'hex')),
      decipher.final(),
    ]);
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt key: Invalid password or corrupted data');
  }
};

interface ChatKeyContextValue {
  privateKey: Buffer | null;
  publicKey: Buffer | null;
  isLocked: boolean;
  keyExists: boolean;
  error: string | null;
  unLockKeys: (localPassword: string) => Promise<{ success: boolean; message: string }>;
  lockKeys: () => Promise<{ success: boolean; message: string }>;
  createKeys: (localPassword: string) => Promise<{ success: boolean; mnemonic?: string; message: string }>;
}

const ChatKeyContext = createContext<ChatKeyContextValue | undefined>(undefined);

export const ChatKeyProvider = ({ children }: { children: ReactNode }) => {
  
  const [isLocked, setIsLocked] = useState(true);
  const [keyExists, setKeyExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<Buffer | null>(null);
  const [privateKey, setPrivateKey] = useState<Buffer | null>(null);
  const [encryptedKeyBlob, setEncryptedKeyBlob] = useState<string | null>(null);

  useEffect(() => {
    const sessionKeyHex = sessionStorage.getItem(STORAGE_KEYS.SESSION_KEY);
    const storedKeyBlob = localStorage.getItem(STORAGE_KEYS.CHAT_KEY_BLOB);

    switch (true) {
      case !!sessionKeyHex:
        setError(null);
        setPrivateKey(Buffer.from(sessionKeyHex, 'hex'));
        setPublicKey(getPublicKey(Buffer.from(sessionKeyHex, 'hex')));
        setIsLocked(false);
        setKeyExists(true);
        break;
      case !!storedKeyBlob:
        setIsLocked(true);  
        setKeyExists(true);
        setEncryptedKeyBlob(encryptedKeyBlob);
        break;
      default:
        setKeyExists(false);
        setIsLocked(true);
    }
  }, []);

  const unLockKeys = useCallback(async (localPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      setError(null);

      if (!localPassword || localPassword.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
      }

      if (!encryptedKeyBlob) {
        throw new Error('No encrypted key found. Please create keys first.');
      }

      const decryptedPrivateKey = decryptKey(encryptedKeyBlob, localPassword);
      sessionStorage.setItem(STORAGE_KEYS.SESSION_KEY, decryptedPrivateKey.toString('hex'));

      setPrivateKey(decryptedPrivateKey);
      setPublicKey(getPublicKey(decryptedPrivateKey));
      setError(null);
      setKeyExists(true);
      setIsLocked(false);

      return { success: true, message: 'Keys unlocked successfully' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlock keys';
      console.error('Unlock keys error:', err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [encryptedKeyBlob]);

  const createKeys = useCallback(async (localPassword: string): Promise<{ success: boolean; mnemonic?: string; message: string }> => {
    try {
      setError(null);

      if (!localPassword || localPassword.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
      }

      const mnemonic = bip39.generateMnemonic(128);
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const { key: chatPrivateKey } = derivePath(E2EE_PATH, seed.toString('hex'));

      const encryptedBlob = encryptKey(chatPrivateKey, localPassword);
      localStorage.setItem(STORAGE_KEYS.CHAT_KEY_BLOB, encryptedBlob);

      setPrivateKey(chatPrivateKey);
      setPublicKey(getPublicKey(chatPrivateKey));
      setEncryptedKeyBlob(encryptedBlob);
      setKeyExists(true);
      setIsLocked(false);

      return {
        success: true,
        mnemonic,
        message: 'Please save your mnemonic in a safe place. If you forget your mnemonic, you will never be able to decrypt your messages.',
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create keys';
      console.error('Create keys error:', err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, []);

  const lockKeys = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      setError(null);

      // Clear session storage but keep encrypted blob in localStorage
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_KEY);
      setPrivateKey(null);
      setPublicKey(null);
      setIsLocked(true);

      // Note: encryptedKeyBlob and keyExists remain true since the encrypted key still exists
      // Only clear them if you want to fully delete the keys
      
      return { success: true, message: 'Keys locked successfully' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lock keys';
      console.error('Lock keys error:', err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, []);

  const values = {
    privateKey,
    publicKey,
    isLocked,
    keyExists,
    error,
    unLockKeys,
    lockKeys,
    createKeys,
  };

  return <ChatKeyContext.Provider value={values}>{children}</ChatKeyContext.Provider>;
}

export const useChatKey = () => {
  const context: ChatKeyContextValue | undefined = useContext(ChatKeyContext);
  if (!context) throw new Error('useChatKey must be used within ChatKeyProvider');
  return context;
};