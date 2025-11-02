export interface WalletBalance {
  lovelace: string;
  assets: Array<{
    unit: string;
    quantity: string;
  }>;
}

export interface UTXO {
  tx_hash: string;
  output_index: number;
  amount: Array<{
    unit: string;
    quantity: string;
  }>;
}

export interface Transaction {
  tx_hash: string;
  block_height: number;
  block_time: number;
  slot: number;
  fees: string;
}

export interface TransactionDetails {
  hash: string;
  block: string;
  block_height: number;
  slot: number;
  fees: string;
  size: number;
}