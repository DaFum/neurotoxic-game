import 'react'

declare module 'react' {
  interface FunctionComponent<P = {}> {
    propTypes?: unknown
  }

  interface MemoExoticComponent<T extends ComponentType<unknown>> {
    propTypes?: unknown
  }

  interface NamedExoticComponent<P = {}> {
    propTypes?: unknown
  }
}
