import React from 'react'

const componentCache = new Map()

function createMockComponent(tag) {
  if (componentCache.has(tag)) {
    return componentCache.get(tag)
  }

  const Comp = ({ children, ...props }) => {
    const ActualTag = props.as || tag || 'div'
    // Strip motion props safely avoiding unused vars warning
    const domProps = {}
    for (const key in props) {
      if (
        [
          'initial',
          'animate',
          'exit',
          'transition',
          'whileHover',
          'whileTap',
          'layoutId',
          'layout',
          'variants',
          'style',
          'onAnimationComplete',
          'as'
        ].includes(key)
      ) {
        continue
      }
      domProps[key] = props[key]
    }

    // Simulate traveling van test's special behavior safely
    if (props.onAnimationComplete) {
      return React.createElement(
        ActualTag,
        {
          'data-testid': 'motion-wrapper',
          onClick: props.onAnimationComplete,
          ...domProps,
          style: typeof props.style === 'object' ? props.style : undefined
        },
        children
      )
    }

    return React.createElement(
      ActualTag,
      {
        ...domProps,
        style: typeof props.style === 'object' ? props.style : undefined
      },
      children
    )
  }

  Comp.displayName = `mockM(${tag})`
  componentCache.set(tag, Comp)
  return Comp
}

export const createMotionReactMock = () => {
  const mProxy = new Proxy(
    {},
    {
      get: (_, key) => createMockComponent(key)
    }
  )

  return {
    m: mProxy,
    motion: mProxy,
    AnimatePresence: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    LazyMotion: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
    useReducedMotion: () => false,
    domAnimation: {}
  }
}
