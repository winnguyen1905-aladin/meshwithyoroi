import { useChatKey } from "@/context/chatkey-context";
import { useCallback, useState } from "react";
import nacl from 'tweetnacl';

// helpers
const toUint8 = (input: Buffer | Uint8Array): Uint8Array => (input instanceof Uint8Array ? input : new Uint8Array(input));
const fromBase64ToUint8 = (b64: string): Uint8Array => new Uint8Array(Buffer.from(b64, 'base64'));
const assertKeyLen = (key: Uint8Array, expected: number, label: string) => {
  if (key.length !== expected) throw new Error(`${label} must be ${expected} bytes, got ${key.length}`);
};

export const useChatE2ee = () => {
  
  const { privateKey } = useChatKey();

  const encodeMessage = useCallback((message: string, theirPublicKey: Buffer): { encrypted: Uint8Array; nonce: Uint8Array } => {
    if (!privateKey) throw new Error('Private key not found');
    const ourSecretKey = toUint8(privateKey);
    const peerPublicKey = toUint8(theirPublicKey);
    assertKeyLen(ourSecretKey, 32, 'Private key');
    assertKeyLen(peerPublicKey, 32, 'Peer public key');

    const nonce = nacl.randomBytes(24);
    const plaintext = new TextEncoder().encode(message);
    const encrypted = nacl.box(plaintext, nonce, peerPublicKey, ourSecretKey);
    return { encrypted, nonce };
  }, [privateKey]);

  const decodeMessage = useCallback((encryptedMessage: string, theirPublicKey: Buffer, nonce: Uint8Array | string): Uint8Array | null => {
    if (!privateKey) throw new Error('Private key not found');
    const ourSecretKey = toUint8(privateKey);
    const peerPublicKey = toUint8(theirPublicKey);
    assertKeyLen(ourSecretKey, 32, 'Private key');
    assertKeyLen(peerPublicKey, 32, 'Peer public key');

    const ciphertext = fromBase64ToUint8(encryptedMessage);
    const nonceBytes = typeof nonce === 'string' ? fromBase64ToUint8(nonce) : nonce;
    if (nonceBytes.length !== 24) throw new Error('Nonce must be 24 bytes');

    return nacl.box.open(ciphertext, nonceBytes, peerPublicKey, ourSecretKey);
  }, [privateKey]);

  return { 
    encodeMessage, 
    decodeMessage,
   };
}