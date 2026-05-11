// Test-only re-export of crypto internals. Do not import from src/.
import { __testInternals } from '../../src/utils/crypto.ts'

export const resetSecureRandomBatchForTesting = __testInternals?.resetBatch ?? (() => {})
