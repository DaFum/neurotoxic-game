# Audit der Abhängigkeiten — 2026-11-04

## Quelle und geprüfter Stand

- Projekt: `DaFum/neurotoxic-game`, PR [#3536](https://github.com/DaFum/neurotoxic-game/pull/3536).
- Geprüfter Commit: [`08d6e11de6ba4d02a359d10f067dfa70e47c2199`](https://github.com/DaFum/neurotoxic-game/commit/08d6e11de6ba4d02a359d10f067dfa70e47c2199).
- Grundlage: gespeicherte JSON-Ausgabe von `pnpm audit --json` aus dem umfassenden Review vom 2026-11-04.
- Produktionsabhängigkeiten wurden zusätzlich mit `pnpm audit --prod --json` geprüft: **0 Befunde**.
- `package.json` und `pnpm-lock.yaml` sind gegenüber der PR-Basis `515b2fc4ea4f176ec7f2a61e8a7a426abd9c5776` unverändert.

## Zusammenfassung

| Schweregrad laut Audit | Einträge |
| ---------------------- | -------: |
| Critical               |        0 |
| High                   |       33 |
| Moderate               |       23 |
| Low                    |       12 |
| Info                   |        0 |
| **Gesamt**             |   **68** |

Die 68 Audit-Einträge verweisen auf **62 unterschiedliche GitHub-Advisories**. Ein Advisory kann mehrfach erscheinen, wenn unterschiedliche betroffene Versionsbereiche erfasst wurden. Die ursprünglichen Einträge sind unten vollständig aufgeführt.

Alle gemeldeten betroffenen Abhängigkeitspfade sind im gespeicherten Audit als Entwicklungsabhängigkeiten (`dev: true`) gekennzeichnet.

## Erneut prüfen

```bash
pnpm audit
pnpm audit --json
pnpm audit --prod
```

Die folgenden Befunde dokumentieren den gespeicherten Stand; spätere Abfragen können durch neue Advisories oder Paketänderungen andere Ergebnisse liefern.

## Vollständige Befundliste

### 01. brace-expansion — high

brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups

- Advisory: [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp)
- Betroffene Versionen: `<1.1.16`
- Gepatchte Versionen laut Audit: `>=1.1.16`
- CWE: `CWE-400, CWE-407`
- Audit-ID: `1123897`
- Betroffene installierte Versionen und Pfade:
  - Version `1.1.15`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@microsoft/eslint-formatter-sarif>eslint>@eslint/eslintrc>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>@humanwhocodes/config-array>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>file-entry-cache>flat-cache>rimraf>glob>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>matcher-collection>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>rimraf>glob>minimatch>brace-expansion`

### 02. brace-expansion — high

brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups

- Advisory: [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp)
- Betroffene Versionen: `>=2.0.0 <2.1.2`
- Gepatchte Versionen laut Audit: `>=2.1.2`
- CWE: `CWE-400, CWE-407`
- Audit-ID: `1123896`
- Betroffene installierte Versionen und Pfade:
  - Version `2.1.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>broccoli-plugin>quick-temp>rimraf>glob>minimatch>brace-expansion`
    - `.>vite-plugin-pwa>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`
    - `.>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`

### 03. brace-expansion — high

brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion

- Advisory: [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p)
- Betroffene Versionen: `<1.1.19`
- Gepatchte Versionen laut Audit: `>=1.1.19`
- CWE: `CWE-400, CWE-674`
- Audit-ID: `1240108`
- Betroffene installierte Versionen und Pfade:
  - Version `1.1.15`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@microsoft/eslint-formatter-sarif>eslint>@eslint/eslintrc>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>@humanwhocodes/config-array>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>file-entry-cache>flat-cache>rimraf>glob>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>matcher-collection>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>rimraf>glob>minimatch>brace-expansion`

### 04. brace-expansion — high

brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion

- Advisory: [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p)
- Betroffene Versionen: `>=2.0.0 <2.1.5`
- Gepatchte Versionen laut Audit: `>=2.1.5`
- CWE: `CWE-400, CWE-674`
- Audit-ID: `1240109`
- Betroffene installierte Versionen und Pfade:
  - Version `2.1.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>broccoli-plugin>quick-temp>rimraf>glob>minimatch>brace-expansion`
    - `.>vite-plugin-pwa>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`
    - `.>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`

### 05. brace-expansion — high

brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash

- Advisory: [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg)
- Betroffene Versionen: `<1.1.17`
- Gepatchte Versionen laut Audit: `>=1.1.17`
- CWE: `CWE-400, CWE-770`
- Audit-ID: `1130588`
- Betroffene installierte Versionen und Pfade:
  - Version `1.1.15`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@microsoft/eslint-formatter-sarif>eslint>@eslint/eslintrc>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>@humanwhocodes/config-array>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>file-entry-cache>flat-cache>rimraf>glob>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>matcher-collection>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>rimraf>glob>minimatch>brace-expansion`

### 06. brace-expansion — high

brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash

- Advisory: [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg)
- Betroffene Versionen: `>=2.0.0 <2.1.3`
- Gepatchte Versionen laut Audit: `>=2.1.3`
- CWE: `CWE-400, CWE-770`
- Audit-ID: `1130589`
- Betroffene installierte Versionen und Pfade:
  - Version `2.1.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>broccoli-plugin>quick-temp>rimraf>glob>minimatch>brace-expansion`
    - `.>vite-plugin-pwa>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`
    - `.>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`

### 07. brace-expansion — high

brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion

- Advisory: [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7)
- Betroffene Versionen: `<1.1.20`
- Gepatchte Versionen laut Audit: `>=1.1.20`
- CWE: `CWE-400, CWE-674`
- Audit-ID: `1240104`
- Betroffene installierte Versionen und Pfade:
  - Version `1.1.15`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@microsoft/eslint-formatter-sarif>eslint>@eslint/eslintrc>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>@humanwhocodes/config-array>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>file-entry-cache>flat-cache>rimraf>glob>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>matcher-collection>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>rimraf>glob>minimatch>brace-expansion`

### 08. brace-expansion — high

brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion

- Advisory: [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7)
- Betroffene Versionen: `>=2.0.0 <2.1.6`
- Gepatchte Versionen laut Audit: `>=2.1.6`
- CWE: `CWE-400, CWE-674`
- Audit-ID: `1240105`
- Betroffene installierte Versionen und Pfade:
  - Version `2.1.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>broccoli-plugin>quick-temp>rimraf>glob>minimatch>brace-expansion`
    - `.>vite-plugin-pwa>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`
    - `.>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`

### 09. brace-expansion — high

brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation

- Advisory: [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895)
- Betroffene Versionen: `<1.1.18`
- Gepatchte Versionen laut Audit: `>=1.1.18`
- CWE: `CWE-400, CWE-770`
- Audit-ID: `1130737`
- Betroffene installierte Versionen und Pfade:
  - Version `1.1.15`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@microsoft/eslint-formatter-sarif>eslint>@eslint/eslintrc>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>@humanwhocodes/config-array>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>file-entry-cache>flat-cache>rimraf>glob>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>matcher-collection>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>rimraf>glob>minimatch>brace-expansion`

### 10. brace-expansion — high

brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation

- Advisory: [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895)
- Betroffene Versionen: `>=2.0.0 <2.1.4`
- Gepatchte Versionen laut Audit: `>=2.1.4`
- CWE: `CWE-400, CWE-770`
- Audit-ID: `1130736`
- Betroffene installierte Versionen und Pfade:
  - Version `2.1.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>broccoli-plugin>quick-temp>rimraf>glob>minimatch>brace-expansion`
    - `.>vite-plugin-pwa>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`
    - `.>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`

### 11. fast-uri — high

fast-uri vulnerable to host confusion via failed IDN canonicalization

- Advisory: [GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6)
- Betroffene Versionen: `>=3.0.0 <3.1.3`
- Gepatchte Versionen laut Audit: `>=3.1.3`
- CWE: `CWE-436, CWE-551`
- Audit-ID: `1204921`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`

### 12. fast-uri — high

fast-uri vulnerable to host confusion via backslash authority introducer

- Advisory: [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7)
- Betroffene Versionen: `>=3.0.0 <3.1.5`
- Gepatchte Versionen laut Audit: `>=3.1.5`
- CWE: `CWE-436`
- Audit-ID: `1130720`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`

### 13. fast-uri — high

fast-uri vulnerable to server-side request forgery via malformed IPv6 normalization

- Advisory: [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc)
- Betroffene Versionen: `>=3.0.0 <3.1.6`
- Gepatchte Versionen laut Audit: `>=3.1.6`
- CWE: `CWE-20, CWE-918`
- Audit-ID: `1158524`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`

### 14. fast-uri — high

fast-uri vulnerable to server-side request forgery via repeated hostname percent-decoding

- Advisory: [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf)
- Betroffene Versionen: `>=3.1.2 <3.1.6`
- Gepatchte Versionen laut Audit: `>=3.1.6`
- CWE: `CWE-174, CWE-918`
- Audit-ID: `1158527`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`

### 15. fast-uri — high

fast-uri vulnerable to host confusion via percent-encoded scheme normalization

- Advisory: [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp)
- Betroffene Versionen: `>=3.0.0 <3.1.6`
- Gepatchte Versionen laut Audit: `>=3.1.6`
- CWE: `CWE-177`
- Audit-ID: `1158530`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`

### 16. fast-uri — high

fast-uri vulnerable to authority injection via an unvalidated port in serialize

- Advisory: [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3)
- Betroffene Versionen: `>=3.0.0 <3.1.7`
- Gepatchte Versionen laut Audit: `>=3.1.7`
- CWE: `CWE-116`
- Audit-ID: `1239943`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`

### 17. fast-uri — high

fast-uri vulnerable to host confusion via literal backslash authority delimiter

- Advisory: [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx)
- Betroffene Versionen: `>=3.0.0 <=3.1.3`
- Gepatchte Versionen laut Audit: `>=3.1.4`
- CWE: `CWE-436`
- Audit-ID: `1124064`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`

### 18. js-yaml — high

js-yaml: maxTotalMergeKeys does not limit CPU use for empty merge sources

- Advisory: [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh)
- Betroffene Versionen: `>=4.0.0 <4.3.2`
- Gepatchte Versionen laut Audit: `>=4.3.2`
- CWE: `CWE-400, CWE-407`
- Audit-ID: `1193727`
- Betroffene installierte Versionen und Pfade:
  - Version `4.1.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>js-yaml`

### 19. js-yaml — high

js-yaml: YAML merge-key chains can force quadratic CPU consumption

- Advisory: [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m)
- Betroffene Versionen: `>=4.0.0 <4.3.0`
- Gepatchte Versionen laut Audit: `>=4.3.0`
- CWE: `CWE-400, CWE-407`
- Audit-ID: `1123911`
- Betroffene installierte Versionen und Pfade:
  - Version `4.1.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>js-yaml`

### 20. js-yaml — high

JS-YAML: Quadratic CPU consumption in !!omap resolution (3.x and 4.x) — CVE-2026-59870 fix not backported

- Advisory: [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj)
- Betroffene Versionen: `>=4.0.0 <4.3.1`
- Gepatchte Versionen laut Audit: `>=4.3.1`
- CWE: `CWE-407`
- Audit-ID: `1138115`
- Betroffene installierte Versionen und Pfade:
  - Version `4.1.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>js-yaml`

### 21. markdown-it — high

markdown-it: Quadratic-time rendering of a single multi-line link reference definition with default options (regression since 14.0)

- Advisory: [GHSA-gfr2-rv44-r23c](https://github.com/advisories/GHSA-gfr2-rv44-r23c)
- Betroffene Versionen: `>=15.0.0 <15.0.3`
- Gepatchte Versionen laut Audit: `>=15.0.3`
- CWE: `CWE-400, CWE-407`
- Audit-ID: `1242671`
- Betroffene installierte Versionen und Pfade:
  - Version `15.0.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>markdownlint-cli2>markdown-it`

### 22. markdown-it — high

markdown-it: Quadratic complexity in smartquotes with unmatched closing quotes

- Advisory: [GHSA-r7fv-28h4-cvq7](https://github.com/advisories/GHSA-r7fv-28h4-cvq7)
- Betroffene Versionen: `>=15.0.0 <15.0.2`
- Gepatchte Versionen laut Audit: `>=15.0.2`
- CWE: `CWE-400, CWE-407`
- Audit-ID: `1242601`
- Betroffene installierte Versionen und Pfade:
  - Version `15.0.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>markdownlint-cli2>markdown-it`

### 23. source-map-js — high

source-map-js allows event-loop denial of service through indexed source-map section offsets

- Advisory: [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)
- Betroffene Versionen: `>=1.0.0 <1.2.2`
- Gepatchte Versionen laut Audit: `>=1.2.2`
- CWE: `CWE-1284`
- Audit-ID: `1241209`
- Betroffene installierte Versionen und Pfade:
  - Version `1.2.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@tailwindcss/postcss>@tailwindcss/node>source-map-js`

### 24. undici — high

undici vulnerable to TLS certificate validation bypass via dropped tls options in Agent

- Advisory: [GHSA-2m5v-pch6-74hx](https://github.com/advisories/GHSA-2m5v-pch6-74hx)
- Betroffene Versionen: `>=7.0.0 <7.30.1`
- Gepatchte Versionen laut Audit: `>=7.30.1`
- CWE: `CWE-295`
- Audit-ID: `1243475`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 25. undici — high

undici vulnerable to cross-user information disclosure and parse-time crash via degenerate private cache directives

- Advisory: [GHSA-4cwx-7wf7-3272](https://github.com/advisories/GHSA-4cwx-7wf7-3272)
- Betroffene Versionen: `>=7.0.0 <7.29.0`
- Gepatchte Versionen laut Audit: `>=7.29.0`
- CWE: `CWE-200, CWE-248, CWE-525`
- Audit-ID: `1130718`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 26. undici — high

undici vulnerable to cache poisoning and cross-user disclosure via cross-origin redirects

- Advisory: [GHSA-4w7w-5xrc-9h26](https://github.com/advisories/GHSA-4w7w-5xrc-9h26)
- Betroffene Versionen: `>=7.0.0 <7.30.1`
- Gepatchte Versionen laut Audit: `>=7.30.1`
- CWE: `CWE-346, CWE-524`
- Audit-ID: `1243473`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 27. undici — high

undici vulnerable to cross-origin request routing via SOCKS5 proxy pool reuse

- Advisory: [GHSA-hm92-r4w5-c3mj](https://github.com/advisories/GHSA-hm92-r4w5-c3mj)
- Betroffene Versionen: `>=7.23.0 <7.28.0`
- Gepatchte Versionen laut Audit: `>=7.28.0`
- CWE: `CWE-346`
- Audit-ID: `1121247`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 28. undici — high

undici vulnerable to Denial of Service via TLS 1.2 certificate-changing renegotiation

- Advisory: [GHSA-qrxm-fqhp-jwvm](https://github.com/advisories/GHSA-qrxm-fqhp-jwvm)
- Betroffene Versionen: `>=7.0.0 <7.30.1`
- Gepatchte Versionen laut Audit: `>=7.30.1`
- CWE: `CWE-248, CWE-617`
- Audit-ID: `1243478`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 29. undici — high

undici vulnerable to Denial of Service via unrequested WebSocket subprotocol

- Advisory: [GHSA-rfgv-xxqx-mfg5](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5)
- Betroffene Versionen: `>=7.0.0 <7.29.1`
- Gepatchte Versionen laut Audit: `>=7.29.1`
- CWE: `CWE-248, CWE-252`
- Audit-ID: `1240041`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 30. undici — high

undici vulnerable to TLS certificate validation bypass via dropped requestTls in SOCKS5 ProxyAgent

- Advisory: [GHSA-vmh5-mc38-953g](https://github.com/advisories/GHSA-vmh5-mc38-953g)
- Betroffene Versionen: `>=7.23.0 <7.28.0`
- Gepatchte Versionen laut Audit: `>=7.28.0`
- CWE: `CWE-295`
- Audit-ID: `1121187`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 31. undici — high

undici WebSocket client vulnerable to denial of service via fragment count bypass

- Advisory: [GHSA-vxpw-j846-p89q](https://github.com/advisories/GHSA-vxpw-j846-p89q)
- Betroffene Versionen: `>=7.0.0 <7.28.0`
- Gepatchte Versionen laut Audit: `>=7.28.0`
- CWE: `CWE-400, CWE-770`
- Audit-ID: `1244533`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 32. undici — high

undici vulnerable to TLS certificate validation bypass via dropped connect options in BalancedPool

- Advisory: [GHSA-w293-vg96-wgc3](https://github.com/advisories/GHSA-w293-vg96-wgc3)
- Betroffene Versionen: `>=7.24.1 <7.29.1`
- Gepatchte Versionen laut Audit: `>=7.29.1`
- CWE: `CWE-295`
- Audit-ID: `1240050`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 33. undici — high

undici vulnerable to Denial of Service via unhandled error on excessive content-encodings

- Advisory: [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c)
- Betroffene Versionen: `>=7.18.0 <7.30.1`
- Gepatchte Versionen laut Audit: `>=7.30.1`
- CWE: `CWE-248, CWE-459`
- Audit-ID: `1243113`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 34. brace-expansion — moderate

brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service

- Advisory: [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr)
- Betroffene Versionen: `<1.1.21`
- Gepatchte Versionen laut Audit: `>=1.1.21`
- CWE: `CWE-400, CWE-407`
- Audit-ID: `1240100`
- Betroffene installierte Versionen und Pfade:
  - Version `1.1.15`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@microsoft/eslint-formatter-sarif>eslint>@eslint/eslintrc>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>@humanwhocodes/config-array>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>file-entry-cache>flat-cache>rimraf>glob>minimatch>brace-expansion`
    - `.>@microsoft/eslint-formatter-sarif>eslint>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>matcher-collection>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>fs-merger>walk-sync>minimatch>brace-expansion`
    - `.>i18next-parser>broccoli-plugin>rimraf>glob>minimatch>brace-expansion`

### 35. brace-expansion — moderate

brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service

- Advisory: [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr)
- Betroffene Versionen: `>=2.0.0 <2.1.7`
- Gepatchte Versionen laut Audit: `>=2.1.7`
- CWE: `CWE-400, CWE-407`
- Audit-ID: `1240101`
- Betroffene installierte Versionen und Pfade:
  - Version `2.1.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>broccoli-plugin>quick-temp>rimraf>glob>minimatch>brace-expansion`
    - `.>vite-plugin-pwa>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`
    - `.>workbox-build>@trickfilm400/rollup-plugin-off-main-thread>ejs>jake>filelist>minimatch>brace-expansion`

### 36. fast-uri — moderate

fast-uri vulnerable to inconsistent host case normalization via percent-encoded octets

- Advisory: [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj)
- Betroffene Versionen: `>=3.0.0 <3.1.8`
- Gepatchte Versionen laut Audit: `>=3.1.8`
- CWE: `CWE-178`
- Audit-ID: `1240091`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`

### 37. fast-uri — moderate

fast-uri vulnerable to URI scheme spoofing via percent-encoded scheme decoding

- Advisory: [GHSA-w74x-v6f9-j3xg](https://github.com/advisories/GHSA-w74x-v6f9-j3xg)
- Betroffene Versionen: `>=3.0.0 <3.1.9`
- Gepatchte Versionen laut Audit: `>=3.1.9`
- CWE: `CWE-172, CWE-180`
- Audit-ID: `1243098`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`
  - Version `3.1.8`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>eslint-plugin-tsdoc>@microsoft/tsdoc-config>ajv>fast-uri`

### 38. fast-uri — moderate

fast-uri vulnerable to host confusion via unchecked WHATWG host canonicalization

- Advisory: [GHSA-wjr9-j795-jxcr](https://github.com/advisories/GHSA-wjr9-j795-jxcr)
- Betroffene Versionen: `>=3.1.3 <3.1.9`
- Gepatchte Versionen laut Audit: `>=3.1.9`
- CWE: `CWE-20, CWE-436`
- Audit-ID: `1243104`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.8`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>eslint-plugin-tsdoc>@microsoft/tsdoc-config>ajv>fast-uri`

### 39. glob — moderate

Glob: AbortSignal cancellation bypass allows post-timeout filesystem traversal

- Advisory: [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)
- Betroffene Versionen: `>=9.0.0 <=14.0.1`
- Gepatchte Versionen laut Audit: `>=14.0.2`
- CWE: `CWE-400`
- Audit-ID: `1244013`
- Betroffene installierte Versionen und Pfade:
  - Version `10.5.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>broccoli-plugin>quick-temp>rimraf>glob`
  - Version `11.1.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>vite-plugin-pwa>workbox-build>glob`
    - `.>workbox-build>glob`

### 40. js-yaml — moderate

JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases

- Advisory: [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68)
- Betroffene Versionen: `>=4.0.0 <=4.1.1`
- Gepatchte Versionen laut Audit: `>=4.1.2`
- CWE: `CWE-407`
- Audit-ID: `1121860`
- Betroffene installierte Versionen und Pfade:
  - Version `4.1.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>js-yaml`

### 41. minimatch — moderate

minimatch has potential denial of service via globparts amplification

- Advisory: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- Betroffene Versionen: `>=7.0.0 <11.0.1`
- Gepatchte Versionen laut Audit: `>=11.0.1`
- CWE: `CWE-405`
- Audit-ID: `1244623`
- Betroffene installierte Versionen und Pfade:
  - Version `10.2.6`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@eslint-react/eslint>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@eslint-react/eslint>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@eslint-react/eslint>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@eslint-react/eslint>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@eslint-react/eslint>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>@eslint-react/shared>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/ast>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/ast>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/ast>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/ast>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/ast>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/ast>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/ast>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/ast>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/eslint>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/eslint>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/eslint>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/eslint>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/eslint>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/ast>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/ast>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/ast>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/ast>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/ast>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/ast>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/ast>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/ast>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/eslint>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/eslint>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/eslint>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/eslint>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/eslint>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/ast>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/ast>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/ast>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/ast>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/ast>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/ast>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/ast>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/ast>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/eslint>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/eslint>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/eslint>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/eslint>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@eslint-react/eslint>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@eslint-react/var>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/jsx>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@eslint-react/eslint>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@eslint-react/eslint>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@eslint-react/eslint>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@eslint-react/eslint>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@eslint-react/eslint>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/shared>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/ast>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/ast>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/ast>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/ast>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/ast>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/ast>@typescript-eslint/utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/ast>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/ast>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/eslint>@typescript-eslint/utils>@eslint-community/eslint-utils>eslint>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/eslint>@typescript-eslint/utils>@typescript-eslint/typescript-estree>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/eslint>@typescript-eslint/utils>eslint>@eslint/config-array>minimatch`
    - `.>@eslint-react/eslint-plugin>eslint-plugin-react-dom>@eslint-react/var>@eslint-react/eslint>@typescript-eslint/utils>eslint>minimatch`
  - Version `9.0.9`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>broccoli-plugin>quick-temp>rimraf>glob>minimatch`

### 42. smol-toml — moderate

smol-toml: Quadratic-time parse() from parseKey rescanning to end of document on each key line

- Advisory: [GHSA-r4xh-jqrq-34v2](https://github.com/advisories/GHSA-r4xh-jqrq-34v2)
- Betroffene Versionen: `<=1.8.0`
- Gepatchte Versionen laut Audit: `>=1.8.1`
- CWE: `CWE-407`
- Audit-ID: `1241205`
- Betroffene installierte Versionen und Pfade:
  - Version `1.8.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>markdownlint-cli2>smol-toml`

### 43. undici — moderate

undici vulnerable to cross-user cookie disclosure via Set-Cookie caching in shared caches

- Advisory: [GHSA-2jfj-6hjv-fm6j](https://github.com/advisories/GHSA-2jfj-6hjv-fm6j)
- Betroffene Versionen: `>=7.0.0 <7.29.1`
- Gepatchte Versionen laut Audit: `>=7.29.1`
- CWE: `CWE-200, CWE-524`
- Audit-ID: `1240046`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 44. undici — moderate

undici vulnerable to Denial of Service via unbounded decompression of compressed responses

- Advisory: [GHSA-3xpg-4rpp-hhhm](https://github.com/advisories/GHSA-3xpg-4rpp-hhhm)
- Betroffene Versionen: `>=7.15.0 <7.29.1`
- Gepatchte Versionen laut Audit: `>=7.29.1`
- CWE: `CWE-770`
- Audit-ID: `1240044`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 45. undici — moderate

undici vulnerable to Denial of Service via unbounded memory in the EventSource parser

- Advisory: [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685)
- Betroffene Versionen: `>=7.0.0 <7.30.1`
- Gepatchte Versionen laut Audit: `>=7.30.1`
- CWE: `CWE-770`
- Audit-ID: `1243078`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 46. undici — moderate

undici vulnerable to Denial of Service via unhandled exception in the decompress interceptor

- Advisory: [GHSA-55wc-3pg8-jfw6](https://github.com/advisories/GHSA-55wc-3pg8-jfw6)
- Betroffene Versionen: `>=7.15.0 <7.30.1`
- Gepatchte Versionen laut Audit: `>=7.30.1`
- CWE: `CWE-248`
- Audit-ID: `1243484`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 47. undici — moderate

undici vulnerable to downstream response desynchronization via retry interceptor

- Advisory: [GHSA-8xcm-r25x-g524](https://github.com/advisories/GHSA-8xcm-r25x-g524)
- Betroffene Versionen: `>=7.0.0 <7.29.0`
- Gepatchte Versionen laut Audit: `>=7.29.0`
- CWE: `CWE-444`
- Audit-ID: `1130715`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 48. undici — moderate

undici WebSocket client vulnerable to Denial of Service via unbounded automatic PONG buffering

- Advisory: [GHSA-9fm3-97px-rjf6](https://github.com/advisories/GHSA-9fm3-97px-rjf6)
- Betroffene Versionen: `>=7.0.0 <7.30.1`
- Gepatchte Versionen laut Audit: `>=7.30.1`
- CWE: `CWE-400, CWE-405, CWE-770`
- Audit-ID: `1243481`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 49. undici — moderate

undici vulnerable to Subresource Integrity bypass via non-lowercase algorithm tokens

- Advisory: [GHSA-f72v-6w45-q472](https://github.com/advisories/GHSA-f72v-6w45-q472)
- Betroffene Versionen: `>=7.15.0 <7.30.1`
- Gepatchte Versionen laut Audit: `>=7.30.1`
- CWE: `CWE-178`
- Audit-ID: `1243081`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 50. undici — moderate

undici vulnerable to cross-user information disclosure via whitespace around equals in Cache-Control directives

- Advisory: [GHSA-jr45-8vmc-qm54](https://github.com/advisories/GHSA-jr45-8vmc-qm54)
- Betroffene Versionen: `>=7.0.0 <7.29.0`
- Gepatchte Versionen laut Audit: `>=7.29.0`
- CWE: `CWE-436, CWE-524`
- Audit-ID: `1130729`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 51. undici — moderate

undici vulnerable to CRLF Injection via blob-like body 'type' property

- Advisory: [GHSA-m8rv-5g2x-5cg5](https://github.com/advisories/GHSA-m8rv-5g2x-5cg5)
- Betroffene Versionen: `>=7.0.0 <7.29.0`
- Gepatchte Versionen laut Audit: `>=7.29.0`
- CWE: `CWE-93`
- Audit-ID: `1130726`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 52. undici — moderate

undici vulnerable to HTTP header injection via Set-Cookie percent-decoding

- Advisory: [GHSA-p88m-4jfj-68fv](https://github.com/advisories/GHSA-p88m-4jfj-68fv)
- Betroffene Versionen: `>=7.0.0 <7.28.0`
- Gepatchte Versionen laut Audit: `>=7.28.0`
- CWE: `CWE-93`
- Audit-ID: `1121241`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 53. undici — moderate

undici vulnerable to Denial of Service via orphaned RetryHandler response body

- Advisory: [GHSA-pmjh-fq2x-6v4x](https://github.com/advisories/GHSA-pmjh-fq2x-6v4x)
- Betroffene Versionen: `>=7.11.0 <7.29.1`
- Gepatchte Versionen laut Audit: `>=7.29.1`
- CWE: `CWE-772`
- Audit-ID: `1240036`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 54. undici — moderate

undici vulnerable to cross-user information disclosure via shared cache whitespace bypass

- Advisory: [GHSA-pr7r-676h-xcf6](https://github.com/advisories/GHSA-pr7r-676h-xcf6)
- Betroffene Versionen: `>=7.0.0 <7.28.0`
- Gepatchte Versionen laut Audit: `>=7.28.0`
- CWE: `CWE-524`
- Audit-ID: `1121428`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 55. undici — moderate

undici vulnerable to Denial of Service via WebSocketStream unclean close

- Advisory: [GHSA-rx4f-c7p8-82vq](https://github.com/advisories/GHSA-rx4f-c7p8-82vq)
- Betroffene Versionen: `>=7.0.0 <7.29.1`
- Gepatchte Versionen laut Audit: `>=7.29.1`
- CWE: `CWE-248, CWE-754`
- Audit-ID: `1240055`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 56. undici — moderate

undici vulnerable to cookie attribute injection via unsanitized domain and unparsed setCookie fields

- Advisory: [GHSA-v3r7-h72x-cjcm](https://github.com/advisories/GHSA-v3r7-h72x-cjcm)
- Betroffene Versionen: `>=7.0.0 <7.29.0`
- Gepatchte Versionen laut Audit: `>=7.29.0`
- CWE: `CWE-74`
- Audit-ID: `1130731`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 57. @babel/core — low

@babel/core: Arbitrary File Read via sourceMappingURL Comment

- Advisory: [GHSA-4x5r-pxfx-6jf8](https://github.com/advisories/GHSA-4x5r-pxfx-6jf8)
- Betroffene Versionen: `<=7.29.0`
- Gepatchte Versionen laut Audit: `>=7.29.1`
- CWE: `CWE-22, CWE-200`
- Audit-ID: `1123528`
- Betroffene installierte Versionen und Pfade:
  - Version `7.29.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>vite-plugin-pwa>workbox-build>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-bugfix-firefox-class-in-computed-class-key>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-bugfix-safari-class-field-initializer-scope>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-bugfix-safari-rest-destructuring-rhs-array>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining>@babel/plugin-transform-optional-chaining>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-bugfix-v8-static-class-fields-redefine-readonly>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-proposal-private-property-in-object>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-syntax-import-assertions>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-syntax-import-attributes>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-syntax-unicode-sets-regex>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-syntax-unicode-sets-regex>@babel/helper-create-regexp-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-arrow-functions>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-async-generator-functions>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-async-generator-functions>@babel/helper-remap-async-to-generator>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-async-to-generator>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-async-to-generator>@babel/helper-remap-async-to-generator>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-block-scoped-functions>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-block-scoping>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-class-properties>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-class-properties>@babel/helper-create-class-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-class-properties>@babel/helper-create-class-features-plugin>@babel/helper-replace-supers>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-class-static-block>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-class-static-block>@babel/helper-create-class-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-class-static-block>@babel/helper-create-class-features-plugin>@babel/helper-replace-supers>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-classes>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-classes>@babel/helper-replace-supers>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-computed-properties>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-destructuring>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-dotall-regex>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-dotall-regex>@babel/helper-create-regexp-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-duplicate-keys>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-duplicate-named-capturing-groups-regex>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-duplicate-named-capturing-groups-regex>@babel/helper-create-regexp-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-dynamic-import>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-explicit-resource-management>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-explicit-resource-management>@babel/plugin-transform-destructuring>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-exponentiation-operator>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-export-namespace-from>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-for-of>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-function-name>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-json-strings>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-literals>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-logical-assignment-operators>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-member-expression-literals>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-modules-amd>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-modules-amd>@babel/helper-module-transforms>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-modules-commonjs>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-modules-commonjs>@babel/helper-module-transforms>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-modules-systemjs>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-modules-systemjs>@babel/helper-module-transforms>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-modules-umd>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-modules-umd>@babel/helper-module-transforms>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-named-capturing-groups-regex>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-named-capturing-groups-regex>@babel/helper-create-regexp-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-new-target>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-nullish-coalescing-operator>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-numeric-separator>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-object-rest-spread>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-object-rest-spread>@babel/plugin-transform-destructuring>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-object-rest-spread>@babel/plugin-transform-parameters>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-object-super>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-object-super>@babel/helper-replace-supers>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-optional-catch-binding>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-optional-chaining>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-parameters>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-private-methods>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-private-methods>@babel/helper-create-class-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-private-methods>@babel/helper-create-class-features-plugin>@babel/helper-replace-supers>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-private-property-in-object>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-private-property-in-object>@babel/helper-create-class-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-private-property-in-object>@babel/helper-create-class-features-plugin>@babel/helper-replace-supers>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-property-literals>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-regenerator>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-regexp-modifiers>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-regexp-modifiers>@babel/helper-create-regexp-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-reserved-words>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-shorthand-properties>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-spread>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-sticky-regex>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-template-literals>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-typeof-symbol>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-unicode-escapes>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-unicode-property-regex>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-unicode-property-regex>@babel/helper-create-regexp-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-unicode-regex>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-unicode-regex>@babel/helper-create-regexp-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-unicode-sets-regex>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/plugin-transform-unicode-sets-regex>@babel/helper-create-regexp-features-plugin>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>@babel/preset-modules>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>babel-plugin-polyfill-corejs2>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>babel-plugin-polyfill-corejs2>@babel/helper-define-polyfill-provider>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>babel-plugin-polyfill-corejs3>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>babel-plugin-polyfill-corejs3>@babel/helper-define-polyfill-provider>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>babel-plugin-polyfill-regenerator>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@babel/preset-env>babel-plugin-polyfill-regenerator>@babel/helper-define-polyfill-provider>@babel/core`
    - `.>vite-plugin-pwa>workbox-build>@rollup/plugin-babel>@babel/core`
    - `.>workbox-build>@babel/core`

### 58. deepmerge — low

deepmerge mergeObject() allows prototype poisoning of returned objects

- Advisory: [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
- Betroffene Versionen: `>=4.2.0 <=4.3.1`
- Gepatchte Versionen laut Audit: `>=4.3.2`
- CWE: `CWE-1321`
- Audit-ID: `1243505`
- Betroffene installierte Versionen und Pfade:
  - Version `4.3.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>vite-plugin-pwa>workbox-build>@rollup/plugin-node-resolve>deepmerge`
    - `.>workbox-build>@rollup/plugin-node-resolve>deepmerge`

### 59. fast-uri — low

fast-uri vulnerable to scheme injection via an unescaped first-segment colon in suffix references

- Advisory: [GHSA-333x-w4r6-6crp](https://github.com/advisories/GHSA-333x-w4r6-6crp)
- Betroffene Versionen: `>=3.0.0 <3.1.9`
- Gepatchte Versionen laut Audit: `>=3.1.9`
- CWE: `CWE-41, CWE-116`
- Audit-ID: `1243107`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`
  - Version `3.1.8`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>eslint-plugin-tsdoc>@microsoft/tsdoc-config>ajv>fast-uri`

### 60. fast-uri — low

fast-uri vulnerable to improper path equivalence in relative reference normalization

- Advisory: [GHSA-xhq7-xmqj-769h](https://github.com/advisories/GHSA-xhq7-xmqj-769h)
- Betroffene Versionen: `>=3.0.0 <3.1.9`
- Gepatchte Versionen laut Audit: `>=3.1.9`
- CWE: `CWE-41`
- Audit-ID: `1243101`
- Betroffene installierte Versionen und Pfade:
  - Version `3.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>@dreamsicle.io/stylelint-config-tailwindcss>stylelint>table>ajv>fast-uri`
    - `.>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint>table>ajv>fast-uri`
    - `.>stylelint-config-standard>stylelint-config-recommended>stylelint>table>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>vite-plugin-pwa>workbox-build>ajv>fast-uri`
    - `.>workbox-build>@apideck/better-ajv-errors>ajv>fast-uri`
    - `.>workbox-build>ajv>fast-uri`
  - Version `3.1.8`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>eslint-plugin-tsdoc>@microsoft/tsdoc-config>ajv>fast-uri`

### 61. katex — low

KaTeX: Existing prototype pollution can bypass trust restrictions

- Advisory: [GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7)
- Betroffene Versionen: `>=0.11.0 <0.18.2`
- Gepatchte Versionen laut Audit: `>=0.18.2`
- CWE: `CWE-807`
- Audit-ID: `1241206`
- Betroffene installierte Versionen und Pfade:
  - Version `0.16.47`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>markdownlint-cli2>markdownlint>micromark-extension-math>katex`

### 62. markdown-it — low

markdown-it: Quadratic-time denial of service in inline HTML parsing with html enabled

- Advisory: [GHSA-vfgh-jcmw-g37q](https://github.com/advisories/GHSA-vfgh-jcmw-g37q)
- Betroffene Versionen: `>=15.0.0 <15.0.3`
- Gepatchte Versionen laut Audit: `>=15.0.3`
- CWE: `CWE-400, CWE-407`
- Audit-ID: `1242645`
- Betroffene installierte Versionen und Pfade:
  - Version `15.0.1`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>markdownlint-cli2>markdown-it`

### 63. serialize-javascript — low

Serialize JavaScript: Cross-site scripting (XSS) via unescaped </script at the end of a serialized function body

- Advisory: [GHSA-m5mm-p8h7-m29v](https://github.com/advisories/GHSA-m5mm-p8h7-m29v)
- Betroffene Versionen: `<7.1.3`
- Gepatchte Versionen laut Audit: `>=7.1.3`
- CWE: `CWE-79`
- Audit-ID: `1243082`
- Betroffene installierte Versionen und Pfade:
  - Version `7.1.2`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>vite-plugin-pwa>workbox-build>@rollup/plugin-terser>serialize-javascript`
    - `.>workbox-build>@rollup/plugin-terser>serialize-javascript`

### 64. undici — low

undici vulnerable to response truncation via oversized chunked responses in the dump interceptor

- Advisory: [GHSA-2gqq-gqf2-x968](https://github.com/advisories/GHSA-2gqq-gqf2-x968)
- Betroffene Versionen: `>=7.1.0 <7.29.1`
- Gepatchte Versionen laut Audit: `>=7.29.1`
- CWE: `CWE-20, CWE-248`
- Audit-ID: `1240048`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 65. undici — low

undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse

- Advisory: [GHSA-35p6-xmwp-9g52](https://github.com/advisories/GHSA-35p6-xmwp-9g52)
- Betroffene Versionen: `>=7.0.0 <7.28.0`
- Gepatchte Versionen laut Audit: `>=7.28.0`
- CWE: `CWE-367`
- Audit-ID: `1137242`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 66. undici — low

undici vulnerable to caching and replay of unsafe HTTP method responses

- Advisory: [GHSA-8436-99hf-9mmv](https://github.com/advisories/GHSA-8436-99hf-9mmv)
- Betroffene Versionen: `>=7.0.0 <7.29.1`
- Gepatchte Versionen laut Audit: `>=7.29.1`
- CWE: `CWE-345`
- Audit-ID: `1240052`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 67. undici — low

undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching

- Advisory: [GHSA-g8m3-5g58-fq7m](https://github.com/advisories/GHSA-g8m3-5g58-fq7m)
- Betroffene Versionen: `>=7.0.0 <7.28.0`
- Gepatchte Versionen laut Audit: `>=7.28.0`
- CWE: `CWE-183`
- Audit-ID: `1121254`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`

### 68. undici — low

undici vulnerable to downstream response splitting via retry interceptor

- Advisory: [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r)
- Betroffene Versionen: `>=7.0.0 <7.29.1`
- Gepatchte Versionen laut Audit: `>=7.29.1`
- CWE: `CWE-444`
- Audit-ID: `1240038`
- Betroffene installierte Versionen und Pfade:
  - Version `7.25.0`; `dev: true`, `optional: false`, `bundled: false`.
    - `.>i18next-parser>cheerio>undici`
