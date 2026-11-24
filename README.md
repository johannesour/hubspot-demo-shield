# HubSpot Demo Shield

Chrome-Extension, die bei **Live-Demos im echten HubSpot-Portal** personenbezogene und vertrauliche Daten unkenntlich macht – wahlweise durch **realistische Fake-Daten** oder **Unschärfe**.

- Arbeitet ausschließlich im Browser-Fenster (DOM). In HubSpot wird **nichts verändert**, es gibt **keine API-Aufrufe und keine Netzwerk-Requests**.
- Originalwerte liegen nur im Arbeitsspeicher des Tabs. Beim Ausschalten wird alles sofort zurückgesetzt.
- Keine Abhängigkeiten, kein Build-Schritt – reines JavaScript (Manifest V3).

| Modus | Beispiel |
|---|---|
| **Fake-Daten** | „Max Müller · max.mueller@bosch.de · +49 711 1234567“ → „Elias Ahrens · elias.ahrens@falkenstein-logistik.de · +49 718 6066122“ – überall konsistent |
| **Unscharf** | Sensible Felder werden verwischt, der Rest der Oberfläche bleibt lesbar |

---

## Installation

> Die Extension ist nicht im Chrome Web Store, sondern wird als „entpackte Erweiterung“ geladen. Das dauert eine Minute.

1. **Repository herunterladen**
   ```bash
   git clone https://github.com/johannesour/hubspot-demo-shield.git
   ```
   oder auf GitHub **Code → Download ZIP** und entpacken.
2. In Chrome **`chrome://extensions`** öffnen.
3. Oben rechts den **Entwicklermodus** einschalten.
4. **„Entpackte Erweiterung laden“** klicken und den Ordner **`hubspot-demo-shield`** im Repository auswählen (der Ordner, in dem `manifest.json` liegt).
5. Über das Puzzle-Symbol in der Symbolleiste die Extension **anheften**.
6. HubSpot-Tab neu laden.

Funktioniert in Chrome, Edge, Brave und anderen Chromium-Browsern auf `app.hubspot.com` und den regionalen Instanzen (`app-eu1`, `app-na2`, `app-na3`, `app-ap1`).

### Aktualisieren

```bash
git pull
```
Danach in `chrome://extensions` bei „HubSpot Demo Shield“ auf **Neu laden** (Pfeil-Kreis) klicken und den HubSpot-Tab neu laden.

> **Hinweis:** Nach dem Neuladen oder einem Update ist die Extension ggf. ausgeschaltet – im Popup prüfen (Badge „ON“ am Icon).

---

## Bedienung

| Funktion | So geht's |
|---|---|
| **An / Aus** | Schalter im Popup oder **Alt+Shift+A**. Aktiv = Badge „ON“ am Icon |
| **Modus** | Fake-Daten oder Unscharf |
| **Kategorien** | Namen · E-Mails · Telefon · Adressen · Firmen & Deals · Domains & URLs · Beträge & IBAN · Notizen & Freitext · Geburtstag & Nummern · Eigene Mitarbeiter (standardmäßig **aus**) |
| **Ausnahmen** | Werte, die sichtbar bleiben sollen – eine pro Zeile (z. B. eigener Name, eigene Firma, Demo-Kontakt) |
| **Eigener Bereich** | Art wählen → „Auf Seite wählen“ → Element anklicken. Wird als Regel gespeichert und ist im Popup wieder löschbar |
| **Neu würfeln** | Erzeugt andere Fake-Identitäten |

### Checkliste vor einer Demo

1. Extension einschalten, Modus wählen.
2. Eigene Namen/Firma unter **Ausnahmen** eintragen, falls sie sichtbar bleiben sollen.
3. Die Bereiche, die du zeigen willst, **einmal durchklicken** (Listen, ein Datensatz, Timeline, Inbox, Suche).
4. Was durchrutscht, per **„Auf Seite wählen“** nachrüsten.
5. In der Demo **keine Felder live bearbeiten** – Eingabefelder werden nur verwischt, nicht ersetzt.

---

## Was wird erkannt?

| Bereich | Abdeckung |
|---|---|
| CRM-Listen (Kontakte, Firmen, Deals, Tickets) | Jede Spalte über ihren internen Property-Namen – auch portal-eigene Felder wie `*_geburtstag`, `mitgliedsnummer`, `bemerkung` |
| Datensatz-Seiten | Kopfbereich, „Jobtitel bei Firma“, Seitenleiste, zugeordnete Objekte, Timeline-Erwähnungen |
| Deal-Board | Deal-Namen, Beträge, Summen, Kontakte, optional zuständige Mitarbeiter |
| Inbox | Absender, Betreff, Vorschau, E-Mail-Inhalt, Anhänge, Empfänger |
| Formular-Einsendungen | Name und alle Antworten (Beschriftungen bleiben lesbar) |
| Benachrichtigungen | Betreff und Text der Karten |
| Globale Suche | Trefferliste |
| Überall | E-Mails, Telefonnummern, URLs/Domains, Beträge, IBANs per Mustererkennung; Avatare, Fotos und Logos werden verwischt; Browser-Tab-Titel wird ersetzt |

**Datenschutz-Prinzip:** Im Zweifel lieber verwischen. Beim Laden ist die Seite kurz unscharf, bis die Anonymisierung durch ist – so blitzen keine echten Daten auf.

## Grenzen

- HubSpot ändert sein UI gelegentlich. Die Regeln stehen zentral in [`content/selectors.js`](hubspot-demo-shield/content/selectors.js); zusätzlich gibt es den Element-Picker.
- **Nicht geprüft:** Aufgaben, Marketing-E-Mail-Details, Anrufe, Meetings, Angebote/Rechnungen.
- Wer selbst als Kontakt im CRM steht, wird auch als Kontakt anonymisiert → bei Bedarf unter „Ausnahmen“ eintragen.
- Was du selbst in die Suche tippst, bleibt sichtbar. Screenreader-Texte (`aria-label`) werden nicht verändert.
- Canvas-Diagramme, PDF-Vorschauen und fremde iframes werden nicht erfasst.
- Firmen werden nur als ganzer Name gelernt (sonst würde z. B. „Stuttgart“ überall ersetzt). Kurzformen im Fließtext („bei Bosch“) können stehen bleiben.
- **Keine Garantie** – vor jeder externen Demo einmal durchklicken.

---

## Projektstruktur

```
hubspot-demo-shield/          ← diesen Ordner in Chrome laden
├── manifest.json             Manifest V3
├── background.js             Tastenkürzel, Badge, Standardwerte
├── shared/defaults.js        Einstellungen & Defaults
├── content/
│   ├── selectors.js          HubSpot-Regeln, Property-Muster, Labels, Regex
│   ├── faker.js              Deterministische Fake-Daten
│   ├── anonymizer.js         Ersetzen / Verwischen / Zurücksetzen
│   ├── picker.js             Element-Picker für eigene Regeln
│   ├── main.js               Start, MutationObserver, Einstellungen
│   └── shield.css            Unschärfe + Fail-safe
├── popup/                    Oberfläche
└── test/                     Testseite, Testbundle, Leck-Scanner
docs/ENTWICKLUNG.md           Architektur, Regeln erweitern, Testen
```

Details zu Architektur, eigenen Regeln und Tests: **[docs/ENTWICKLUNG.md](docs/ENTWICKLUNG.md)**.

## Lizenz

[MIT](LICENSE) © 2026 Johannes Ellenberg
