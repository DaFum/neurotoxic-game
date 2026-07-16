# Priorisierte Skill-Analyse-Befunde

Stand: 2026-07-16

Diese Datei sammelt verifizierte Befunde aus Skill-Läufen, die jeweils in eigenen Subagenten gestartet wurden. Befunde sind nach Auswirkung priorisiert und um den Bearbeitungsstatus ergänzt.

## P1 — Direkt dokumentierter Mega-Lint-Einstieg ist nicht ausführbar

- **Status:** Bearbeitet
- **Skill/Subagent:** `mega-lint-snapshot` / McClintock
- **Ursprünglicher Befehl:** `.agents/skills/mega-lint-snapshot/scripts/run-mega-lint.sh`
- **Ursprünglicher Exit-Code:** `126`
- **Ursprünglicher Befund:** Der dokumentierte Direktaufruf scheiterte mit `Permission denied`. Der Script-Dateimodus war nicht ausführbar, obwohl das Script einen Shebang besitzt.
- **Änderung:** `.agents/skills/mega-lint-snapshot/scripts/run-mega-lint.sh` ist jetzt ausführbar.
- **Verifikation:** Der direkte Aufruf startet den Mega-Lint-Workflow und erreicht die konfigurierten Prüfschritte.

## P1 — Mega-Lint-Prettier-Checks sind destruktiv verdrahtet

- **Status:** Bearbeitet
- **Skill/Subagent:** `mega-lint-snapshot` / McClintock
- **Ursprünglicher Befehl:** `bash .agents/skills/mega-lint-snapshot/scripts/run-mega-lint.sh`
- **Ursprünglicher Exit-Code:** `1`
- **Ursprünglicher Befund:** Die Mega-Lint-Konfiguration rief `pnpm run format -- --check` auf. `package.json` definiert `format` jedoch als `prettier --write .`; dadurch wurde der vermeintliche Check als Schreiboperation gestartet und `--check` als Dateipattern an Prettier weitergereicht.
- **Änderung:** Die Prettier-Checks verwenden jetzt `pnpm exec prettier --check ...`; die Fix-Varianten verwenden explizit `pnpm exec prettier --write ...`.
- **Verifikation:** Im direkten Mega-Lint-Lauf werden die Prettier-Ziele als echte Checks ausgeführt. Sie melden nun vorhandene Formatabweichungen statt `--check` als fehlendes Dateipattern zu behandeln.

## P2 — Mehrere externe Mega-Lint-Werkzeuge fehlen in der Umgebung

- **Status:** Bearbeitet
- **Skill/Subagent:** `mega-lint-snapshot` / McClintock
- **Ursprünglicher Befehl:** `bash .agents/skills/mega-lint-snapshot/scripts/run-mega-lint.sh`
- **Ursprünglicher Exit-Code:** `1`
- **Ursprünglicher Befund:** Mehrere in der Mega-Lint-Konfiguration erwartete externe Tools waren in der aktuellen Umgebung nicht installiert.
- **Änderung:** Externe, nicht über `package.json` bereitgestellte Mega-Lint-Werkzeuge sind in der Konfiguration als optional markiert; fehlende CLIs mit Exit-Code `127` werden als `WARN` protokolliert und blockieren den Snapshot nicht mehr.
- **Verifizierte Warnungen im aktuellen Lauf vor Tool-Ergänzung:**
  - `shellcheck` fehlt → `WARN`, Exit-Code `127`
  - `checkov` fehlt → `WARN`, Exit-Code `127`
  - `gitleaks` fehlt → `WARN`, Exit-Code `127`
  - `textlint` fehlt → `WARN`, Exit-Code `127`
  - `shfmt` fehlt → `WARN`, Exit-Code `127`

## Ergänzte projektnahe Tools

- **Status:** Bearbeitet
- **Änderung:** `jscpd` wurde als gepinnte `devDependency` ergänzt und der Mega-Lint-Target `JSCPD` nutzt jetzt `pnpm exec jscpd --config .jscpd.json --silent`.
- **Änderung:** `markdownlint-cli2` wurde als gepinnte `devDependency` ergänzt und der Mega-Lint-Target `MARKDOWN` nutzt jetzt `pnpm exec markdownlint-cli2 "**/*.md"` mit Ausschlüssen für `node_modules`, `dist`, `report` und `reports`.
- **Nicht ergänzt:** `textlint` bleibt optional, weil ohne projektspezifische Rules/Presets kein sinnvoller Textlint-Gate entsteht. Systemnahe Tools wie `shellcheck`, `shfmt`, `gitleaks` und `checkov` bleiben optional, weil sie nicht sinnvoll als Node-Projekt-Dependencies gepflegt werden.

## Aktueller Restbefund

- **Status:** Offen, außerhalb des ursprünglichen Mega-Lint-Konfigurationsfehlers
- **Befehl:** `.agents/skills/mega-lint-snapshot/scripts/run-mega-lint.sh`
- **Exit-Code:** `1`
- **Befund:** Der direkte Mega-Lint-Lauf scheitert weiterhin an echten Format-/Markdown-Befunden in bestehenden Dateien:
  - `.jules/tsdoc.md`
  - `.jules/palette.md`
  - `docs/TODO-code-audit-2026-05-01-de.md`
  - `docs/TODO-code-audit-2026-05-01.md`
  - `src/hooks/travel/useVanMaintenance.ts`
- **Begründung für Nicht-Bearbeitung:** Diese Dateien liegen außerhalb der gemeldeten Mega-Lint-Skill-Befunde. Sie wurden nicht geändert, um die Korrektur auf die Ursachen in Script und Skill-Konfiguration zu begrenzen.

## Nicht abgeschlossene Subagenten-Läufe aus der ursprünglichen Analyse

- **Skill:** `one-command-quality-gate`
  - **Erster Subagent:** Nach Timeout meldete `wait_agent` für die Agent-ID `not_found`.
  - **Ersatz-Subagent:** Ebenfalls mit `not_found` beendet.
  - **Status:** Kein verifizierter Quality-Gate-Befund liegt vor; es wird bewusst kein Ergebnis erfunden.
- **Skill:** `one-command-doctor`
  - **Erster Subagent:** Nach Timeout meldete `wait_agent` für die Agent-ID `not_found`.
  - **Ersatz-Subagent:** Ebenfalls mit `not_found` beendet.
  - **Status:** Kein verifizierter Doctor-Befund liegt vor; es wird bewusst kein Ergebnis erfunden.
