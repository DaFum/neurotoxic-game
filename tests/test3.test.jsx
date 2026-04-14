import { render, screen } from '@testing-library/react'
import { ActionButton } from '../src/ui/shared/ActionButton.jsx'
import React, { useRef, useEffect } from 'react'
import { describe, it } from 'vitest'

describe('test3', () => {
  it('renders ref', () => {
    let renderedRef = null
    function Test() {
      const ref = useRef(null)
      useEffect(() => {
        renderedRef = ref.current
      }, [])
      return <ActionButton ref={ref}>GIG STARTEN</ActionButton>
    }
    render(<Test />)
    console.log("Ref inside test is:", renderedRef)
  })
})
