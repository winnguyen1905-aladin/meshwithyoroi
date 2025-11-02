import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import nacl from 'tweetnacl';
import * as bip39 from 'bip39';
import { derivePath, getPublicKey } from 'ed25519-hd-key';
import crypto from 'crypto';
import { E2EE_PATH } from '@/lib/constants';

export const encryptKey = (privateKey: Buffer, password: string) => {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(password, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([cipher.update(privateKey), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Trả về JSON, chuyển Buffer thành string (hex) để lưu
  return JSON.stringify({
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex'),
  });
};

export const decryptKey = (encryptedKeyBlob: string, password: string) => {
  // Parse JSON string
  const { encrypted, iv, salt, tag } = JSON.parse(encryptedKeyBlob);

  // Chuyển hex strings về lại Buffer
  const key = crypto.scryptSync(password, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  // Giải mã
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(),
  ]);
  return decrypted; // Trả về Buffer
};
// --- Kết thúc các hàm helper ---

const ChatKeyContext = createContext<any>(undefined);

export const ChatKeyProvider = ({ children }: { children: ReactNode }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [keyExists, setKeyExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<Buffer | null>(null);
  const [privateKey, setPrivateKey] = useState<Buffer | null>(null);
  const [encryptedKeyBlob, setEncryptedKeyBlob] = useState<string | null>(null);

  useEffect(() => {
    const sessionKeyHex = sessionStorage.getItem('session_key');
    const encryptedKeyBlob = localStorage.getItem('chat_key_blob');

    switch (true) {
      case !!sessionKeyHex:
        importKeys(Buffer.from(sessionKeyHex, 'hex'));
        break;
      case !!encryptedKeyBlob:
        setIsLocked(true);  
        setKeyExists(true);
        setEncryptedKeyBlob(encryptedKeyBlob);
        break;
      default:
        setKeyExists(false);
        setIsLocked(true);
    }
  }, []);

  const unLockKeys = useCallback(async (localPassword: string) => {
    try {
      if (!localPassword || localPassword.length < 8 || !encryptedKeyBlob) 
        throw new Error('Local password and encrypted key blob are required');
      const privateKey = decryptKey(encryptedKeyBlob, localPassword);
      setPrivateKey(privateKey);
      setPublicKey(getPublicKey(privateKey));
      setKeyExists(true);
      setIsLocked(false);
      return { success: true, message: 'Keys unlocked successfully' };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load key pair');
    }
  }, []);

  const importKeys = (pkBuffer: Buffer) => {
    try {
      if (!pkBuffer) throw new Error('Private key buffer is required');
      setPrivateKey(pkBuffer);
      setPublicKey(getPublicKey(pkBuffer));
      setKeyExists(true);
      setIsLocked(false);
      return { success: true, message: 'Keys imported successfully' };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to import keys');
    }
  }

  const createKeys = useCallback(async (localPassword: string) => {
    try {
      if (!localPassword || localPassword.length < 8) throw new Error('Local password and encrypted key blob are required');

      const mnemonic = bip39.generateMnemonic(128);
      const seed = bip39.mnemonicToSeedSync(mnemonic);

      const { key: chatPrivateKey, chainCode } = derivePath(E2EE_PATH, seed.toString('hex'));

      // Đây chính là cặp khóa E2EE của người dùng
      const encryptedKeyBlob = encryptKey(chatPrivateKey, localPassword);
      localStorage.setItem('chat_key_blob', JSON.stringify(encryptedKeyBlob));

      setError(null);
      setIsLocked(false);
      setKeyExists(true);
      setPrivateKey(chatPrivateKey);
      setEncryptedKeyBlob(JSON.stringify(encryptedKeyBlob));
      setPublicKey(getPublicKey(chatPrivateKey));
      return { success: true, mnemonic, message: 'Pls save your mnemonic in a safe place if you forget your mnemonic you will never be able to decrypt your messages' };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create key');
    }
  }, []);

  const lockKeys = useCallback(async () => {
    try {
      if (!encryptedKeyBlob) throw new Error('No encrypted key blob found');
      localStorage.removeItem('chat_key_blob');
      setError(null);
      setPrivateKey(null);
      setPublicKey(null);
      setKeyExists(false);
      setIsLocked(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to lock keys');
    }
  }, []);

  const value = {
    privateKey,
    publicKey,
    isLocked,
    keyExists,
    error,
    unLockKeys,
    lockKeys,
    createKeys,
  };

  return <ChatKeyContext.Provider value={value}>{children}</ChatKeyContext.Provider>;
}