# Example Fixture Extraction

Use this example when repeated setup appears in multiple tests. The point is not to extract every duplicate line; extract only setup that belongs to the same runner family and has a clear cleanup path.

## Before

Two Vitest UI tests repeat the same localStorage and timer setup:

```javascript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('example panel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.setItem('neurotoxic-save', '{}')
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders saved data', () => {
    // assertion
  })
})
```

## After

Create a Vitest-only helper and keep teardown with the setup:

```javascript
import { afterEach, beforeEach, vi } from 'vitest'

export const installSavedGameFixture = saveJson => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.setItem('neurotoxic-save', saveJson)
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
}
```

Then consume it only from Vitest suites:

```javascript
import { describe, expect, it } from 'vitest'
import { installSavedGameFixture } from '../helpers/installSavedGameFixture.js'

describe('example panel', () => {
  installSavedGameFixture('{}')

  it('renders saved data', () => {
    // assertion
  })
})
```

## Safety Checks

- The helper imports `vitest`, so do not use it from `node:test`.
- Cleanup lives beside setup, so parallel suites do not inherit leaked timers or storage.
- The test name still describes behavior; the helper only removes setup noise.
- Re-run the affected file first, then the broader Vitest suite if the helper is shared.
