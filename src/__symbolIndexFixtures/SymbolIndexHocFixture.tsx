import { forwardRef, memo } from 'react'

type SymbolIndexHocFixtureProps = {
  label: string
}

export const SymbolIndexMemoFixture = memo(({ label }: SymbolIndexHocFixtureProps) => <span>{label}</span>)

export const SymbolIndexForwardRefFixture = forwardRef<HTMLDivElement, SymbolIndexHocFixtureProps>(
  function SymbolIndexForwardRefFixture({ label }, ref) {
    return <div ref={ref}>{label}</div>
  }
)
