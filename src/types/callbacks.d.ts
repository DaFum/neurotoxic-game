/**
 * Synchronous callback with no arguments.
 */
export type VoidCallback = () => void

/**
 * Random number callback returning a 0-1 value.
 */
export type RandomFn = () => number

/**
 * Asynchronous callback with no required result.
 *
 * @typeParam TResult - Optional success/result value returned synchronously or
 * through a promise.
 */
export type AsyncCallback<TResult = void> = () =>
  TResult | void | Promise<TResult | void>
/**
 * Asynchronous callback that resolves without a value.
 */
export type AsyncVoidCallback = AsyncCallback<void>
/**
 * Asynchronous callback that resolves to a success flag.
 */
export type AsyncBooleanCallback = AsyncCallback<boolean>

/**
 * State setter callback for boolean toggles.
 */
export type ToggleBooleanCallback = (nextValue: boolean) => void

/**
 * i18n translation callback shape used outside React components.
 */
export type TranslationCallback = (
  key: string,
  options?: Record<string, unknown>
) => string

/**
 * Callback for enqueueing localized toast messages.
 */
export type ToastCallback = (message: string, type: string) => void

/**
 * Optional toast callback for utility call sites.
 */
export type OptionalToastCallback = (message: string, type?: string) => void

/**
 * Callback fired when a minigame collision occurs.
 */
export type CollisionHandler = (projectile: unknown) => void

/**
 * Callback fired when a rhythm note is missed.
 */
export type MissHandler = (missCount: number, fromInput: boolean) => void

/**
 * Callback for removing an item by string id.
 */
export type RemoveByIdCallback = (id: string) => void
