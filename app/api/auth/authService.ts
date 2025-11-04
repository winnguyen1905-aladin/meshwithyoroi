import { api } from '../apiClient'

interface ChallengeData {
  message: string
  nonce: string
  externalAad?: string
}

interface VerifyData {
  accessToken: string
}

export const requestChallenge = async (address: string, walletType: string) => {
  const res = await api.post('/auth/challenge', {
    address,
    walletType: walletType.toUpperCase(),
  });
  return res.data as { success: boolean; data: ChallengeData; message?: string };
}

export const verifySignature = async (payload: {
  walletAddress: string
  nonce: string
  coseSign1: string
  externalAad?: string
  publicKey: string
  walletType: string
}) => {
  const res = await api.post('/auth/verify', payload);
  return res.data as { 
    data: VerifyData
    message: string
    statusCode: number
    timestamp: string
  };
}
