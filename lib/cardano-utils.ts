/**
 * Cardano utility functions for address and key hash operations
 */

import * as CSL from '@emurgo/cardano-serialization-lib-browser';

/**
 * Extract payment key hash (PKH) from a Cardano bech32 address
 * @param bech32 - Cardano address in bech32 format
 * @returns 28-byte hex string of the payment key hash
 */
export function pkhFromPaymentAddress(bech32: string): string {
  const addr = CSL.Address.from_bech32(bech32);
  const base = CSL.BaseAddress.from_address(addr);
  if (!base) throw new Error('Not a base address (script/enterprise addr?)');
  const kh = base.payment_cred().to_keyhash();
  if (!kh) throw new Error('Payment credential is script or missing');
  return Buffer.from(kh.to_bytes()).toString('hex'); // 28-byte hex
}

/**
 * Get payment key hash hex from the current connected wallet
 * @param walletAPI - Wallet API instance from Mesh SDK
 * @returns Promise resolving to 28-byte hex string of payment key hash
 */
export async function myPaymentKeyHashHex(walletAPI: any): Promise<string> {
  const used = await walletAPI.getUsedAddresses();
  if (!used?.length) throw new Error('No used addresses');
  return pkhFromPaymentAddress(used[0]);
}

