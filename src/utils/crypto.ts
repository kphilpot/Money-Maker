/**
 * Cryptographic utilities for immutable audit trail
 * Uses SubtleCrypto (Web Crypto API) for SHA-256 hashing
 */

/**
 * Generate SHA-256 hash of verification data
 * Returns hex string for storage in audit trail
 */
export async function generateVerificationHash(data: {
  screenshot: string
  prompt: string
  response: string
  timestamp: string
  userId: string
}): Promise<string> {
  const dataString = JSON.stringify(data)
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(dataString)

  // Use SubtleCrypto to compute SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)

  // Convert ArrayBuffer to hex string
  return bufferToHex(hashBuffer)
}

/**
 * Generate hash for audit entry with chain integrity
 */
export async function generateAuditHash(data: {
  userId: string
  action: string
  result: string
  screenshotHash: string
  reasoningHash?: string
  timestamp: string
  previousHash?: string
}): Promise<string> {
  // Include previous hash to create chain-of-custody
  const dataString = JSON.stringify(data)
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(dataString)

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  return bufferToHex(hashBuffer)
}

/**
 * Verify chain integrity of audit trail
 * Checks that each entry's hash depends on previous entry
 */
export async function verifyAuditChain(entries: Array<{
  hash: string
  previousHash?: string
  timestamp: string
  result: string
  screenshotHash: string
}>): Promise<boolean> {
  if (entries.length === 0) {
    return true
  }

  // First entry should have no previous hash
  if (entries[0].previousHash) {
    return false
  }

  // Each subsequent entry should reference previous
  for (let i = 1; i < entries.length; i++) {
    const current = entries[i]
    const previous = entries[i - 1]

    if (current.previousHash !== previous.hash) {
      return false
    }
  }

  return true
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer)
  let hex = ''
  for (let i = 0; i < view.length; i++) {
    const byte = view[i]!.toString(16)
    hex += byte.length === 1 ? '0' + byte : byte
  }
  return hex
}

/**
 * Compute hash of current audit state for integrity check
 * Can be called periodically to verify no tampering
 */
export async function computeAuditStateHash(entries: Array<{
  hash: string
  timestamp: string
}>): Promise<string> {
  const hashes = entries.map((e) => e.hash).join(',')
  const encoder = new TextEncoder()
  const buffer = encoder.encode(hashes)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return bufferToHex(hashBuffer)
}
