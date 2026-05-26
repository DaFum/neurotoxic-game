# Long-Term Assets Mobile Hub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Long-Term Asset System as a phone-portrait-first Roadcase Command Deck with full asset art, compact slot/action management, and a bottom segmented section switcher.

**Architecture:** Keep the existing asset domain state, reducers, action creators, image pipeline, and section registry. Add small UI-only components around the current section views: a status strip, bottom tabs, a shared section deck, and a slot/action list. Migrate the four section wrappers to the shared shell while preserving existing modal flows and tab/tabpanel ids.

**Tech Stack:** React 19, TypeScript/TSX, Tailwind v4 classes, CSS variables in `src/index.css` plus a focused asset-hub stylesheet, Vitest with Testing Library, `react-i18next`, existing `GeneratedImagePanel`, existing asset selectors/action helpers.

---

## Scope Check

The approved spec covers one UI subsystem: the long-term asset hub. It does not require reducer, economy, persistence, module catalog, or RNG changes. Keep implementation work inside `src/components/assets/**`, asset locale JSON, focused UI tests, and small CSS imports unless a verified UI integration issue requires otherwise.

## File Structure

Create:

- `src/components/assets/sectionTabs.ts` - shared tab metadata and section key mapping.
- `src/components/assets/AssetsBottomTabs.tsx` - accessible bottom segmented tab switcher.
- `src/components/assets/AssetsStatusStrip.tsx` - compact cash, daily obligation, debt, and campaign strip.
- `src/components/assets/AssetSlotActionList.tsx` - reliable one-handed slot management list.
- `src/components/assets/AssetSectionDeck.tsx` - responsive art-plus-list layout shell.
- `src/components/assets/AssetSectionPanel.tsx` - shared section container that owns picker/acquire/repair/sell modal state.
- `src/components/assets/assetsHub.css` - asset-hub-specific texture, bottom dock, reveal motion, and mobile framing.
- `tests/ui/AssetsBottomTabs.test.tsx`
- `tests/ui/AssetsStatusStrip.test.tsx`
- `tests/ui/AssetSlotActionList.test.tsx`
- `tests/ui/AssetsScene.test.tsx`

Modify:

- `src/index.css` - import or define asset font variables using Google font imports already allowed by the project pattern.
- `src/components/assets/AssetsScene.tsx` - use status strip, bottom tabs, CSS shell, and preserved tabpanel semantics.
- `src/components/assets/AssetsTopBar.tsx` - delete after `AssetsStatusStrip` replaces it, or leave unreferenced only until the migration task commits.
- `src/components/assets/sections/TourbusSection.tsx`
- `src/components/assets/sections/StudioSection.tsx`
- `src/components/assets/sections/BandhausSection.tsx`
- `src/components/assets/sections/MerchWorkshopSection.tsx`
- `src/components/assets/sections/TourbusVehicleView.tsx`
- `src/components/assets/sections/StudioFloorplanView.tsx`
- `src/components/assets/sections/BandhausCrossSectionView.tsx`
- `src/components/assets/sections/WorkshopProductionLineView.tsx`
- `public/locales/en/assets.json`
- `public/locales/de/assets.json`
- Existing section tests as needed, especially `tests/ui/MerchWorkshopSection.test.tsx`, `tests/ui/TourbusVehicleView.test.tsx`, `tests/ui/StudioFloorplanView.test.tsx`, `tests/ui/BandhausCrossSectionView.test.tsx`, and `tests/ui/WorkshopProductionLineView.test.tsx`.

Do not modify:

- `src/context/**` reducers/action creators.
- `src/utils/assetSelectors.ts`, except if a test proves a UI-only display need cannot be derived from current selectors.
- `src/utils/assetConfig.ts` or module registries.

---

## Task 1: Locale And Asset-Hub Style Groundwork

**Files:**

- Modify: `src/index.css`
- Create: `src/components/assets/assetsHub.css`
- Modify: `public/locales/en/assets.json`
- Modify: `public/locales/de/assets.json`

- [ ] **Step 1: Add failing locale assertions for new hub keys**

Add these assertions to `tests/node/workshopLocaleKeys.test.js` or create `tests/node/assetsHubLocaleKeys.test.js` if the existing workshop test is too narrow. Use `node:test`, matching the current locale smoke style.

```js
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import en from '../../public/locales/en/assets.json' with { type: 'json' }
import de from '../../public/locales/de/assets.json' with { type: 'json' }

const requiredKeys = [
  'section.tourbus.alt',
  'section.studio.alt',
  'section.bandhaus.alt',
  'section.workshop.alt',
  'hub.status.cash',
  'hub.status.daily',
  'hub.status.debt',
  'hub.status.campaigns',
  'hub.status.noDebt',
  'hub.actions.acquire',
  'hub.actions.manageSlot',
  'hub.actions.inspectFinance',
  'hub.slotState.empty',
  'hub.slotState.installed',
  'hub.slotState.locked',
  'hub.slotState.damaged',
  'hub.finance.title',
  'hub.finance.noCampaigns',
  'hub.accessibility.sectionTabs',
  'hub.accessibility.slotAction'
]

describe('asset hub locale keys', () => {
  for (const key of requiredKeys) {
    it(`${key} exists in en and de`, () => {
      assert.equal(typeof en[key], 'string')
      assert.notEqual(en[key].trim(), '')
      assert.equal(typeof de[key], 'string')
      assert.notEqual(de[key].trim(), '')
    })
  }
})
```

- [ ] **Step 2: Run the locale test and verify it fails**

Run:

```powershell
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/assetsHubLocaleKeys.test.js
```

Expected: FAIL because the new `hub.*` and non-workshop alt keys do not exist yet.

- [ ] **Step 3: Add the EN locale keys**

Add these key/value pairs to `public/locales/en/assets.json` near the existing `scene.*`, `section.*`, and action keys:

```json
{
  "section.tourbus.alt": "Tourbus side view",
  "section.studio.alt": "Studio floorplan",
  "section.bandhaus.alt": "Band House cross-section",
  "hub.status.cash": "Cash",
  "hub.status.daily": "Daily",
  "hub.status.debt": "Debt",
  "hub.status.campaigns": "Campaigns",
  "hub.status.noDebt": "No debt",
  "hub.actions.acquire": "Acquire",
  "hub.actions.manageSlot": "Manage",
  "hub.actions.inspectFinance": "Finance",
  "hub.slotState.empty": "Empty",
  "hub.slotState.installed": "Installed",
  "hub.slotState.locked": "Locked",
  "hub.slotState.damaged": "Damaged",
  "hub.finance.title": "Finance",
  "hub.finance.noCampaigns": "No active campaigns",
  "hub.accessibility.sectionTabs": "Asset sections",
  "hub.accessibility.slotAction": "{{slot}} slot: {{state}}"
}
```

- [ ] **Step 4: Add the DE locale keys**

Add matching keys to `public/locales/de/assets.json`:

