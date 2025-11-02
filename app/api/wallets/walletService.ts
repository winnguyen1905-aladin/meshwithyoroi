import { apiClient } from '@/lib/api-client';
import { api } from '../apiClient';
import type { WalletBalance, UTXO } from '@/types/blockfrost.types';

export const walletService = {
  // Lấy balance từ Blockfrost qua NestJS
  getBalance: async (address: string): Promise<WalletBalance> => {
      return api.get(`/blockfrost/wallets/${address}/balance`);
  },

  // Lấy UTXOs từ Blockfrost qua NestJS
  getUtxos: async (address: string): Promise<UTXO[]> => {
    return api.get(`/blockfrost/wallets/${address}/utxos`);
  },

  // Lấy assets từ Blockfrost qua NestJS
  getAssets: async (address: string): Promise<any[]> => {
    return api.get(`/blockfrost/wallets/${address}/assets`);
  },
};