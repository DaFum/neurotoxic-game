# Chatter Logik Analyse

Dieses Dokument beschreibt, wann und wo Chatter-Texte im Spiel angezeigt werden.

## 1. Timing (Wann?)
Gesteuert durch `src/components/ChatterOverlay.jsx`.

*   **Intervall:** Zufällig zwischen **8 und 25 Sekunden** (`8000ms` + `0-17000ms`).
*   **Dauer:** Jede Nachricht bleibt **10 Sekunden** sichtbar.
*   **Bedingung:** Der Browser-Tab muss aktiv sein (pausiert bei `document.hidden`).

## 2. Positionierung (Wo?)
Abhängig von der aktuellen Szene (`currentScene`):

*   **Unten Links:**
    *   Szenen: `OVERWORLD`, `TRAVEL_MINIGAME`.
    *   CSS: `fixed bottom-28 left-8`.
    *   Zweck: Vermeidung von Überlappungen mit dem Bus/Event-Log.
*   **Unten Mitte:**
    *   Szenen: Alle anderen (z.B. `MENU`, `PREGIG`, `GIG`, `POSTGIG`).
    *   CSS: `fixed bottom-16 left-1/2 -translate-x-1/2`.
*   **Ebene:** `z-index: 200` (über den meisten UI-Elementen).

## 3. Inhalt (Was?)
Quellen: `src/data/chatter/standardChatter.js` und `src/data/chatter/venueChatter.js`.

*   **Auswahl:** Gewichtet zufällig (`getRandomChatter`).
*   **Priorität:** Venue-spezifische Texte haben eine höhere Gewichtung (8).
*   **Bedingungen:**
    *   **Szene:** Z.B. nur während der Fahrt.
    *   **Zustand:** Abhängig von Mood, Money, Inventory (z.B. fehlende Saiten), Luck, etc.