```json
{
  "section.tourbus.alt": "Tourbus-Seitenansicht",
  "section.studio.alt": "Studio-Grundriss",
  "section.bandhaus.alt": "Bandhaus-Querschnitt",
  "hub.status.cash": "Cash",
  "hub.status.daily": "Pro Tag",
  "hub.status.debt": "Schulden",
  "hub.status.campaigns": "Kampagnen",
  "hub.status.noDebt": "Keine Schulden",
  "hub.actions.acquire": "Anschaffen",
  "hub.actions.manageSlot": "Verwalten",
  "hub.actions.inspectFinance": "Finanzen",
  "hub.slotState.empty": "Leer",
  "hub.slotState.installed": "Eingebaut",
  "hub.slotState.locked": "Gesperrt",
  "hub.slotState.damaged": "Beschädigt",
  "hub.finance.title": "Finanzen",
  "hub.finance.noCampaigns": "Keine aktiven Kampagnen",
  "hub.accessibility.sectionTabs": "Asset-Sektionen",
  "hub.accessibility.slotAction": "{{slot}}-Slot: {{state}}"
}
```

- [ ] **Step 5: Add asset hub font imports and variables**

In `src/index.css`, add the imports near the existing Google font imports:

```css
@import url('https://fonts.googleapis.com/css2?family=Staatliches&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@500;700;800&display=swap');
```

Inside `@theme`, add:

```css
--font-asset-display: 'Staatliches', var(--font-display);
--font-asset-control: 'Azeret Mono', var(--font-ui);
```

- [ ] **Step 6: Add focused asset-hub CSS**

Create `src/components/assets/assetsHub.css`:

```css
.assets-hub {
  --asset-font-display: var(--font-asset-display);
  --asset-font-control: var(--font-asset-control);
  min-height: 100%;
  font-family: var(--asset-font-control);
  background:
    linear-gradient(135deg, rgb(var(--color-void-black-rgb) / 96%), rgb(var(--color-void-black-rgb) / 82%)),
    repeating-linear-gradient(
      45deg,
      rgb(var(--color-toxic-green-rgb) / 7%) 0,
      rgb(var(--color-toxic-green-rgb) / 7%) 1px,
      transparent 1px,
      transparent 11px
    );
}

.assets-hub-title {
  font-family: var(--asset-font-display);
  letter-spacing: 0;
}

.assets-hub-control {
  font-family: var(--asset-font-control);
  letter-spacing: 0;
}

.assets-hub-panel {
  border: 2px solid var(--section-accent, var(--color-toxic-green));
  background:
    linear-gradient(180deg, rgb(var(--color-void-black-rgb) / 88%), rgb(var(--color-void-black-rgb) / 96%)),
    repeating-linear-gradient(
      90deg,
      rgb(var(--color-star-white-rgb) / 5%) 0,
      rgb(var(--color-star-white-rgb) / 5%) 1px,
      transparent 1px,
      transparent 16px
    );
  box-shadow: 4px 4px 0 var(--section-accent, var(--color-toxic-green));
}

.assets-hub-reveal {
  animation: assets-hub-reveal 180ms ease-out both;
}

.assets-bottom-tabs {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  background: rgb(var(--color-void-black-rgb) / 96%);
  border-top: 2px solid var(--section-accent, var(--color-toxic-green));
}

.assets-modal-sheet {
  max-width: min(100%, 48rem);
}

@keyframes assets-hub-reveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .assets-modal-sheet {
    align-self: flex-end;
    max-height: calc(100svh - 1rem);
    border-bottom-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .assets-hub-reveal {
    animation: none;
  }
}
```

- [ ] **Step 7: Run locale and diff checks**

Run:

```powershell
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/assetsHubLocaleKeys.test.js
git diff --check
```

Expected: locale test PASS; `git diff --check` exits 0.

- [ ] **Step 8: Commit**

```powershell
git add src/index.css src/components/assets/assetsHub.css public/locales/en/assets.json public/locales/de/assets.json tests/node/assetsHubLocaleKeys.test.js
git commit -m "feat: add asset hub style and locale groundwork"
```

---

## Task 2: Shared Section Tab Metadata And Bottom Tabs

**Files:**

- Create: `src/components/assets/sectionTabs.ts`
- Create: `src/components/assets/AssetsBottomTabs.tsx`
- Test: `tests/ui/AssetsBottomTabs.test.tsx`

- [ ] **Step 1: Write the failing bottom-tabs test**

Create `tests/ui/AssetsBottomTabs.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AssetsBottomTabs } from '../../src/components/assets/AssetsBottomTabs'
import type { AssetKind } from '../../src/types/assets'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'assets:hub.accessibility.sectionTabs': 'Asset sections',
        'assets:section.tourbus.title': 'Tourbus',
        'assets:section.studio.title': 'Studio',
        'assets:section.bandhaus.title': 'Band House',
        'assets:section.workshop.title': 'Workshop'
      }
      return labels[key] ?? key
    }
  })
}))

describe('AssetsBottomTabs', () => {
  it('renders accessible section tabs and switches sections', () => {
    const onSelect = vi.fn()
    render(
      <AssetsBottomTabs active='tourbus_chassis' onSelect={onSelect} />
    )

    expect(
      screen.getByRole('tablist', { name: 'Asset sections' })
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tourbus/ })).toHaveAttribute(
      'aria-selected',
      'true'
    )

    fireEvent.click(screen.getByRole('tab', { name: /Studio/ }))
    expect(onSelect).toHaveBeenCalledWith('studio_chassis')
  })

  it('preserves tab ids and panel controls', () => {
    render(
      <AssetsBottomTabs
        active={'merch_workshop_chassis' as AssetKind}
        onSelect={vi.fn()}
      />
    )

    const workshop = screen.getByRole('tab', { name: /Workshop/ })
    expect(workshop).toHaveAttribute(
      'id',
      'assets-tab-merch_workshop_chassis'
    )
    expect(workshop).toHaveAttribute(
      'aria-controls',
      'assets-panel-merch_workshop_chassis'
    )
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetsBottomTabs.test.tsx
```

Expected: FAIL because `AssetsBottomTabs` does not exist.

- [ ] **Step 3: Add shared tab metadata**

Create `src/components/assets/sectionTabs.ts`:

```ts
import type { ComponentType } from 'react'
import { Bus, House, Shirt, SlidersHorizontal } from 'lucide-react'
import type { AssetKind } from '../../types/assets'

type TabIcon = ComponentType<{
  className?: string
  'aria-hidden'?: boolean
}>

export interface AssetSectionTab {
  key: AssetKind
  shortLabel: 'tourbus' | 'studio' | 'bandhaus' | 'workshop'
  Icon: TabIcon
}

export const ASSET_SECTION_TABS = [
  { key: 'tourbus_chassis', shortLabel: 'tourbus', Icon: Bus },
  { key: 'studio_chassis', shortLabel: 'studio', Icon: SlidersHorizontal },
  { key: 'bandhaus_chassis', shortLabel: 'bandhaus', Icon: House },
  { key: 'merch_workshop_chassis', shortLabel: 'workshop', Icon: Shirt }
] as const satisfies readonly AssetSectionTab[]
```

- [ ] **Step 4: Implement bottom tabs**

