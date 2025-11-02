/**
 * Utility functions for job-related operations
 */

/**
 * Convert UUID string to hex format (remove hyphens and convert to lowercase)
 * @param uuid - UUID string (e.g., "550e8400-e29b-41d4-a716-446655440001")
 * @returns Hex string without hyphens (e.g., "550e8400e29b41d4a716446655440001")
 */
export function uuidToHex(uuid: string | undefined | null): string {
  if (!uuid) throw new Error('UUID is required');
  return uuid.replace(/-/g, '').toLowerCase(); // giả định uuid v4 chuẩn
}

/**
 * Chunk a message into 64-byte segments for CIP-20 metadata
 * @param s - String message to chunk
 * @returns Array of strings, each ≤ 64 bytes
 */
export function chunkCip20Msg(s: string): string[] {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const b = enc.encode(s);
  const out: string[] = [];
  for (let i = 0; i < b.length; i += 64) {
    out.push(dec.decode(b.slice(i, i + 64)));
  }
  return out;
}

/**
 * Build escrow funding metadata object
 */
export function buildEscrowMetadata(params: {
  jobId: string;
  jobIdHex: string;
  amountLovelace: string;
  jobTitle?: string;
}): Record<string, any> {
  const msg = `Aladin Job Escrow - JobID ${params.jobId}`;
  return {
    msg: chunkCip20Msg(msg), // CIP-20: mảng string, mỗi phần ≤ 64 bytes
    action: 'fund_escrow',
    job_id: params.jobId,
    job_id_hex: params.jobIdHex,
    amount: params.amountLovelace,
    title: params.jobTitle ?? 'Job Escrow',
    ts: Date.now(),
  };
}

