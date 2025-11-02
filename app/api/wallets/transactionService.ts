import { apiClient } from '@/lib/api-client';
import { api } from '../apiClient';
import type { Transaction, TransactionDetails } from '@/types/blockfrost.types';

export const transactionService = {
  // Lấy history từ Blockfrost qua NestJS
  getHistory: async (address: string, limit: number = 10): Promise<Transaction[]> => {
    return api.get(`/blockfrost/transactions/history/${address}?limit=${limit}`);
  },

  // Lấy details từ Blockfrost qua NestJS
  getDetails: async (txHash: string): Promise<TransactionDetails> => {
    return api.get(`/blockfrost/transactions/${txHash}`);
  },

  // Lấy status từ Blockfrost qua NestJS
  getStatus: async (txHash: string): Promise<{ status: string; confirmations: number }> => {
    return api.get(`/blockfrost/transactions/${txHash}/status`);
  },

  // Submit transaction
  submit: async (signedTx: string): Promise<{ txHash: string }> => {
    return api.post('/blockfrost/transactions/submit', { signedTx });
  },
};