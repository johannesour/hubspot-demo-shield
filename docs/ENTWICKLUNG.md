# Entwicklung

## Architektur

Die Content-Scripts laufen auf allen HubSpot-App-Seiten (`all_frames`, also auch in iframes wie dem Benachrichtigungs-Panel) und teilen sich den Namensraum `self.HDS`.

```
main.js ── lädt Einstellungen aus chrome.storage.local
   │        startet MutationObserver auf <html> (childList, characterData, title/src/data-source)
   ▼
anonymizer.process(root)
   1. scanLabels()      sichtbare Feld-Labels finden → Container mit data-hds-gen markieren
   2. Phase 1           strukturierte Felder ersetzen/verwischen und Namen/Firmen ins Wörterbuch lernen
   3. Phase 2           Fließtext: Regex (E-Mail, Telefon, URL, Betrag, IBAN) + gelerntes Wörterbuch
   4. Bilder, Inputs, title-Attribute
   ▼
faker.gen(kind, text)  deterministische Ersatzwerte (Seed + Original → immer gleicher Fake)
```

### Wie ein Textknoten zugeordnet wird (`matchFor`)

Für jeden Textknoten wird der **innerste** passende Treffer gesucht aus:

1. **Regeln** in `HDS.RULES` (CSS-Selektoren → Generator), z. B. Record-Links `a[href*="/record/0-1/"]`, Inbox-Bereiche, Avatar-Initialen.
2. **HubSpot-Property-Namen** (`propMatch`):
   - Seitenleiste: `[data-selenium-test="property-input-<property>"]`
   - Kopfbereich: `[data-test-id="highlight-property-display-<property>"]`
   - Tabellen: Zelle `td[data-column-index]` → Kopf `[data-test-id="header-<objectType>-<property>"]`
   - Formular-Einsendungen: `[data-test-id="field-label-<property>"]` (unbekannte Felder → Freitext)
3. **Record-Überschrift** auf Detailseiten (Objekttyp aus der URL).
4. **Label-Heuristik** (`data-hds-gen` aus `scanLabels`) für Bereiche ohne Property-Namen, z. B. Deal-Board-Karten.

Property-Name → Generator: `HDS.genForProperty()` – erst die feste Tabelle `PROPERTY_GEN`, dann die Muster `PROPERTY_PATTERNS` (z. B. `/geburt|birth/ → date`). Technische Properties (`*_date`, `hs_*`, `lifecyclestage` …) werden über `PROPERTY_SKIP` ausgenommen.

### Generatoren und Kategorien

| Generator | Kategorie (Popup) | Beispiel |
|---|---|---|
| `person`, `firstname`, `lastname`, `initials` | Namen | Max Müller → Elias Ahrens |
| `owner` | Eigene Mitarbeiter | wie `person`, Platzhalter wie „Kein zuständiger Mitarbeiter“ bleiben |
| `email` | E-Mails | Domain passend zur Fake-Firma |
| `phone` | Telefon | Vorwahl bleibt, Rest ersetzt |
| `address` | Adressen | Straße, PLZ, Ort |
| `company`, `deal` | Firmen & Deals | Rechtsform bleibt erhalten |
| `domain` | Domains & URLs | |
| `amount` | Beträge & IBAN | Größenordnung und Format bleiben |
| `text` | Notizen & Freitext | Platzhaltertext gleicher Länge |
| `date`, `number` | Geburtstag & Nummern | Format bleibt |
| `blur` | immer | nur verwischen |

Im **Blur-Modus** werden dieselben Treffer verwischt statt ersetzt. Ausnahme: der Browser-Tab-Titel wird immer ersetzt.

## Neue Bereiche abdecken

1. Bereich in HubSpot öffnen, Extension im **Blur-Modus** aktiv.
2. Leck-Scanner ausführen: Inhalt von [`test/leak-scan.js`](../hubspot-demo-shield/test/leak-scan.js) in die DevTools-Konsole kopieren. Er listet alle sichtbaren, nicht verwischten Texte mit ihrem nächsten `data-test-id` und markiert E-Mails, Telefonnummern, URLs und Beträge.
3. Stabilen Anker suchen – bevorzugt `data-test-id` / `data-selenium-test`, **nicht** die generierten Klassennamen (`Flex__StyledFlex-buCQYr …`).
4. Regel in [`content/selectors.js`](../hubspot-demo-shield/content/selectors.js) ergänzen:
   - feste Bereiche → `HDS.RULES`
   - Properties → `HDS.PROPERTY_GEN` oder `HDS.PROPERTY_PATTERNS`
   - sichtbare Labels → `HDS.LABELS` oder `HDS.LABEL_PATTERNS`
   - Bilder → `HDS.BLUR_SELECTORS`
5. Testen (siehe unten), in `chrome://extensions` neu laden.

## Testen

### Lokale Testseite

Eine nachgebaute HubSpot-Detailseite (Kontaktliste, Seitenleiste, Timeline, nachladende Zeilen):

```bash
python3 -m http.server 8765 -d hubspot-demo-shield
```

Dann `http://localhost:8765/test/contacts/123/record/0-1/456/` öffnen. Parameter:
`?mode=blur` · `?enabled=0` · `?ex=Anna%20Schmidt` (Ausnahme).

### Im echten Portal ohne Installation

```bash
./hubspot-demo-shield/test/build-bundle.sh
```

erzeugt `test/inject-bundle.js` (die komplette Logik als ein Script, nicht eingecheckt). Inhalt in der DevTools-Konsole einer HubSpot-Seite ausführen → läuft sofort im Fake-Modus.

```js
__hds.set({ mode: 'blur' });     // Modus wechseln
__hds.set({ enabled: false });   // ausschalten (stellt Originale wieder her)
```

Vorher die installierte Extension ausschalten, sonst arbeiten beide gleichzeitig.

## Datenschutz-Entscheidungen

- Kein Netzwerkzugriff, keine Telemetrie, keine externen Bibliotheken.
- Originalwerte nur im Speicher (`WeakMap`), nie in `chrome.storage`.
- Fail-safe: Bei aktiver Extension ist `body` unscharf, bis die erste Verarbeitung durch ist (`html.hds-ready`). Bei einem Fehler bleibt die Seite unscharf.
- Eingabefelder werden nie inhaltlich verändert (sonst könnten Fake-Werte gespeichert werden) – nur verwischt.
- Textknoten werden nie gesplittet oder ersetzt, nur ihr Inhalt geändert, damit Reacts DOM-Abgleich nicht bricht.
