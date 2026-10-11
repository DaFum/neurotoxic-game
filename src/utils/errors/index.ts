export {
  ErrorSeverity,
  ErrorCategory,
  GameError,
  StateError,
  StorageError,
  AudioError
} from './types'
export type { ErrorSeverityType, ErrorCategoryType } from './types'
export { handleError, initGlobalErrorHandling } from './handler'
export { runSafeStorageOperation } from './safeStorage'