Create `src/components/assets/AssetsBottomTabs.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import type { AssetKind } from '../../types/assets'
import { ASSET_SECTION_TABS } from './sectionTabs'

interface AssetsBottomTabsProps {
  active: AssetKind
  onSelect: (kind: AssetKind) => void
}

export const AssetsBottomTabs = ({
  active,
  onSelect
}: AssetsBottomTabsProps) => {
  const { t } = useTranslation(['assets'])

  return (
    <nav className='assets-bottom-tabs sticky bottom-0 z-20 px-2 pt-2'>
      <div
        role='tablist'
        aria-label={t('assets:hub.accessibility.sectionTabs')}
        className='grid grid-cols-4 gap-1'
      >
        {ASSET_SECTION_TABS.map(tab => {
          const isActive = tab.key === active
          const Icon = tab.Icon
          return (
            <button
              key={tab.key}
              id={`assets-tab-${tab.key}`}
              type='button'
              role='tab'
              aria-selected={isActive}
              aria-controls={`assets-panel-${tab.key}`}
              onClick={() => onSelect(tab.key)}
              className='assets-hub-control flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 border-2 px-1 py-2 text-[0.65rem] uppercase leading-none transition-transform active:scale-[0.98] sm:flex-row sm:text-xs'
              style={{
                borderColor: isActive
                  ? 'var(--section-accent)'
                  : 'rgb(var(--color-ash-gray-rgb) / 45%)',
                background: isActive
                  ? 'var(--section-accent)'
                  : 'rgb(var(--color-void-black-rgb) / 72%)',
                color: isActive ? 'var(--color-void-black)' : 'inherit'
              }}
            >
              <Icon aria-hidden className='h-4 w-4 shrink-0' />
              <span className='truncate'>
                {t(`assets:section.${tab.shortLabel}.title`)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 5: Run the bottom-tabs test**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetsBottomTabs.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run typecheck for icon imports**

Run:

```powershell
pnpm run typecheck:core
```

Expected: PASS. If a lucide icon export name fails, replace only that icon with another verified lucide export and rerun this step.

- [ ] **Step 7: Commit**

```powershell
git add src/components/assets/sectionTabs.ts src/components/assets/AssetsBottomTabs.tsx tests/ui/AssetsBottomTabs.test.tsx
git commit -m "feat: add asset bottom tab switcher"
```

---

## Task 3: Compact Asset Status Strip

**Files:**

- Create: `src/components/assets/AssetsStatusStrip.tsx`
- Modify: `src/components/assets/AssetsScene.tsx`
- Delete after migration: `src/components/assets/AssetsTopBar.tsx`
- Test: `tests/ui/AssetsStatusStrip.test.tsx`

- [ ] **Step 1: Write the failing status strip test**

Create `tests/ui/AssetsStatusStrip.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AssetsStatusStrip } from '../../src/components/assets/AssetsStatusStrip'

const mockState = vi.hoisted(() => ({
  player: { money: 1234 },
  band: {},
  social: {},
  assets: [],
  liabilities: [{ id: 'l1', principalRemaining: 450, dailyPayment: 12 }],
  crowdfundCampaigns: [{ id: 'c1' }]
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock('../../src/utils/assetSelectors', () => ({
  getTotalDailyObligations: () => 37,
  getTotalDebt: () => 450
}))

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number, _language?: string, sign?: string) =>
    sign === 'always' && value > 0 ? `+${value} EUR` : `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => {
      const labels: Record<string, string> = {
        'assets:scene.title': 'Investments',
        'assets:hub.status.cash': 'Cash',
        'assets:hub.status.daily': 'Daily',
        'assets:hub.status.debt': 'Debt',
        'assets:hub.status.campaigns': 'Campaigns'
      }
      return labels[key] ?? key
    }
  })
}))

describe('AssetsStatusStrip', () => {
  it('shows cash, daily obligations, debt, and campaign count', () => {
    render(<AssetsStatusStrip />)

    expect(screen.getByText('Investments')).toBeInTheDocument()
    expect(screen.getByText('Cash')).toBeInTheDocument()
    expect(screen.getByText('1234 EUR')).toBeInTheDocument()
    expect(screen.getByText('Daily')).toBeInTheDocument()
    expect(screen.getByText('+37 EUR')).toBeInTheDocument()
    expect(screen.getByText('Debt')).toBeInTheDocument()
    expect(screen.getByText('450 EUR')).toBeInTheDocument()
    expect(screen.getByText('Campaigns')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetsStatusStrip.test.tsx
```

Expected: FAIL because `AssetsStatusStrip` does not exist.

- [ ] **Step 3: Implement status strip**

Create `src/components/assets/AssetsStatusStrip.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import {
  getTotalDailyObligations,
  getTotalDebt
} from '../../utils/assetSelectors'
import { formatCurrency } from '../../utils/numberUtils'

const StatusCell = ({
  label,
  value,
  tone = 'neutral'
}: {
  label: string
  value: string | number
  tone?: 'neutral' | 'good' | 'warning' | 'danger'
}) => {
  const color =
    tone === 'danger'
      ? 'var(--color-blood-red-bright)'
      : tone === 'warning'
        ? 'var(--color-warning-yellow)'
        : tone === 'good'
          ? 'var(--color-toxic-green)'
          : 'var(--color-star-white)'

  return (
    <div className='min-w-0 border-l-2 px-2 py-1 first:border-l-0 sm:px-3'>
      <span className='block truncate text-[0.62rem] uppercase opacity-60'>
        {label}
      </span>
      <strong
        className='block truncate text-xs leading-tight sm:text-sm'
        style={{ color }}
      >
        {value}
      </strong>
    </div>
  )
}

export const AssetsStatusStrip = () => {
  const { t, i18n } = useTranslation(['assets'])
  const money = useGameSelector(state => state.player.money)
  const obligations = useGameSelector(getTotalDailyObligations)
  const totalDebt = useGameSelector(getTotalDebt)
  const campaignCount = useGameSelector(state => state.crowdfundCampaigns.length)

  return (
    <header className='assets-hub-panel assets-hub-reveal mx-2 mt-2 overflow-hidden sm:mx-4'>
      <div className='flex items-center justify-between border-b-2 px-2 py-1 sm:px-3'>
        <h1 className='assets-hub-title truncate text-lg uppercase sm:text-2xl'>
          {t('assets:scene.title')}
        </h1>
        <span className='assets-hub-control text-[0.62rem] uppercase opacity-60'>
          {t('assets:scene.subtitle')}
        </span>
      </div>
      <div className='grid grid-cols-4 divide-x divide-[rgb(var(--color-ash-gray-rgb)_/_35%)]'>
        <StatusCell
          label={t('assets:hub.status.cash')}
          value={formatCurrency(money, i18n.language)}
          tone={money < 0 ? 'danger' : 'good'}
        />
        <StatusCell
          label={t('assets:hub.status.daily')}
          value={formatCurrency(obligations, i18n.language, 'always')}
          tone={obligations > 0 ? 'danger' : 'good'}
        />
        <StatusCell
          label={t('assets:hub.status.debt')}
          value={
            totalDebt > 0
              ? formatCurrency(totalDebt, i18n.language)
              : t('assets:hub.status.noDebt')
          }
          tone={totalDebt > 0 ? 'warning' : 'neutral'}
        />
        <StatusCell
          label={t('assets:hub.status.campaigns')}
          value={campaignCount}
          tone={campaignCount > 0 ? 'warning' : 'neutral'}
        />
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Wire status strip in `AssetsScene`**

Replace the `AssetsTopBar` import with:

```ts
import { AssetsStatusStrip } from './AssetsStatusStrip'
```

Replace `<AssetsTopBar />` with:

```tsx
<AssetsStatusStrip />
```

Remove `src/components/assets/AssetsTopBar.tsx` after no imports remain:

```powershell
rg "AssetsTopBar" src tests
Remove-Item -LiteralPath src\components\assets\AssetsTopBar.tsx
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetsStatusStrip.test.tsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/components/assets/AssetsStatusStrip.tsx src/components/assets/AssetsScene.tsx tests/ui/AssetsStatusStrip.test.tsx
git add -u src/components/assets/AssetsTopBar.tsx
git commit -m "feat: add compact asset status strip"
```

---

## Task 4: Slot Action List

**Files:**

- Create: `src/components/assets/AssetSlotActionList.tsx`
- Test: `tests/ui/AssetSlotActionList.test.tsx`

- [ ] **Step 1: Write the failing slot-list test**

Create `tests/ui/AssetSlotActionList.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AssetSlotActionList } from '../../src/components/assets/AssetSlotActionList'
import type { LongTermAsset } from '../../src/types/assets'

const asset: LongTermAsset = {
  id: 'asset-1',
  kind: 'merch_workshop_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 18,
  baseDailyRevenue: 15,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.003,
  slots: [
    {
      id: 'print',
      slotType: 'mw_print',
      position: { x: 0, y: 0 },
      installedModuleId: 'mw_4color_carousel'
    },
    {
      id: 'drying',
      slotType: 'mw_drying',
      position: { x: 0, y: 0 },
      installedModuleId: null
    }
  ]
}

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const labels: Record<string, string> = {
        'assets:slot.mw_print': 'Print station',
        'assets:slot.mw_drying': 'Drying',
        'assets:module.mw_4color_carousel.name': '4-color carousel',
        'assets:module.mw_4color_carousel.description': '-25% merch cost',
        'assets:hub.slotState.empty': 'Empty',
        'assets:hub.slotState.installed': 'Installed',
        'assets:hub.actions.manageSlot': 'Manage',
        'assets:actions.install': 'Install',
        'assets:hub.accessibility.slotAction': `${opts?.slot} slot: ${opts?.state}`
      }
      return labels[key] ?? opts?.defaultValue ?? key
    }
  })
}))

