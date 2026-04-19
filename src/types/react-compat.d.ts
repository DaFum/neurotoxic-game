import 'react'

declare module 'react' {
  interface MemoExoticComponent<T extends ComponentType<unknown>> {
    propTypes?: unknown
  }

  interface NamedExoticComponent<P = {}> {
    propTypes?: unknown
  }
}
