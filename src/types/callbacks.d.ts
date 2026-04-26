export type VoidCallback = () => void

export type AsyncCallback<TResult = void> = () => TResult | Promise<TResult>
export type AsyncVoidCallback = AsyncCallback<void>
export type AsyncBooleanCallback = AsyncCallback<boolean>

export type ToggleBooleanCallback = (nextValue: boolean) => void

export type TranslationCallback = (
  key: string,
  options?: Record<string, unknown>
) => string

export type ToastCallback = (message: string, type: string) => void

export type CollisionHandler = (projectile: unknown) => void

export type MissHandler = (missCount: number, fromInput: boolean) => void

export type GigFinalizeHandler<TState> = (state: TState) => void

export type RemoveByIdCallback = (id: string) => void