describe('AssetSlotActionList', () => {
  it('renders installed and empty slots with accessible actions', () => {
    const onSlotClick = vi.fn()
    render(<AssetSlotActionList asset={asset} onSlotClick={onSlotClick} />)

    expect(screen.getByText('Print station')).toBeInTheDocument()
    expect(screen.getByText('4-color carousel')).toBeInTheDocument()
    expect(screen.getByText('-25% merch cost')).toBeInTheDocument()
    expect(screen.getByText('Drying')).toBeInTheDocument()
    expect(screen.getByText('Empty')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Print station slot: Installed: 4-color carousel'
      })
    )
    expect(onSlotClick).toHaveBeenCalledWith('print')
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetSlotActionList.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement slot action list**

Create `src/components/assets/AssetSlotActionList.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'
import type { LongTermAsset } from '../../types/assets'

interface AssetSlotActionListProps {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

const getConditionState = (condition: number): 'good' | 'warning' | 'broken' => {
  if (condition < 20) return 'broken'
  if (condition < 50) return 'warning'
  return 'good'
}

export const AssetSlotActionList = ({
  asset,
  onSlotClick
}: AssetSlotActionListProps) => {
  const { t } = useTranslation(['assets'])
  const conditionState = getConditionState(asset.condition)
  const isDamaged = conditionState !== 'good'

  return (
    <div className='assets-hub-reveal flex flex-col gap-2'>
      {asset.slots.map(slot => {
        const installed = slot.installedModuleId
        const module = installed ? MODULE_REGISTRY[installed] : undefined
        const slotName = t(`assets:slot.${slot.slotType}`)
        const moduleName =
          installed !== null
            ? t(`assets:module.${installed}.name`, {
                defaultValue: installed
              })
            : null
        const stateLabel =
          moduleName !== null
            ? `${t('assets:hub.slotState.installed')}: ${moduleName}`
            : t('assets:hub.slotState.empty')
        const buttonLabel = t('assets:hub.accessibility.slotAction', {
          slot: slotName,
          state: stateLabel
        })

        return (
          <div
            key={slot.id}
            className='assets-hub-panel grid grid-cols-[1fr_auto] gap-2 px-2 py-2'
          >
            <div className='min-w-0'>
              <div className='flex min-w-0 items-center gap-2'>
                <strong className='assets-hub-control truncate text-xs uppercase text-[var(--section-accent)]'>
                  {slotName}
                </strong>
                <span className='shrink-0 border px-1 text-[0.62rem] uppercase opacity-70'>
                  {stateLabel}
                </span>
              </div>
              {moduleName !== null && (
                <p className='mt-1 truncate text-sm text-[var(--color-star-white)]'>
                  {moduleName}
                </p>
              )}
              {module && (
                <p className='mt-0.5 line-clamp-2 text-xs opacity-70'>
                  {t(`assets:module.${module.id}.description`, {
                    defaultValue: ''
                  })}
                </p>
              )}
              {isDamaged && (
                <p className='mt-1 text-[0.65rem] uppercase text-[var(--color-warning-yellow)]'>
                  {t('assets:hub.slotState.damaged')}: {t(`assets:condition.${conditionState}`)}
                </p>
              )}
            </div>
            <button
              type='button'
              aria-label={buttonLabel}
              onClick={() => onSlotClick(slot.id)}
              className='assets-hub-control min-h-11 self-center border-2 px-3 py-2 text-xs uppercase'
              style={{
                borderColor: 'var(--section-accent)',
                background: moduleName === null ? 'var(--section-accent)' : 'transparent',
                color: moduleName === null ? 'var(--color-void-black)' : 'inherit'
              }}
            >
              {moduleName === null
                ? t('assets:actions.install')
                : t('assets:hub.actions.manageSlot')}
            </button>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run the slot-list test**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetSlotActionList.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run typecheck**

Run:

```powershell
pnpm run typecheck:core
```

Expected: PASS. If Tailwind does not support `line-clamp-2` in this repo, replace that class with `overflow-hidden text-ellipsis` and rerun.

- [ ] **Step 6: Commit**

```powershell
git add src/components/assets/AssetSlotActionList.tsx tests/ui/AssetSlotActionList.test.tsx
git commit -m "feat: add asset slot action list"
```

---

## Task 5: Shared Section Deck And Panel Container

**Files:**

- Create: `src/components/assets/AssetSectionDeck.tsx`
- Create: `src/components/assets/AssetSectionPanel.tsx`
- Modify: existing section files in `src/components/assets/sections/`
- Test: update `tests/ui/MerchWorkshopSection.test.tsx`; add equivalent assertions only where current section tests already exist.

- [ ] **Step 1: Update the workshop section test for the shared deck behavior**

In `tests/ui/MerchWorkshopSection.test.tsx`, keep the existing mocks and add assertions that the slot list path opens the picker, not only the production-line hotspot path. Mock `AssetSlotActionList` if the test remains section-focused:

```tsx
vi.mock('../../src/components/assets/AssetSlotActionList', () => ({
  AssetSlotActionList: ({
    asset,
    onSlotClick
  }: {
    asset: LongTermAsset
    onSlotClick: (slotId: string) => void
  }) => (
    <button
      type='button'
      data-testid='slot-action-list'
      onClick={() => onSlotClick(asset.slots[0]?.id ?? 'missing')}
    >
      slot list
    </button>
  )
}))
```

Add this test:

```tsx
it('opens module picker from the compact slot action list', () => {
  mockState.assets = [mockAsset('workshop-1', 'merch_workshop_chassis')]

  render(<MerchWorkshopSection />)
  fireEvent.click(screen.getByTestId('slot-action-list'))

  expect(screen.getByTestId('module-picker')).toHaveTextContent(
    'workshop-1:workshop-1-slot'
  )
})
```

- [ ] **Step 2: Run the section test and verify it fails**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/MerchWorkshopSection.test.tsx
```

Expected: FAIL because the section does not render `AssetSlotActionList`.

- [ ] **Step 3: Implement `AssetSectionDeck`**

Create `src/components/assets/AssetSectionDeck.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import type { LongTermAsset } from '../../types/assets'
import { AssetSlotActionList } from './AssetSlotActionList'

interface AssetSectionDeckProps {
  asset: LongTermAsset
  hero: ReactNode
  onSlotClick: (slotId: string) => void
  onRepair: () => void
  onSell: () => void
}

export const AssetSectionDeck = ({
  asset,
  hero,
  onSlotClick,
  onRepair,
  onSell
}: AssetSectionDeckProps) => {
  const { t } = useTranslation(['assets'])
  const needsRepair = asset.condition < 50

  return (
    <article className='grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]'>
      <div className='assets-hub-panel assets-hub-reveal min-w-0 overflow-hidden p-2'>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <div className='min-w-0'>
            <h2 className='assets-hub-title truncate text-xl uppercase sm:text-2xl'>
              {t(`assets:kind.${asset.kind}`)}
            </h2>
            <p className='assets-hub-control truncate text-[0.65rem] uppercase opacity-70'>
              {t(`assets:flavor.${asset.chassisFlavor}`)} / {t(`assets:chassisTier.${asset.chassisTier}`)} / {t(`assets:mode.${asset.acquisitionMode}`)}
            </p>
          </div>
          <span className='assets-hub-control shrink-0 border-2 px-2 py-1 text-xs uppercase'>
            {asset.condition}%
          </span>
        </div>
        <div className='asset-hero-frame'>{hero}</div>
      </div>

      <div className='flex min-w-0 flex-col gap-3'>
        <div className='assets-hub-reveal grid grid-cols-3 gap-2'>
          <button
            type='button'
            onClick={onRepair}
            disabled={!needsRepair}
            className='assets-hub-control min-h-11 border-2 px-2 py-2 text-xs uppercase disabled:opacity-40'
            style={{
              borderColor: 'var(--section-accent)',
              background: needsRepair ? 'var(--section-accent)' : 'transparent',
              color: needsRepair ? 'var(--color-void-black)' : 'inherit'
            }}
          >
            {t('assets:actions.repair')}
          </button>
          <button
            type='button'
            className='assets-hub-control min-h-11 border-2 px-2 py-2 text-xs uppercase opacity-60'
            disabled
          >
            {t('assets:actions.upgrade')}
          </button>
          <button
            type='button'
            onClick={onSell}
            className='assets-hub-control min-h-11 border-2 px-2 py-2 text-xs uppercase'
            style={{ borderColor: 'var(--section-accent)' }}
          >
            {t('assets:actions.sell')}
          </button>
        </div>
        <AssetSlotActionList asset={asset} onSlotClick={onSlotClick} />
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Implement `AssetSectionPanel`**

Create `src/components/assets/AssetSectionPanel.tsx`:

```tsx
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import type { AssetKind, LongTermAsset } from '../../types/assets'
import { ChassisAcquisitionModal } from './ChassisAcquisitionModal'
import { CrowdfundCampaignCard } from './CrowdfundCampaignCard'
import { LiabilitiesPanel } from './LiabilitiesPanel'
import { ModulePickerModal } from './ModulePickerModal'
import { RepairConfirmModal } from './RepairConfirmModal'
import { SellConfirmModal } from './SellConfirmModal'
import { AssetSectionDeck } from './AssetSectionDeck'

interface AssetSectionPanelProps {
  kind: AssetKind
  renderHero: (
    asset: LongTermAsset,
    onSlotClick: (slotId: string) => void
  ) => ReactNode
}

export const AssetSectionPanel = ({
  kind,
  renderHero
}: AssetSectionPanelProps) => {
  const { t } = useTranslation(['assets'])
  const assets = useGameSelector(state => state.assets)
  const campaigns = useGameSelector(state => state.crowdfundCampaigns)
  const sectionAssets = useMemo(
    () => assets.filter(asset => asset.kind === kind),
    [assets, kind]
  )
  const sectionCampaigns = useMemo(
    () => campaigns.filter(campaign => campaign.assetSpec.kind === kind),
    [campaigns, kind]
  )
  const [picker, setPicker] = useState<{
    asset: LongTermAsset
    slotId: string
  } | null>(null)
  const [repairAsset, setRepairAsset] = useState<LongTermAsset | null>(null)
  const [sellAsset, setSellAsset] = useState<LongTermAsset | null>(null)
  const [acquireOpen, setAcquireOpen] = useState(false)

  return (
    <div className='flex flex-col gap-4 pb-24 sm:pb-4'>
      {sectionAssets.length === 0 ? (
        <section className='assets-hub-panel assets-hub-reveal p-3'>
          <h2 className='assets-hub-title text-2xl uppercase'>
            {t(`assets:kind.${kind}`)}
          </h2>
          <p className='assets-hub-control mt-1 text-sm opacity-70'>
            {t(`assets:section.${kind === 'tourbus_chassis' ? 'tourbus' : kind === 'studio_chassis' ? 'studio' : kind === 'bandhaus_chassis' ? 'bandhaus' : 'workshop'}.description`)}
          </p>
          <button
            type='button'
            onClick={() => setAcquireOpen(true)}
            className='assets-hub-control mt-3 min-h-11 border-2 px-4 py-2 text-xs uppercase'
            style={{
              borderColor: 'var(--section-accent)',
              background: 'var(--section-accent)',
              color: 'var(--color-void-black)'
            }}
          >
            {t('assets:hub.actions.acquire')}
          </button>
        </section>
      ) : (
        sectionAssets.map(asset => (
          <AssetSectionDeck
            key={asset.id}
            asset={asset}
            hero={renderHero(asset, slotId => setPicker({ asset, slotId }))}
            onSlotClick={slotId => setPicker({ asset, slotId })}
            onRepair={() => setRepairAsset(asset)}
            onSell={() => setSellAsset(asset)}
          />
        ))
      )}

      <section className='assets-hub-panel assets-hub-reveal p-3'>
        <h3 className='assets-hub-title text-lg uppercase'>
          {t('assets:hub.finance.title')}
        </h3>
        <div className='mt-2 flex flex-col gap-2'>
          <LiabilitiesPanel />
          {sectionCampaigns.length === 0 ? (
            <p className='assets-hub-control text-xs opacity-60'>
              {t('assets:hub.finance.noCampaigns')}
            </p>
          ) : (
            sectionCampaigns.map(campaign => (
              <CrowdfundCampaignCard key={campaign.id} campaign={campaign} />
            ))
          )}
        </div>
      </section>

      <ChassisAcquisitionModal
        kind={kind}
        isOpen={acquireOpen}
        onClose={() => setAcquireOpen(false)}
      />
      {picker && (
        <ModulePickerModal
          asset={picker.asset}
          slotId={picker.slotId}
          isOpen
          onClose={() => setPicker(null)}
        />
      )}
      {repairAsset && (
        <RepairConfirmModal
          asset={repairAsset}
          isOpen
          onClose={() => setRepairAsset(null)}
        />
      )}
      {sellAsset && (
        <SellConfirmModal
          asset={sellAsset}
          isOpen
          onClose={() => setSellAsset(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Migrate the four section wrappers**

Replace the body of each section file with the matching `AssetSectionPanel` wrapper.

`src/components/assets/sections/TourbusSection.tsx`:

```tsx
import { AssetSectionPanel } from '../AssetSectionPanel'
import { TourbusVehicleView } from './TourbusVehicleView'

export const TourbusSection = () => (
  <AssetSectionPanel
    kind='tourbus_chassis'
    renderHero={(asset, onSlotClick) => (
      <TourbusVehicleView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
```

`src/components/assets/sections/StudioSection.tsx`:

```tsx
import { AssetSectionPanel } from '../AssetSectionPanel'
import { StudioFloorplanView } from './StudioFloorplanView'

export const StudioSection = () => (
  <AssetSectionPanel
    kind='studio_chassis'
    renderHero={(asset, onSlotClick) => (
      <StudioFloorplanView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
```

`src/components/assets/sections/BandhausSection.tsx`:

```tsx
import { AssetSectionPanel } from '../AssetSectionPanel'
import { BandhausCrossSectionView } from './BandhausCrossSectionView'

export const BandhausSection = () => (
  <AssetSectionPanel
    kind='bandhaus_chassis'
    renderHero={(asset, onSlotClick) => (
      <BandhausCrossSectionView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
```

`src/components/assets/sections/MerchWorkshopSection.tsx`:

```tsx
import { AssetSectionPanel } from '../AssetSectionPanel'
import { WorkshopProductionLineView } from './WorkshopProductionLineView'

export const MerchWorkshopSection = () => (
  <AssetSectionPanel
    kind='merch_workshop_chassis'
    renderHero={(asset, onSlotClick) => (
      <WorkshopProductionLineView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
```

- [ ] **Step 6: Run migrated section tests**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/MerchWorkshopSection.test.tsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/components/assets/AssetSectionDeck.tsx src/components/assets/AssetSectionPanel.tsx src/components/assets/sections/TourbusSection.tsx src/components/assets/sections/StudioSection.tsx src/components/assets/sections/BandhausSection.tsx src/components/assets/sections/MerchWorkshopSection.tsx tests/ui/MerchWorkshopSection.test.tsx
git commit -m "feat: add shared asset section deck"
```

---

## Task 6: Localized Hero Alt Text And Mobile Hero Framing

**Files:**

- Modify: `src/components/assets/sections/TourbusVehicleView.tsx`
- Modify: `src/components/assets/sections/StudioFloorplanView.tsx`
- Modify: `src/components/assets/sections/BandhausCrossSectionView.tsx`
- Modify: `src/components/assets/sections/WorkshopProductionLineView.tsx`
- Modify: visual view tests for these four files.

- [ ] **Step 1: Update visual view tests for localized alt text**

In `tests/ui/TourbusVehicleView.test.tsx`, add a `react-i18next` mock and assert the background image alt is localized:

```tsx
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      key === 'assets:section.tourbus.alt'
        ? 'Localized tourbus side view'
        : options?.defaultValue ?? key
  })
}))

it('uses localized background alt text', () => {
  const asset = mockAsset([
    { id: 's1', slotType: 'tb_roof', installedModuleId: null }
  ])
  render(<TourbusVehicleView asset={asset} onSlotClick={vi.fn()} />)
  expect(
    screen.getByRole('img', { name: 'Localized tourbus side view' })
  ).toBeInTheDocument()
})
```

Add equivalent localized-alt tests to:

```powershell
tests/ui/StudioFloorplanView.test.tsx
tests/ui/BandhausCrossSectionView.test.tsx
tests/ui/WorkshopProductionLineView.test.tsx
```

Use these expected names:

```ts
'Localized studio floorplan'
'Localized bandhaus cross-section'
'Localized workshop production line'
```

- [ ] **Step 2: Run visual tests and verify failures**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/TourbusVehicleView.test.tsx tests/ui/StudioFloorplanView.test.tsx tests/ui/BandhausCrossSectionView.test.tsx tests/ui/WorkshopProductionLineView.test.tsx
```

Expected: FAIL for at least Tourbus, Studio, and Bandhaus because their alt strings are hardcoded.

- [ ] **Step 3: Localize Tourbus hero and hotspot labels**

In `TourbusVehicleView.tsx`, import `useTranslation` and `getSlotButtonAriaLabel`:

```tsx
import { useTranslation } from 'react-i18next'
import { getSlotButtonAriaLabel } from './slotLabels'
```

Inside the component:

```tsx
const { t } = useTranslation(['assets'])
```

Change the background alt:

```tsx
alt={t('assets:section.tourbus.alt')}
```

Change hotspot `aria-label`:

```tsx
aria-label={getSlotButtonAriaLabel(t, slot.slotType, installed)}
```

Change installed module thumbnail alt:

```tsx
alt={t(`assets:module.${installed}.name`, {
  defaultValue: installed
})}
```

- [ ] **Step 4: Localize Studio and Bandhaus background alts**

In `StudioFloorplanView.tsx`, change:

```tsx
alt={t('assets:section.studio.alt')}
```

In `BandhausCrossSectionView.tsx`, change:

```tsx
alt={t('assets:section.bandhaus.alt')}
```

Keep the existing installed-module alt behavior.

- [ ] **Step 5: Add mobile hero framing classes**

Wrap each view root with a class that lets `assetsHub.css` manage mobile framing:

```tsx
<div className='asset-hero-visual relative'>
```

For workshop only, use:

```tsx
<div className='asset-hero-visual asset-hero-visual--wide relative'>
```

Add this to `assetsHub.css`:

```css
.asset-hero-frame {
  overflow: hidden;
}

.asset-hero-visual {
  min-width: 0;
}

@media (max-width: 640px) {
  .asset-hero-visual--wide {
    min-height: 12rem;
  }

  .asset-hero-visual--wide > *:first-child {
    min-height: 12rem;
  }
}
```

- [ ] **Step 6: Run visual tests and typecheck**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/TourbusVehicleView.test.tsx tests/ui/StudioFloorplanView.test.tsx tests/ui/BandhausCrossSectionView.test.tsx tests/ui/WorkshopProductionLineView.test.tsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/components/assets/sections/TourbusVehicleView.tsx src/components/assets/sections/StudioFloorplanView.tsx src/components/assets/sections/BandhausCrossSectionView.tsx src/components/assets/sections/WorkshopProductionLineView.tsx src/components/assets/assetsHub.css tests/ui/TourbusVehicleView.test.tsx tests/ui/StudioFloorplanView.test.tsx tests/ui/BandhausCrossSectionView.test.tsx tests/ui/WorkshopProductionLineView.test.tsx
git commit -m "fix: localize asset hero accessibility labels"
```

---

## Task 7: AssetsScene Mobile Shell Integration

**Files:**

- Modify: `src/components/assets/AssetsScene.tsx`
- Test: `tests/ui/AssetsScene.test.tsx`

- [ ] **Step 1: Write the failing scene-shell test**

Create `tests/ui/AssetsScene.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AssetsScene } from '../../src/components/assets/AssetsScene'

const mockChangeScene = vi.fn()
const mockState = vi.hoisted(() => ({
  player: { money: 1000 },
  band: {},
  social: {},
  assets: [],
  liabilities: [],
  crowdfundCampaigns: []
}))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ changeScene: mockChangeScene }),
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock('../../src/utils/assetSelectors', () => ({
  getTotalDailyObligations: () => 0,
  getTotalDebt: () => 0
}))

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => {
      const labels: Record<string, string> = {
        'assets:scene.title': 'Investments',
        'assets:scene.subtitle': 'Long-term assets and finances',
        'assets:scene.back': 'Back',
        'assets:hub.accessibility.sectionTabs': 'Asset sections',
        'assets:hub.status.cash': 'Cash',
        'assets:hub.status.daily': 'Daily',
        'assets:hub.status.debt': 'Debt',
        'assets:hub.status.noDebt': 'No debt',
        'assets:hub.status.campaigns': 'Campaigns',
        'assets:section.tourbus.title': 'Tourbus',
        'assets:section.studio.title': 'Studio',
        'assets:section.bandhaus.title': 'Band House',
        'assets:section.workshop.title': 'Workshop',
        'assets:kind.tourbus_chassis': 'Tourbus',
        'assets:kind.studio_chassis': 'Studio',
        'assets:kind.bandhaus_chassis': 'Band House',
        'assets:kind.merch_workshop_chassis': 'Workshop',
        'assets:section.tourbus.description': 'Rolling stage',
        'assets:section.studio.description': 'Cut songs',
        'assets:section.bandhaus.description': 'HQ',
        'assets:section.workshop.description': 'Print merch',
        'assets:hub.actions.acquire': 'Acquire',
        'assets:hub.finance.title': 'Finance',
        'assets:hub.finance.noCampaigns': 'No active campaigns',
        'assets:liability.paymentDue': 'Payment due: -'
      }
      return labels[key] ?? key
    }
  })
}))

