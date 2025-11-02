import { useChatKey } from "@/context/chatkey-context";
import { useCallback, useState } from "react";
import nacl from 'tweetnacl';

export const useChatE2ee = () => {
  const { privateKey } = useChatKey();
  const [nonce, setNonce] = useState<Uint8Array>(() => nacl.randomBytes(24)); // Tạo nonce 1 lần

  const encodeMessage = useCallback((message: string, theirPublicKey: Buffer): { encrypted: Uint8Array, nonce: Uint8Array } => {
    if (!privateKey) throw new Error('Private key not found');
    const encrypted = nacl.box(new TextEncoder().encode(message), nonce, theirPublicKey, privateKey);
    setNonce(nacl.randomBytes(24));

    return { encrypted, nonce };
  }, [privateKey, nonce]);

  const decodeMessage = useCallback((encryptedMessage: string, theirPublicKey: Buffer, nonce: Uint8Array): Uint8Array | null => {
    if (!privateKey) throw new Error('Private key not found');
    const decrypted = nacl.box.open(Buffer.from(encryptedMessage), nonce, theirPublicKey, privateKey);
    return decrypted;
  }, [privateKey]);

  return {
    encodeMessage,
    decodeMessage,
  }
}