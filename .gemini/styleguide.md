# Gemini Code Assist Styleguide

## 1. Einleitung
Dieser Styleguide definiert die Coding-Standards für dieses Projekt. Er hilft Gemini Code Assist dabei, die Konsistenz, Lesbarkeit, Wartbarkeit, Performance und Sicherheit des Codes bei Überprüfungen und Vorschlägen sicherzustellen. Ziel ist es, eine einheitliche Code-Basis zu schaffen, die von allen Teammitgliedern (und KI-Assistenten) leicht verstanden und erweitert werden kann.

## 2. Allgemeine Richtlinien
*   **Sprache(n):** Python (als Standard für dieses Projekt).
*   **Basis-Styleguide:** Dieser Styleguide basiert auf **PEP 8** (Style Guide for Python Code).
*   **Abweichungen vom Basis-Styleguide:**
    *   Die maximale Zeilenlänge ist auf 88 Zeichen erweitert (in Übereinstimmung mit dem Black-Formatter).

## 3. Code-Formatierung
*   **Einrückung:** Verwenden Sie immer 4 Leerzeichen pro Einrückungsebene. Keine Tabs.
*   **Zeilenlänge:** Maximal 88 Zeichen pro Zeile.
*   **Leerzeilen:**
    *   Umgeben Sie auf oberster Ebene definierte Klassen und Funktionen mit zwei Leerzeilen.
    *   Methoden innerhalb einer Klasse werden durch eine einzelne Leerzeile getrennt.
*   **Leerzeichen:**
    *   Verwenden Sie Leerzeichen um Zuweisungs- und Vergleichsoperatoren (z.B. `x = 1`, `if a == b:`).
    *   Vermeiden Sie unnötige Leerzeichen direkt innerhalb von Klammern (z.B. `func(arg)` statt `func( arg )`).
*   **Klammern:** Setzen Sie schließende Klammern bei mehrzeiligen Konstrukten entweder an das Ende der letzten Zeile oder bündig mit der ersten Zeile des Konstrukts.

## 4. Benennungskonventionen
*   **Variablen:** `snake_case`
*   **Konstanten:** `UPPER_SNAKE_CASE`
*   **Funktionen/Methoden:** `snake_case`
*   **Klassen/Typen:** `PascalCase`
*   **Module/Dateien:** `snake_case`

## 5. Kommentare und Dokumentation
*   **Wann kommentieren:** Schreiben Sie Kommentare, um das "Warum" hinter komplexer Logik zu erklären, nicht das "Was".
*   **Docstrings:** Verwenden Sie **Google Style Docstrings** für alle öffentlichen Module, Klassen, Funktionen und Methoden.
    *   **Inhalt:** Beschreiben Sie kurz den Zweck. Listen Sie alle Argumente (`Args:`), den Rückgabewert (`Returns:`), und mögliche Fehler (`Raises:`) auf. Optional können Beispiele (`Examples:`) hinzugefügt werden.

## 6. Importe/Abhängigkeiten
*   **Reihenfolge:**
    1.  Standardbibliotheken
    2.  Drittanbieter-Bibliotheken (Third-Party)
    3.  Lokale, projektspezifische Importe
    *(Trennen Sie diese drei Blöcke jeweils mit einer Leerzeile)*
*   **Absolute vs. Relative Importe:** Bevorzugen Sie absolute Importe. Relative Importe sind nur innerhalb desselben Pakets akzeptabel, wenn sie die Lesbarkeit verbessern.

## 7. Fehlerbehandlung
*   **Ausnahmen:** Verwenden Sie Ausnahmen zur Fehlerbehandlung statt Rückgabewerte wie `None` oder Fehlercodes.
*   **Spezifische Ausnahmen:** Fangen Sie immer die spezifischste Ausnahme ab (z.B. `except ValueError:`). Vermeiden Sie zu allgemeine `except Exception:`-Blöcke ohne explizites Logging oder Weiterwerfen der Ausnahme.
*   **Fehlerprotokollierung:** Loggen Sie Fehler stets mit ausreichendem Kontext unter Verwendung des `logging`-Moduls.

## 8. Testen
*   **Teststrategie:** Jeder Bugfix und jedes neue Feature sollte von entsprechenden automatisierten Tests begleitet werden (Unit-Tests).
*   **Benennung von Tests:**
    *   Testdateien müssen mit `test_` beginnen (z.B. `test_utils.py`).
    *   Testfunktionen und -methoden müssen mit `test_` beginnen und beschreibend sein (z.B. `test_calculate_total_with_empty_list`).

## 9. Tooling und Automatisierung
*   **Code-Formatter:** Wir verwenden **Black** zur automatischen Code-Formatierung.
*   **Linter:** Wir verwenden **Flake8** zur statischen Code-Analyse (angepasst an Black, d.h. `max-line-length = 88`).

## 10. Beispiel-Code
Hier ist ein kurzes Beispiel, das die wichtigsten Richtlinien verdeutlicht:

```python
import os
import sys

import requests

from myproject.utils import format_data


MAX_RETRIES = 3


class DataFetcher:
    """Verantwortlich für das Abrufen von Daten von einer externen API.

    Diese Klasse nutzt requests, um Daten zu laden und formatiert
    sie anschließend zur weiteren Verarbeitung.
    """

    def __init__(self, api_url: str):
        """Initialisiert den DataFetcher.

        Args:
            api_url (str): Die URL der Ziel-API.
        """
        self.api_url = api_url

    def fetch_data(self, user_id: int) -> dict:
        """Lädt die Daten für eine spezifische Benutzer-ID herunter.

        Args:
            user_id (int): Die ID des Benutzers.

        Returns:
            dict: Die formatierten Benutzerdaten.

        Raises:
            ValueError: Wenn die Benutzer-ID ungültig ist.
            ConnectionError: Wenn die API nicht erreicht werden konnte.
        """
        if user_id <= 0:
            raise ValueError(f"Ungültige user_id: {user_id}. Muss positiv sein.")

        response = requests.get(f"{self.api_url}/users/{user_id}")

        try:
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            # Protokollierung würde idealerweise mit dem logging-Modul erfolgen
            raise ConnectionError(f"Fehler beim Abrufen der Daten: {e}")

        raw_data = response.json()
        return format_data(raw_data)
```