describe('AssetsScene', () => {
  it('renders mobile shell with preserved tab ids and panel ids', () => {
    render(<AssetsScene />)

    const tablist = screen.getByRole('tablist', { name: 'Asset sections' })
    expect(tablist).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'id',
      'assets-panel-tourbus_chassis'
    )

    const studioTab = screen.getByRole('tab', { name: /Studio/ })
    expect(studioTab).toHaveAttribute('id', 'assets-tab-studio_chassis')
    expect(studioTab).toHaveAttribute(
      'aria-controls',
      'assets-panel-studio_chassis'
    )

    fireEvent.click(studioTab)
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'id',
      'assets-panel-studio_chassis'
    )
  })
})
```

- [ ] **Step 2: Run the scene-shell test and verify it fails**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetsScene.test.tsx
```

Expected: FAIL before `AssetsScene` is migrated to the new shell.

- [ ] **Step 3: Update `AssetsScene` imports**

Use these imports:

```tsx
import { useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import type { AssetKind } from '../../types/assets'
import { AssetsBottomTabs } from './AssetsBottomTabs'
import { AssetsStatusStrip } from './AssetsStatusStrip'
import { ASSET_SECTION_TABS } from './sectionTabs'
import { DEFAULT_SECTION_ACCENT, SECTION_VIEWS } from './sectionRegistry'
import './assetsHub.css'
```

