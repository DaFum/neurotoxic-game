# Tooling-Test-Split

## Ziel

Tests, deren primärer Testgegenstand Entwicklungs- oder Repository-Infrastruktur
ist, laufen nicht mehr in den produktionsbezogenen Standard-Testläufen. Sie
bleiben erhalten und erhalten mit `pnpm run test:tooling` einen eigenen Lauf.

## Abgrenzung

Als Tooling-/Infrastrukturtests gelten Tests für:

- Agent- und Skill-Synchronisierung,
- Test-Discovery und Runner-Parallelisierung,
- Symbolgenerierung,
- Vite-/PWA- und Playwright-Testkonfiguration,
- Balance-Harnesses sowie deren Report-, Probe- und Metadaten-Skripte,
- reine Test-Fixture- und Seed-Helfer.

Tests, die Produktionscode unter `src/**` oder `api/**` als primären
Testgegenstand haben, bleiben in den Standardläufen. Ein Test darf dabei
Tooling-Helfer verwenden, ohne allein dadurch zum Tooling-Test zu werden.

## Runner-Design

`scripts/run-node-tests.mjs` führt eine explizite Liste der
Tooling-/Infrastrukturtests. Bei automatischer Discovery schließt der normale
Modus diese Liste aus. Ein neuer Tooling-Modus wählt ausschließlich diese Liste
aus und verwendet dieselben Node-, TSX-, Reporter- und Concurrency-Optionen wie
der bestehende Runner.

Direkt angegebene Testdateien bleiben von der automatischen Klassifizierung
unberührt. Heavy- und Tooling-Modus dürfen nicht kombiniert werden, weil beide
eine eigenständige Auswahl der automatisch entdeckten Dateien darstellen.

`package.json` stellt den Tooling-Modus als `pnpm run test:tooling` bereit. Die
bestehenden Befehle `test`, `test:dot`, `test:node`, `test:node:quick`,
`test:node:heavy` und `test:all` führen ausschließlich produktionsbezogene
Tests aus und rufen `test:tooling` nicht indirekt auf.

Der Vitest-eigene Seed-Helfertest wird aus der normalen Logic-Konfiguration
ausgeschlossen und über eine fokussierte Node-Environment-Konfiguration in den
Tooling-Lauf aufgenommen.

## Verifikation

Die Runner-Tests sichern ab, dass:

1. jede explizit gelistete Tooling-Testdatei existiert,
2. normale automatische Discovery Tooling-Tests ausschließt,
3. der Tooling-Modus ausschließlich Tooling-Tests auswählt,
4. widersprüchliche Auswahlmodi mit einer verständlichen Fehlermeldung
   abgelehnt werden.

Anschließend werden der neue Tooling-Lauf, der produktionsbezogene Standardlauf
und der vollständige Qualitätsgate ausgeführt.
