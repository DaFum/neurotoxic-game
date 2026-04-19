import 'react'

declare module 'react' {
  interface MemoExoticComponent<T extends ComponentType<unknown>> {
    propTypes?: unknown
  }

  interface NamedExoticComponent<P extends object = object> {
    propTypes?: unknown
  }
}