- [ ] **Step 4: Replace the scene layout**

Replace the component return with:

```tsx
return (
  <div
    className='assets-hub relative flex h-full w-full flex-col overflow-hidden text-toxic-green'
    style={wrapperStyle}
  >
    <AssetsStatusStrip />

    <div className='flex items-center justify-between gap-2 px-2 py-2 sm:px-4'>
      <p className='assets-hub-control min-w-0 truncate text-xs uppercase opacity-70'>
        {t(`assets:section.${activeTab.shortLabel}.description`)}
      </p>
      <button
        type='button'
        onClick={() => changeScene(GAME_PHASES.OVERWORLD)}
        className='assets-hub-control min-h-11 shrink-0 border-2 px-3 py-2 text-xs uppercase'
        style={{
          borderColor: 'var(--section-accent)',
          color: 'var(--section-accent)'
        }}
      >
        {t('assets:scene.back')}
      </button>
    </div>

    <section
      key={active}
      id={`assets-panel-${active}`}
      className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 sm:px-4 sm:pb-4'
      role='tabpanel'
      aria-labelledby={`assets-tab-${active}`}
    >
      {activeView ? (
        <activeView.Component />
      ) : (
        <p className='assets-hub-control text-sm opacity-60'>
          {t('assets:scene.noSectionRegistered')}
        </p>
      )}
    </section>

    <AssetsBottomTabs active={active} onSelect={setActive} />
  </div>
)
```

