'use client';

import { useCallback, useMemo } from 'react';
import { socketManager } from '@/services/socket-manager';
import { useSocket } from '@/context/chat-context';
import { useChatE2ee } from './use-e2ee';
import { useChatKey } from '@/context/chatkey-context';
import { useAuth } from './use-auth';
import { useQuery } from '@tanstack/react-query';
import { getPeerPublicKey } from '@/app/api/job/jobService';
import type { MessagePayload, SendMessageResponse } from '@/types/chat-response.type';

// In-memory cache for peer public keys (per job)
const peerKeyCache = new Map<string, { key: Buffer; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Join a job-specific chat room using the shared socket namespace `/chat`.
 */
export const useJoinJobRoom = () => {
  return useCallback((jobId: string) => {
    const client = socketManager.getSocket('/chat', {});
    (client as any).emit('room:join', { room: `job:${jobId}` });
  }, []);
};

/**
 * Leave a job-specific chat room
 */
export const useLeaveJobRoom = () => {
  return useCallback((jobId: string) => {
    const client = socketManager.getSocket('/chat', {});
    (client as any).emit('room:leave', { room: `job:${jobId}` });
  }, []);
};

/**
 * Hook to send E2EE text messages for a given job.
 * - resolvePeerPublicKey must return the recipient's public key Buffer for this job.
 */
export const useSendChat = (
  jobId: string,
  resolvePeerPublicKey: () => Buffer
) => {
  const { sendMessage } = useSocket();
  const { encodeMessage } = useChatE2ee();
  const { publicKey } = useChatKey();
  const { wallet } = useAuth();
  const sendText = useCallback(
    async (plaintext: string): Promise<SendMessageResponse> => {
      if (!wallet?.address) throw new Error('Wallet not connected');
      if (!publicKey) throw new Error('E2EE public key not available');
      if (!plaintext.trim()) throw new Error('Message is empty');

      const peerPublicKey = resolvePeerPublicKey() || Buffer.from('');
      const { encrypted, nonce } = encodeMessage(plaintext, peerPublicKey);

      const payload: MessagePayload = {
        id: '',
        senderId: wallet.address,
        jobId,
        // transport: store encrypted data in content; nonce alongside
        encryptedContent: Buffer.from(encrypted).toString('base64'),
        nonce: Buffer.from(nonce).toString('base64'),
        timestamp: Date.now(),
        messageType: 'text',
        metadata: {
          encrypted: true,
          senderPublicKey: publicKey.toString('base64'),
        },
      };

      return await sendMessage(payload);
    },
    [wallet?.address, publicKey, jobId, resolvePeerPublicKey, encodeMessage, sendMessage]
  );

  return { sendText };
};

/**
 * Hook to resolve peer public key for a job with caching
 * Returns the peer's public key Buffer for E2EE encryption
 */

// TODO: Cần thay đổi để lấy public key từ job details
export const usePeerPublicKey = (jobId: string | undefined, job: { aladinId: string; genieId: string } | undefined, currentAddress: string | undefined) => {
  const peerAddress = useMemo(() => {
    if (!job || !currentAddress) return undefined;
    return job.aladinId === currentAddress ? job.genieId : job.aladinId;
  }, [job, currentAddress]);

  const cacheKey = useMemo(() => {
    if (!jobId || !peerAddress) return null;
    return `${jobId}:${peerAddress}`;
  }, [jobId, peerAddress]);

  // Check cache first
  const cached = useMemo(() => {
    if (!cacheKey) return null;
    const cached = peerKeyCache.get(cacheKey)  ;
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.key;
    }
    return null; // TODO
  }, [cacheKey]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['peer-public-key', jobId, peerAddress],
    queryFn: async () => {
      if (!jobId || !peerAddress) throw new Error('Job ID and peer address required');
      const res = await getPeerPublicKey(jobId, peerAddress);
      const key = Buffer.from(res.publicKey, 'base64');
      // Update cache
      if (cacheKey) {
        peerKeyCache.set(cacheKey, { key, timestamp: Date.now() });
      }
      return key;
    },
    enabled: !!jobId && !!peerAddress && !cached,
    staleTime: CACHE_TTL,
  });

  const peerKey = cached || data;

  return {
    peerPublicKey: peerKey,
    isLoading: isLoading && !cached,
    error,
  };
};

/**
 * Helper to create resolvePeerPublicKey function for useSendChat
 */
export const useResolvePeerPublicKey = (
  jobId: string | undefined,
  job: { aladinId: string; genieId: string } | undefined,
  currentAddress: string | undefined
) => {
  const { peerPublicKey } = usePeerPublicKey(jobId, job, currentAddress);
  return useCallback(() => {
    if (!peerPublicKey) { // TODO: remove this after testing
      return publicKeyB64;
      // throw new Error('Peer public key not available. Please wait for it to load.');
    }
    return peerPublicKey;
  }, [peerPublicKey]);
};

const publicKey = Buffer.from('317b72055e85267050b626b1783871881c391a403cbb2eafb6bb342ef040b875', 'hex');
// or:
const publicKeyB64 = Buffer.from('MXtyBV6FJnBQtiaxeDhxiBw5GkA8uy6vtrs0LvBAuHU=', 'base64');

const secretKey = Buffer.from('3af5b1bfe2d99680e027b30ecc47a516d432338ac968f6aa826f1bc7a784dd4b', 'hex');
// or:
const secretKeyB64 = Buffer.from('OvWxv+LZloDgJ7MOzEelFtQyM4rJaPaqgm8bx6eE3Us=', 'base64');
