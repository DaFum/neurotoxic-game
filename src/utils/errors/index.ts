export {
  ErrorSeverity,
  ErrorCategory,
  GameError,
  StateError,
  StorageError,
  AudioError
} from './types'
export type { ErrorSeverityType, ErrorCategoryType } from './types'
export {
  handleError,
  initGlobalErrorHandling,
  toastTypeFromSeverity
} from './handler'
export { runSafeStorageOperation } from './safeStorage'