Replace the old `TABS` constant with `ASSET_SECTION_TABS`:

```tsx
const activeTab =
  ASSET_SECTION_TABS.find(tab => tab.key === active) ?? ASSET_SECTION_TABS[0]
```

- [ ] **Step 5: Run scene tests and typecheck**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetsScene.test.tsx tests/ui/AssetsBottomTabs.test.tsx tests/ui/AssetsStatusStrip.test.tsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/components/assets/AssetsScene.tsx tests/ui/AssetsScene.test.tsx
git commit -m "feat: redesign asset scene mobile shell"
```

---

## Task 8: Asset Modals Mobile Sheet Polish

**Files:**

- Modify: `src/components/assets/ModulePickerModal.tsx`
- Modify: `src/components/assets/ChassisAcquisitionModal.tsx`
- Modify: `src/components/assets/RepairConfirmModal.tsx`
- Modify: `src/components/assets/SellConfirmModal.tsx`
- Modify: `src/components/assets/CrowdfundSetupModal.tsx`
- Existing modal tests if snapshots or class assertions exist.

- [ ] **Step 1: Add modal class expectations to one focused existing modal test**

If no asset modal test exists, add a small assertion to `tests/ui/MerchWorkshopSection.test.tsx` mock coverage is not enough. Create `tests/ui/AssetModalSheetClasses.test.tsx` and mock the shared `Modal` to capture className:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ModulePickerModal } from '../../src/components/assets/ModulePickerModal'

const captured = vi.hoisted(() => ({ className: '' }))

vi.mock('../../src/ui/shared/Modal', () => ({
  Modal: ({ className }: { className?: string }) => {
    captured.className = className ?? ''
    return <div data-testid='modal' />
  }
}))
```

Use a minimal valid `LongTermAsset` fixture and assert:

```tsx
expect(captured.className).toContain('assets-modal-sheet')
```

- [ ] **Step 2: Run the modal class test and verify it fails**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetModalSheetClasses.test.tsx
```

Expected: FAIL because asset modals do not pass `assets-modal-sheet`.

- [ ] **Step 3: Add `assets-modal-sheet` to asset modal className props**

Change each asset modal `Modal` call to include the class:

```tsx
className='assets-modal-sheet max-w-3xl'
```

Use the existing max width per file:

```tsx
// ModulePickerModal.tsx
className='assets-modal-sheet max-w-3xl'

