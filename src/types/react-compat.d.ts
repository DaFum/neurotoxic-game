import 'react'

declare module 'react' {
  interface MemoExoticComponent<_T extends ComponentType<unknown>> {
    propTypes?: unknown
  }

  interface NamedExoticComponent<_P extends object = object> {
    propTypes?: unknown
  }
}
