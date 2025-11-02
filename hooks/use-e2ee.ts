import { useCallback, useEffect, useState } from "react";
import * as bip39 from 'bip39';
import nacl from 'tweetnacl';
import { derivePath, getPublicKey } from 'ed25519-hd-key';
import { E2EE_PATH } from "@/lib/constants";
import crypto from 'crypto';

export const useChatE2ee = () => {
  const [nonce, setNonce] = useState<Uint8Array>(nacl.randomBytes(24));
  const [privateKey, setPrivateKey] = useState<Buffer | null>(null);

  useEffect(() => {
    const encryptedKeyBlob = localStorage.getItem('chat_key_blob');
    if (encryptedKeyBlob) {
      const encrypted = decryptKey(encryptedKeyBlob, getLocalPassword());
      setPrivateKey(encrypted);
    }
  }, []);

  const encodeMessage = useCallback((message: string, theirPublicKey: Buffer) => {
    if (!privateKey) throw new Error('Private key not found');
    const encrypted = nacl.box(new TextEncoder().encode(message), nonce, theirPublicKey, privateKey);
    setNonce(nacl.randomBytes(24));
    return encrypted;
  }, [privateKey]);

  const decodeMessage = useCallback((encryptedMessage: string, theirPublicKey: Buffer) => {
    if (!privateKey) throw new Error('Private key not found');
    const decrypted = nacl.box.open(Buffer.from(encryptedMessage), nonce, theirPublicKey, privateKey);
    return decrypted;
  }, [privateKey]);

  return {
    encodeMessage,
    decodeMessage,
  }
}

export const useCreateE2EEKey = () => {

  const [error, setError] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<Uint8Array | null>(null);
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);  

  const createKey = useCallback(async (localPassword: string) => {
    try {

      if (!localPassword) throw new Error('Local password is required');
      const mnemonic = bip39.generateMnemonic(128);
      const seed = bip39.mnemonicToSeedSync(mnemonic);

      const { key: chatPrivateKey, chainCode } = derivePath(E2EE_PATH, seed.toString('hex'));
      // Đây chính là cặp khóa E2EE của người dùng 
      const encryptedKeyBlob = encryptKey(chatPrivateKey, localPassword);
      localStorage.setItem('chat_key_blob', JSON.stringify(encryptedKeyBlob));

      setMnemonic(mnemonic);
      setPrivateKey(chatPrivateKey);
      setPublicKey(getPublicKey(chatPrivateKey));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create key');
    }
  }, []);

  return {
    error,
    mnemonic,
    createKey,
    publicKey,
    privateKey
  }
}

export const useGetE2EEKey = () => {
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<Uint8Array | null>(null);
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);
  const [encryptedKeyBlob, setEncryptedKeyBlob] = useState<string | null>(null);

  useEffect(() => {
    const encryptedKeyBlob = localStorage.getItem('chat_key_blob');
    if (encryptedKeyBlob) {
      setEncryptedKeyBlob(encryptedKeyBlob);
    }
  }, []);
}

// export const getLocalPassword = (): string => {
//   const password = window.secret['local_password'];
//   if (!password) throw new Error('Password not found');
//   return password;
// }

// export const encryptKey = (privateKey: Uint8Array, password: string): { encrypted: Buffer, iv: Buffer, salt: Buffer, tag: Buffer } => {
//   const salt = crypto.randomBytes(16);
//   const iv = crypto.randomBytes(12);
//   const key = crypto.scryptSync(password, salt, 32);
//   const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
//   let encrypted = cipher.update(privateKey);
//   encrypted = Buffer.concat([encrypted, cipher.final()]);
//   const tag = cipher.getAuthTag();
//   return { encrypted, iv, salt, tag };
// }

// export const decryptKey = (encryptedKeyBlob: string, password: string): Buffer => {
//   const { encrypted, iv, salt, tag } = JSON.parse(encryptedKeyBlob);
//   const key = crypto.scryptSync(password, salt, 32);
//   const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
//   decipher.setAuthTag(tag);
//   let decrypted = decipher.update(encrypted);
//   decrypted = Buffer.concat([decrypted, decipher.final()]);
//   return decrypted;
// }