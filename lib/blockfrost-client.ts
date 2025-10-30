import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

export const blockfrostClient = new BlockFrostAPI({
  projectId: process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY || '',
});