// ChassisAcquisitionModal.tsx
className='assets-modal-sheet max-w-2xl'

// RepairConfirmModal.tsx
className='assets-modal-sheet max-w-lg'

// SellConfirmModal.tsx
className='assets-modal-sheet max-w-lg'

// CrowdfundSetupModal.tsx
className='assets-modal-sheet max-w-lg'
```

- [ ] **Step 4: Keep existing modal content intact**

Do not change reducer calls or acquisition logic. Only className and small mobile spacing classes are in scope. If a modal button is shorter than 44px on mobile, change button classes from:

```tsx
className='border-2 px-3 py-1'
```

to:

```tsx
className='min-h-11 border-2 px-3 py-2'
```

- [ ] **Step 5: Run modal tests and typecheck**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetModalSheetClasses.test.tsx tests/ui/MerchWorkshopSection.test.tsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/components/assets/ModulePickerModal.tsx src/components/assets/ChassisAcquisitionModal.tsx src/components/assets/RepairConfirmModal.tsx src/components/assets/SellConfirmModal.tsx src/components/assets/CrowdfundSetupModal.tsx tests/ui/AssetModalSheetClasses.test.tsx
git commit -m "feat: polish asset modals for mobile sheets"
```

---

## Task 9: Focused UI Regression Pass

**Files:**

- Modify tests only if current assertions reference removed top-strip markup.

- [ ] **Step 1: Run focused asset UI suites**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetsScene.test.tsx tests/ui/AssetsBottomTabs.test.tsx tests/ui/AssetsStatusStrip.test.tsx tests/ui/AssetSlotActionList.test.tsx tests/ui/MerchWorkshopSection.test.tsx tests/ui/TourbusVehicleView.test.tsx tests/ui/StudioFloorplanView.test.tsx tests/ui/BandhausCrossSectionView.test.tsx tests/ui/WorkshopProductionLineView.test.tsx tests/ui/TourbusTrailerOverlay.test.tsx tests/ui/GeneratedImagePanel.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Fix stale assertions with UI-preserving changes**

If a test fails because it expects the old top tab strip, update it to assert:

```tsx
const tablist = screen.getByRole('tablist', { name: 'Asset sections' })
const tab = screen.getByRole('tab', { name: /.../ })
const panel = screen.getByRole('tabpanel')
expect(panel.id).toBe(tab.getAttribute('aria-controls'))
expect(panel.getAttribute('aria-labelledby')).toBe(tab.id)
```

If a test fails because the purchase button label changed from `assets:actions.purchase` to `assets:hub.actions.acquire`, update the test translation mock to return `Acquire` for `assets:hub.actions.acquire` and query:

```tsx
screen.getByRole('button', { name: 'Acquire' })
```

- [ ] **Step 3: Rerun focused asset UI suites**

Run the same command from Step 1.

Expected: PASS.

- [ ] **Step 4: Commit test maintenance if any was needed**

```powershell
git add tests/ui
git commit -m "test: update asset hub ui expectations"
```

Skip this commit if Step 2 required no edits.

---

## Task 10: Browser Visual Validation

**Files:**

- Modify CSS/TSX only for verified visual defects.

- [ ] **Step 1: Start the dev server**

Run:

```powershell
pnpm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`. Keep this process running for browser validation.

- [ ] **Step 2: Open the app in the browser tool**

Use the Browser plugin or Playwright MCP to open the Vite URL. Navigate to a state that shows `GAME_PHASES.ASSETS`. If manual state setup is faster, use the existing app controls or test fixture injection flow already used by screenshot tests.

- [ ] **Step 3: Validate phone portrait widths**

Check these viewport sizes:

```text
360x800
390x844
430x932
```

For each viewport, verify:

- status strip fits without horizontal page scroll;
- asset art is visible before the slot list;
- at least the start of the slot/action list is discoverable below the hero;
- bottom tabs do not cover the last row when scrolled to the bottom;
- each bottom tab has a clear active state;
- primary buttons are at least 44px tall;
- no text overlaps or spills out of buttons;
- workshop hero is not reduced to an unreadable thin strip.

- [ ] **Step 4: Validate desktop adaptation**

Check a desktop viewport such as:

```text
1280x800
```

Verify:

- status strip remains compact;
- art and slot list use the available width cleanly;
- bottom tabs remain usable or dock cleanly;
- no section looks like an unrelated desktop-only layout.

- [ ] **Step 5: Patch verified visual defects**

Keep fixes CSS-first. Example acceptable patch if bottom tabs cover content:

```css
@media (max-width: 640px) {
  .assets-hub section[role='tabpanel'] {
    padding-bottom: 6rem;
  }
}
```

Example acceptable patch if slot rows crowd at 360px:

```tsx
className='assets-hub-panel grid grid-cols-1 gap-2 px-2 py-2 min-[390px]:grid-cols-[1fr_auto]'
```

- [ ] **Step 6: Re-run focused tests after visual patches**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetsScene.test.tsx tests/ui/AssetSlotActionList.test.tsx tests/ui/MerchWorkshopSection.test.tsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit visual polish**

```powershell
git add src/components/assets src/index.css tests/ui
git commit -m "fix: polish mobile asset hub layout"
```

---

## Task 11: Final Validation

**Files:**

- No planned edits.

- [ ] **Step 1: Run focused UI tests**

Run:

```powershell
pnpm run test:ui:file -- tests/ui/AssetsScene.test.tsx tests/ui/AssetsBottomTabs.test.tsx tests/ui/AssetsStatusStrip.test.tsx tests/ui/AssetSlotActionList.test.tsx tests/ui/MerchWorkshopSection.test.tsx tests/ui/TourbusVehicleView.test.tsx tests/ui/StudioFloorplanView.test.tsx tests/ui/BandhausCrossSectionView.test.tsx tests/ui/WorkshopProductionLineView.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run broader UI suite**

Run:

```powershell
pnpm run test:ui
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```powershell
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 4: Run fast test gate**

Run:

```powershell
pnpm run test
```

Expected: PASS.

- [ ] **Step 5: Run diff hygiene**

Run:

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` exits 0. `git status --short` shows no uncommitted files after the final task commit.

- [ ] **Step 6: Summarize validation evidence**

In the final implementation response, include:

```text
Validated:
- pnpm run test:ui:file -- tests/ui/AssetsScene.test.tsx ...
- pnpm run test:ui
- pnpm run typecheck:core
- pnpm run test
- browser checks at 360x800, 390x844, 430x932, 1280x800
```

If a command cannot be run, state the exact reason and the remaining risk.

---

## Self-Review Notes

Spec coverage:

- Mobile-first 360-430px layout: Tasks 5, 7, 10.
- Full art first plus reliable slot/action list: Tasks 4, 5, 6.
- Bottom segmented tabs: Tasks 2, 7.
- Distinctive typography, tokens, texture, motion: Task 1.
- Existing section tabs and ids preserved: Tasks 2, 7.
- i18n EN/DE alignment: Task 1.
- Accessibility labels and alt text: Tasks 2, 4, 6, 7.
- Modals mobile polish: Task 8.
- Validation: Tasks 9, 10, 11.

Implementation boundaries:

- No reducer, action creator, asset selector, or module catalog changes are planned.
- No new package dependency is planned.
- Existing `GeneratedImagePanel` remains the image path.
