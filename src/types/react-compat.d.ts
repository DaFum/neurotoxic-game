import 'react'

/**
 * Compatibility shim for legacy React typings that still expose `propTypes`;
 * runtime propTypes blocks remain intentionally unsupported in app code.
 */
declare module 'react' {
  interface MemoExoticComponent<_T extends ComponentType<unknown>> {
    propTypes?: unknown
  }

  interface NamedExoticComponent<_P extends object = object> {
    propTypes?: unknown
  }
}
