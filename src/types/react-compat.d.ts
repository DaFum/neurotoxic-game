import 'react'

declare module 'react' {
  /**
   * Compatibility shim for legacy React typings that still expose `propTypes`;
   * runtime propTypes blocks remain intentionally unsupported in app code.
   */
  interface MemoExoticComponent<_T extends ComponentType<unknown>> {
    propTypes?: unknown
  }

  /**
   * Compatibility shim for legacy React typings that still expose `propTypes`;
   * runtime propTypes blocks remain intentionally unsupported in app code.
   */
  interface NamedExoticComponent<_P extends object = object> {
    propTypes?: unknown
  }
}
