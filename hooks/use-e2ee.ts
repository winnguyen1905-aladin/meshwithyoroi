import { useChatKey } from "@/context/chatkey-context";
import { useCallback, useState } from "react";
import nacl from 'tweetnacl';

export const useChatE2ee = () => {

  const { privateKey } = useChatKey();

  const encodeMessage = useCallback((message: string, theirPublicKey: Buffer): { encrypted: Uint8Array, nonce: Uint8Array } => {
    const nonce = nacl.randomBytes(24);
    if (!privateKey) throw new Error('Private key not found');
    const encrypted = nacl.box(new TextEncoder().encode(message), nonce, theirPublicKey, privateKey);
    return { encrypted, nonce };
  }, [privateKey]);

  const decodeMessage = useCallback((encryptedMessage: string, theirPublicKey: Buffer, nonce: Uint8Array | string): Uint8Array | null => {
    if (!privateKey) throw new Error('Private key not found');
    // encryptedMessage is base64-encoded; decode to bytes
    const ciphertext = Buffer.from(encryptedMessage, 'base64');
    // nonce may be provided as base64 string or bytes; normalize to bytes
    const nonceBytes = typeof nonce === 'string' ? Buffer.from(nonce, 'base64') : nonce;
    const decrypted = nacl.box.open(ciphertext, nonceBytes, theirPublicKey, privateKey);
    return decrypted;
  }, [privateKey]);

  return {
    encodeMessage,
    decodeMessage
  }
}