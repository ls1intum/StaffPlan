# Position Manager Benutzerhandbuch

Willkommen bei Position Manager, einer Webanwendung für die strategische Personal- und Budgetplanung an Forschungseinrichtungen. Dieses Handbuch erklärt, wie Sie alle Funktionen von Position Manager nutzen können - von der Anzeige von Stellen bis zur Verwaltung von Forschungsgruppen.

**Für wen ist dieses Handbuch?** Alle Position Manager-Benutzer, einschließlich Administratoren, Stellenverwalter, Professoren und Mitarbeiter. Jeder Abschnitt gibt an, welche Rollen Zugriff auf bestimmte Funktionen haben.

## Inhaltsverzeichnis

1. [Erste Schritte](#erste-schritte) - Anmeldung und Navigation in der Anwendung
2. [Benutzerrollen verstehen](#benutzerrollen-verstehen) - Was jede Rolle tun kann
3. [Stellenübersicht](#stellenübersicht) - Anzeigen und Filtern von Stellen
4. [Stellensuche](#stellensuche) - Die besten passenden Stellen finden
5. [Forschungsgruppenverwaltung](#forschungsgruppenverwaltung) - Lehrstühle und Institute verwalten
6. [Benutzerverwaltung](#benutzerverwaltung) - Benutzer und deren Rollen verwalten
7. [Gehaltsstufenverwaltung](#gehaltsstufenverwaltung) - Entgeltgruppen konfigurieren
8. [Daten importieren](#daten-importieren) - Daten aus CSV-Dateien hochladen
9. [Häufig gestellte Fragen](#häufig-gestellte-fragen) - Häufige Fragen und Antworten

---

## Erste Schritte

### Anmeldung

1. Öffnen Sie Position Manager in Ihrem Webbrowser
2. Klicken Sie auf die Schaltfläche **Anmelden** auf der Startseite
3. Sie werden zur Universitäts-Anmeldeseite (Keycloak) weitergeleitet
4. Geben Sie Ihre Universitäts-Anmeldedaten ein (TUM-ID und Passwort)
5. Nach erfolgreicher Authentifizierung werden Sie zur Hauptanwendung weitergeleitet

### Navigation

Nach der Anmeldung sehen Sie:
- **Navigationsleiste** oben mit Ihren verfügbaren Menüpunkten
- **Benutzermenü** in der oberen rechten Ecke mit Ihrem Namen und Ihrer Rolle
- **Hauptinhaltsbereich** mit der aktuellen Seite

![Stellenübersicht](images/positions-overview.png)
*Die Stellenübersicht mit der Gantt-Diagramm-Zeitleistenansicht*

Die Menüpunkte, die Sie sehen, hängen von Ihrer zugewiesenen Rolle ab:

| Rolle | Verfügbare Menüpunkte |
|-------|----------------------|
| Admin | Stellen, Stellensuche, Forschungsgruppen, Benutzer, Gehaltsstufen |
| Stellenverwalter | Stellen, Stellensuche |
| Professor | Stellen (gefiltert auf Ihre Gruppe) |
| Mitarbeiter | Stellen (gefiltert auf Ihre Gruppe) |

---

## Benutzerrollen verstehen

Position Manager hat vier Benutzerrollen mit unterschiedlichen Zugriffsebenen:

### Administrator (Admin)

Administratoren haben vollen Zugriff auf alle Funktionen:
- Alle Stellen der Universität verwalten
- Forschungsgruppen erstellen und verwalten
- Benutzer verwalten und Rollen zuweisen
- Gehaltsstufenwerte definieren und ändern
- Daten aus CSV-Dateien importieren
- Auf alle Berichte und Analysen zugreifen

### Stellenverwalter (Job Manager)

Stellenverwalter übernehmen die tägliche Stellenverwaltung:
- Alle Stellen anzeigen und durchsuchen
- Die Stellensuche nutzen, um Mitarbeiter mit Stellen abzugleichen
- Stellendaten aus CSV-Dateien hochladen
- Forschungsgruppeninformationen anzeigen
- Auf Gehaltsstufeninformationen zugreifen

### Professor

Professoren haben Zugriff auf ihre eigene Forschungsgruppe:
- Stellen ihrer Forschungsgruppe anzeigen
- Die Gantt-Diagramm-Visualisierung ihrer Stellen sehen
- Innerhalb ihrer Stellen filtern und suchen
- Stellenverfügbarkeit über die Zeit verfolgen

### Mitarbeiter (Employee)

Mitarbeiter haben nur Lesezugriff:
- Stellen in ihrer zugewiesenen Forschungsgruppe anzeigen
- Die Gantt-Diagramm-Visualisierung sehen
- Stellen filtern und durchsuchen

---

## Stellenübersicht

Die Stellenseite zeigt alle Personalstellen in einem visuellen Zeitleistenformat namens Gantt-Diagramm. Dies gibt Ihnen einen schnellen Überblick darüber, wann Stellen beginnen und enden, wie ausgelastet sie sind und welche Stellen möglicherweise Aufmerksamkeit benötigen.

### Das Gantt-Diagramm verstehen

Das Gantt-Diagramm zeigt Stellen als horizontale Balken auf einer Zeitleiste. Jeder Balken repräsentiert eine Stelle:

- **Jede Zeile** repräsentiert eine einzelne Stelle
- **Die Balkenlänge** zeigt die Dauer der Stelle (Start- bis Enddatum)
- **Die Balkenfarbe** zeigt den Typ der Gehaltsstufe an
- **Der Füllungsgrad** wird auf jedem Balken angezeigt (z.B. "65%" bedeutet, die Stelle ist zu 65% besetzt)

### Stellen filtern

Verwenden Sie die Filteroptionen über dem Diagramm, um die Anzeige einzugrenzen:

1. **Suche**: Tippen Sie, um nach Stellen-ID, Beschreibung oder Gehaltsstufe zu suchen
2. **Statusfilter**: Nur aktive, archivierte oder alle Stellen anzeigen
3. **Gehaltsstufenfilter**: Nach bestimmten Gehaltsstufen filtern (z.B. E13, E14, W3)
4. **Datumsfilter**: Stellen hervorheben, die an einem bestimmten Datum unbesetzt sind
5. **Prozentfilter**: Nach Mindestbesetzungsprozentsatz filtern

### Zeitleiste anpassen

Verwenden Sie das **Zoom**-Dropdown, um die Zeitleistenansicht zu ändern:
- **3 Monate**: Detaillierte Kurzfristansicht
- **6 Monate**: Quartalsansicht
- **12 Monate**: Jahresansicht (Standard)
- **24 Monate**: Zwei-Jahres-Planungsansicht
- **36/60 Monate**: Langfristige strategische Ansicht

### Stellendetails verstehen

Jede Stelle zeigt:
- **Objekt-ID**: Eindeutige Kennung
- **Beschreibung**: Stellenbezeichnung (z.B. "Doktorand Machine Learning")
- **Gehaltsstufe**: Entgeltgruppe (z.B. E13, E14, W3)
- **Prozentsatz**: Wie viel der Stelle besetzt ist (0-100%)
- **Organisationseinheit**: Die Forschungsgruppe oder Abteilung
- **Daten**: Wann die Stelle beginnt und endet

---

## Stellensuche

Die Stellensuche hilft Ihnen, verfügbare Stellen zu finden, die den Anforderungen eines Mitarbeiters entsprechen. Dies ist nützlich, wenn Sie einen neuen Mitarbeiter einstellen oder einen bestehenden Vertrag verlängern müssen.

**Wann sollten Sie die Stellensuche verwenden:**
- Einstellung eines neuen Doktoranden oder Postdocs
- Verlängerung eines Mitarbeitervertrags
- Stellen für Mitarbeiter finden, deren aktuelle Stellen auslaufen
- Verfügbare Kapazitäten in bestimmten Forschungsbereichen erkunden

### So suchen Sie

1. Navigieren Sie zu **Stellensuche** im Menü
2. Füllen Sie die Suchkriterien aus:
   - **Mitarbeiter-Gehaltsstufe** (erforderlich): Die Gehaltsstufe, die der Mitarbeiter benötigt (z.B. E13)
   - **Besetzungsanteil** (erforderlich): Wie viel einer Stelle benötigt wird (z.B. 65%)
   - **Startdatum** (erforderlich): Wann die Beschäftigung beginnen soll
   - **Enddatum** (erforderlich): Wann die Beschäftigung enden soll
   - **Forschungsgruppe** (optional): Suche auf einen bestimmten Lehrstuhl oder ein Institut beschränken
   - **Relevanztyp** (optional): Nach bestimmten Stellenkategorien filtern
3. Klicken Sie auf **Suchen**

![Stellensuche-Formular](images/position-finder-form.png)
*Das Stellensuche-Formular mit allen Filteroptionen*

### Wie der Suchalgorithmus funktioniert

Die Stellensuche verwendet einen ausgeklügelten Matching-Algorithmus, um die besten verfügbaren Stellen für Ihre Anforderungen zu finden. So funktioniert es in einfachen Worten:

#### Schritt 1: Kandidatenstellen finden

Zunächst identifiziert Position Manager alle Stellen, die potenziell Ihren Mitarbeiter aufnehmen könnten:

1. **Gehaltsstufen-Abgleich**: Nur Stellen mit einer passenden oder höheren Gehaltsstufe werden berücksichtigt. Wenn Sie beispielsweise nach einem E13-Mitarbeiter suchen, werden sowohl E13- als auch E14-Stellen einbezogen (da E14 ein höheres Budget hat), aber E12-Stellen werden ausgeschlossen (unzureichendes Budget).

2. **Optionale Filter**: Wenn Sie eine Forschungsgruppe oder einen Relevanztyp angeben, werden nur Stellen einbezogen, die diesen Kriterien entsprechen.

3. **Gehaltsstufen-Normalisierung**: Das System behandelt automatisch verschiedene Gehaltsstufen-Formate. "E13", "E 13", "e13" und "E13 TVL" werden alle als dieselbe Gehaltsstufe behandelt.

#### Schritt 2: Verfügbarkeit über den gesamten Zeitraum prüfen

Dies ist der wichtigste Schritt. Position Manager stellt sicher, dass die Stelle Ihren Mitarbeiter **für den gesamten Zeitraum** aufnehmen kann, nicht nur am Startdatum.

**Warum das wichtig ist:** Eine Stelle könnte heute zu 80% verfügbar sein, aber in drei Monaten vollständig besetzt. Der Algorithmus prüft jedes Datum in Ihrem angeforderten Zeitraum und verwendet die **schlechteste Verfügbarkeit**, um sicherzustellen, dass Ihr Mitarbeiter einen garantierten Platz für die gesamte Vertragslaufzeit hat.

**Wie es funktioniert:**

1. Der Algorithmus identifiziert alle Daten, an denen sich die Verfügbarkeit ändert (wenn bestehende Zuweisungen beginnen oder enden)
2. Er teilt den Zeitraum basierend auf diesen Daten in Abschnitte auf
3. Für jeden Abschnitt berechnet er, wie viel der Stelle bereits zugewiesen ist
4. Er nimmt die **minimale Verfügbarkeit** über alle Abschnitte

**Beispiel:** Sie suchen nach 50% Verfügbarkeit von Januar bis Dezember:
- Januar-März: 70% verfügbar (eine 30%-Zuweisung)
- April-September: 40% verfügbar (zusätzliche 30%-Zuweisung begonnen)
- Oktober-Dezember: 100% verfügbar (alle Zuweisungen beendet)

Ergebnis: Die Stelle zeigt nur **40% verfügbar** an, weil das der schlechteste Fall während Ihres Zeitraums ist. Diese Stelle würde NICHT Ihrer 50%-Anforderung entsprechen, da es einen Zeitraum gibt, in dem sie Ihren Mitarbeiter nicht aufnehmen kann.

#### Schritt 3: Bewertung und Rangfolge der Übereinstimmungen

Stellen, die die Verfügbarkeitsprüfung bestehen, werden basierend auf drei Faktoren bewertet:

| Faktor | Gewichtung | Was er misst |
|--------|------------|--------------|
| **Budgeteffizienz** | 50% | Wie gut das Stellenbudget zu den Mitarbeiterkosten passt |
| **Aufteilungsminimierung** | 30% | Ob die Stelle bereits andere Mitarbeiter hat |
| **Zeitliche Überlappung** | 20% | Ob die Stellendaten Ihre Anforderungen vollständig abdecken |

**Budgeteffizienz (50% der Punktzahl):**
- Perfekte Übereinstimmung (gleiche Gehaltsstufe): 100 Punkte
- Stelle mit höherer Gehaltsstufe: Punkte sinken basierend auf "Verschwendung" (ungenutztes Budget)
- Beispiel: E13-Mitarbeiter auf E13-Stelle = 100 Punkte; E13 auf E14 = ~85 Punkte

**Aufteilungsminimierung (30% der Punktzahl):**
- Leere Stelle (keine aktuellen Zuweisungen): 100 Punkte
- Eine bestehende Zuweisung: 80 Punkte
- Zwei bestehende Zuweisungen: 50 Punkte
- Drei oder mehr: 25 Punkte oder weniger

Stellen mit weniger bestehenden Mitarbeitern werden bevorzugt, da sie einfacher zu verwalten sind.

**Zeitliche Überlappung (20% der Punktzahl):**
- Stelle deckt Ihre Daten vollständig ab: 100 Punkte
- Teilweise Abdeckung: Punkte proportional zur Überlappung
- Keine Überlappung: Stelle wird ausgeschlossen

#### Schritt 4: Aufteilungsvorschläge generieren

Wenn keine einzelne Stelle Ihre Anforderungen erfüllen kann, schlägt Position Manager **Kombinationen** von Stellen vor:

1. **Teilweise Übereinstimmungen finden**: Identifiziert alle Stellen mit verfügbarer Kapazität
2. **Stellen kombinieren**: Testet Kombinationen von 2, 3 oder 4 Stellen
3. **Kombinationen bewerten**: Sortiert nach wenigsten benötigten Stellen, dann nach minimalem Überschuss

**Beispiel:** Sie benötigen 100% Beschäftigung, aber keine einzelne Stelle hat diese Kapazität.
Position Manager könnte vorschlagen: Stelle A (50%) + Stelle B (50%) = 100% gesamt

Das System gibt bis zu 8 Vorschläge zurück und bevorzugt:
- Weniger Stellen (2 Aufteilungen besser als 3)
- Minimaler Überschuss (100% gesamt besser als 120% gesamt)

### Ergebnisse verstehen

Die Suchergebnisse zeigen passende Stellen sortiert nach ihrer Gesamtpunktzahl:

![Stellensuche-Ergebnisse](images/position-finder-result.jpg)
*Suchergebnisse mit passenden Stellen, Qualitätsbewertungen und wichtigen Kennzahlen*

#### Übereinstimmungsqualitäts-Indikatoren

Jedes Ergebnis zeigt eine Qualitätsbewertung basierend auf seiner Punktzahl:

| Bewertung | Punktzahl | Bedeutung |
|-----------|-----------|-----------|
| **Ausgezeichnet** (grün) | 85-100 | Perfekte oder nahezu perfekte Übereinstimmung - sehr empfohlen |
| **Gut** (blau) | 65-84 | Gute Übereinstimmung mit kleinen Kompromissen |
| **Befriedigend** (gelb) | 40-64 | Akzeptabel, aber mit Einschränkungen |
| **Mangelhaft** (rot) | Unter 40 | Erhebliche Probleme - Alternativen in Betracht ziehen |

#### Wichtige Kennzahlen

Für jede passende Stelle sehen Sie:
- **Monatliche Kosten**: Was diese Stelle pro Monat beim verfügbaren Prozentsatz kostet
- **Verfügbar %**: Die garantierte Mindestverfügbarkeit während Ihres gesamten Zeitraums
- **Überlappung**: Ob die Stellendaten Ihre Anforderungen vollständig abdecken
- **Budgetverschwendung**: Differenz zwischen Stellenbudget und Mitarbeiterkosten (niedriger ist besser)
- **Anzahl Zuweisungen**: Wie viele Mitarbeiter diese Stelle derzeit teilen

#### Warnhinweise

Achten Sie auf diese Warnhinweise:

| Warnung | Schwellenwert | Was es bedeutet |
|---------|---------------|-----------------|
| **Hohe Budgetverschwendung** | >30% | Erhebliche Mittel bleiben ungenutzt |
| **Teilweise Überlappung** | <80% Abdeckung | Stellendaten decken Ihre Anforderungen nicht vollständig ab |
| **Mehrere Zuweisungen** | 2+ Mitarbeiter | Stelle wird bereits von mehreren Personen geteilt |

### Aufteilungsvorschläge

Wenn keine einzelne Stelle Ihren Anforderungen entspricht, zeigt der Abschnitt Aufteilungsvorschläge, wie mehrere Stellen kombiniert werden können:

- **Anzahl Aufteilungen**: Anzahl der Stellen in der Kombination (weniger ist besser)
- **Gesamt verfügbar**: Kombinierter Prozentsatz aus allen Stellen
- **Überschuss**: Betrag über Ihrer Anforderung (kleinerer Überschuss ist besser)
- **Einzelne Stellen**: Details zu jeder Stelle in der Kombination

**Tipps für Aufteilungsvorschläge:**
- Kombinationen mit 2 Stellen sind einfacher zu verwalten als 3 oder 4
- Achten Sie auf Gesamtprozentsätze, die Ihre Anforderungen übersteigen - dies stellt potenzielle Budgetverschwendung dar
- Überlegen Sie, ob der Mitarbeiter praktisch in mehreren Forschungsbereichen arbeiten kann

---

## Forschungsgruppenverwaltung

*Verfügbar für: Nur Administratoren*

Forschungsgruppen repräsentieren die Organisationseinheiten (Lehrstühle, Institute) an der Universität.

### Forschungsgruppen anzeigen

Die Seite Forschungsgruppen zeigt:
- **Name**: Vollständiger Name der Forschungsgruppe
- **Abkürzung**: Kurzcode (z.B. I-ML für Machine Learning)
- **Professor**: Der zugewiesene Leiter der Gruppe
- **Zuweisungsstatus**: Ob der Professor korrekt verknüpft ist
- **Abteilung**: Die übergeordnete Abteilung
- **Stellenanzahl**: Anzahl der zugewiesenen Stellen
- **Status**: Aktiv oder Archiviert

### Eine Forschungsgruppe erstellen

1. Klicken Sie auf **Hinzufügen**
2. Füllen Sie die erforderlichen Felder aus:
   - **Name**: Vollständiger Name (muss eindeutig sein)
   - **Abkürzung**: Kurzcode (muss eindeutig sein)
3. Füllen Sie optionale Felder aus:
   - **Abteilung**: Aus Dropdown auswählen
   - **Campus**: Standort auswählen
   - **Professorenname**: Vor- und Nachname
   - **Professor E-Mail**: E-Mail-Adresse
   - **Professor Universitäts-ID**: Login-ID (z.B. ga69hun)
   - **Website-URL**: Gruppen-Homepage
   - **Beschreibung**: Zusätzliche Informationen
4. Klicken Sie auf **Erstellen**

### Professor-Zuweisungsstatus

Die Spalte **Zuweisung** zeigt, wie der Professor verknüpft ist:

| Symbol | Status | Bedeutung |
|--------|--------|-----------|
| ✓ (grün) | Zugeordnet | Professor ist über Universitäts-ID verknüpft |
| ✉ (blau) | E-Mail | Wird zugeordnet, wenn sich der Professor per E-Mail anmeldet |
| ⚠ (orange) | Manuell | Erfordert manuelle Zuweisung durch Admin |
| - | Keine | Keine Professorinformationen verfügbar |

### Forschungsgruppen importieren

1. Klicken Sie auf **CSV-Import**
2. Wählen Sie Ihre CSV-Datei aus
3. Überprüfen Sie die Importergebnisse:
   - **Erstellt**: Neue Gruppen hinzugefügt
   - **Aktualisiert**: Bestehende Gruppen geändert
   - **Übersprungen**: Doppelte oder ungültige Einträge
   - **Fehler/Warnungen**: Zu überprüfende Probleme

CSV-Format:
```
firstName,lastName,groupName,abbreviation,department,email,login
Maria,Schneider,Machine Learning,I-ML,Informatik,maria.schneider@tum.de,ml52sch
```

### Stellen zu Gruppen zuweisen

Um Stellen automatisch Forschungsgruppen zuzuordnen:

1. Klicken Sie auf **Positionen zuordnen**
2. Das System ordnet Stellen basierend auf Organisationseinheitsnamen zu
3. Überprüfen Sie die Ergebnisse mit zugeordneten und nicht zugeordneten Stellen

---

## Benutzerverwaltung

*Verfügbar für: Nur Administratoren*

### Benutzer anzeigen

Die Benutzerseite zeigt alle Benutzer mit:
- **Name**: Vor- und Nachname
- **Universitäts-ID**: Anmeldekennung
- **E-Mail**: Kontakt-E-Mail
- **Rollen**: Zugewiesene Rollen (Admin, Stellenverwalter, Professor, Mitarbeiter)
- **Forschungsgruppe**: Zugewiesene Gruppe (falls vorhanden)

### Benutzerrollen verwalten

1. Finden Sie den Benutzer in der Liste
2. Klicken Sie auf das **Bearbeiten**-Symbol
3. Aktivieren/deaktivieren Sie die Rollen-Checkboxen:
   - **Admin**: Voller administrativer Zugriff
   - **Stellenverwalter**: Zugriff auf Stellenverwaltung
   - **Professor**: Zugriff auf Forschungsgruppe
   - **Mitarbeiter**: Nur-Lese-Zugriff
4. Klicken Sie auf **Speichern**

### Anmeldestatus verstehen

Benutzer zeigen ein **"Nie angemeldet"**-Tag, wenn sie per Import erstellt wurden, sich aber noch nicht angemeldet haben. Dies hilft zu identifizieren:
- Neu importierte Professoren, die ihre Konten aktivieren müssen
- Benutzer, die möglicherweise Hilfe bei der Anmeldung benötigen

---

## Gehaltsstufenverwaltung

*Verfügbar für: Nur Administratoren*

Gehaltsstufenwerte definieren die in Stellen verwendeten Entgeltgruppen.

### Gehaltsstufen verstehen

| Typ | Beschreibung | Beispiele |
|-----|--------------|-----------|
| E | Mitarbeiter-Gehaltsstufen (TV-L/TVöD) | E8, E9, E10, E11, E12, E13, E14, E15 |
| A | Beamtenbesoldung | A9, A10, A11, A12, A13, A14, A15, A16 |
| W | Professorenbesoldung | W1, W2, W3 |
| C | Alte Professorenbesoldung | C2, C3, C4 |
| SPECIAL | Sonderstellen | Individuelle Gehaltsstufen |

### Gehaltsstufen verwalten

**Um eine neue Gehaltsstufe hinzuzufügen:**
1. Klicken Sie auf **Gehaltsstufe hinzufügen**
2. Geben Sie ein:
   - **Gehaltsstufen-Code**: Eindeutige Kennung (z.B. E13)
   - **Typ**: Gehaltsstufen-Typ auswählen
   - **Anzeigename**: Benutzerfreundlicher Name
   - **Monatswert**: Gehalt für Berechnungen
   - **Min/Max Gehalt**: Gehaltsspanne (optional)
3. Klicken Sie auf **Speichern**

**Um eine Gehaltsstufe zu bearbeiten:**
1. Klicken Sie auf das Bearbeiten-Symbol neben der Gehaltsstufe
2. Ändern Sie die Werte
3. Klicken Sie auf **Speichern**

**Um eine Gehaltsstufe zu löschen:**
1. Klicken Sie auf das Löschen-Symbol
2. Bestätigen Sie die Löschung
3. Hinweis: Verwendete Gehaltsstufen können nicht gelöscht werden

---

## Daten importieren

### Stellenimport

*Verfügbar für: Stellenverwalter und Administratoren*

1. Navigieren Sie zu **Stellen**
2. Klicken Sie auf **Import** oder verwenden Sie die Upload-Schaltfläche
3. Wählen Sie Ihre CSV-Datei aus
4. Das System erkennt automatisch:
   - Das Trennzeichen (Komma, Semikolon oder Tab)
   - Verschiedene Datumsformate
   - Datenintegrität
5. Überprüfen Sie die Importanzahl

### Forschungsgruppen-Import

*Verfügbar für: Nur Administratoren*

1. Navigieren Sie zu **Forschungsgruppen**
2. Klicken Sie auf **CSV-Import**
3. Wählen Sie Ihre CSV-Datei im Format:
   ```
   firstName,lastName,groupName,abbreviation,department,email,login
   ```
4. Überprüfen Sie die Importergebnisse

### Tipps für erfolgreiche Importe

- **Kodierung**: Speichern Sie CSV-Dateien als UTF-8
- **Kopfzeilen**: Fügen Sie eine Kopfzeile mit Spaltennamen ein
- **Daten**: Verwenden Sie gängige Formate (TT.MM.JJJJ, MM/TT/JJ, JJJJ-MM-TT)
- **Leere Werte**: Lassen Sie Felder leer, wenn unbekannt (verwenden Sie nicht "N/A")
- **Duplikate**: Bestehende Datensätze werden aktualisiert, nicht dupliziert

---

## Häufig gestellte Fragen

### Allgemeine Fragen

**F: Ich kann keine Stellen sehen. Was ist falsch?**

A: Überprüfen Sie diese häufigen Ursachen:
1. Ihrem Benutzer ist möglicherweise nicht die richtige Rolle zugewiesen
2. Als Professor/Mitarbeiter können Sie nur Stellen in Ihrer Forschungsgruppe sehen
3. Es gibt möglicherweise noch keine Stellen im System
4. Versuchen Sie, die Filter anzupassen (sie könnten Stellen ausblenden)

**F: Wie ändere ich mein Passwort?**

A: Passwörter werden über das zentrale Authentifizierungssystem der Universität (Keycloak) verwaltet. Kontaktieren Sie Ihre IT-Abteilung, wenn Sie Ihr Passwort zurücksetzen müssen.

**F: Warum kann ich bestimmte Stellen nicht bearbeiten?**

A: Die Stellenbearbeitung hängt von Ihrer Rolle ab:
- Professoren und Mitarbeiter haben nur Lesezugriff
- Stellenverwalter können importieren, aber keine einzelnen Stellen bearbeiten
- Nur Administratoren haben volle Bearbeitungsmöglichkeiten

### Fragen zur Stellensuche

**F: Was bedeutet "Budgetverschwendung"?**

A: Budgetverschwendung zeigt die Differenz zwischen den Kosten einer Stelle und dem, was Sie tatsächlich benötigen. Dies geschieht in zwei Szenarien:
1. **Gehaltsstufenunterschied**: Ein E13-Mitarbeiter auf einer E14-Stelle zu platzieren bedeutet, dass das zusätzliche Budget für die höhere Stufe ungenutzt bleibt.
2. **Prozentunterschied**: Wenn eine Stelle zu 80% verfügbar ist, Sie aber nur 65% benötigen, stellen die verbleibenden 15% ungenutzte Kapazität dar.

Budgetverschwendung ist nicht immer schlecht - manchmal ist es die einzige Option - aber der Algorithmus bevorzugt Stellen, die Verschwendung minimieren.

**F: Warum gibt es keine Ergebnisse für meine Suche?**

A: Häufige Gründe:
1. **Gehaltsstufenfehlanpassung**: Keine Stellen haben eine Gehaltsstufe gleich oder höher als die gesuchte
2. **Keine Verfügbarkeit**: Alle passenden Stellen sind während Ihres Datumsbereichs bereits vollständig zugewiesen
3. **Unzureichende kontinuierliche Verfügbarkeit**: Stellen könnten am Anfang oder Ende Ihres Zeitraums Kapazität haben, aber nicht während der gesamten Zeit
4. **Zu restriktive Filter**: Versuchen Sie, den Forschungsgruppen- oder Relevanztyp-Filter zu entfernen
5. **Probleme mit dem Datumsbereich**: Sehr lange Datumsbereiche sind schwerer abzugleichen, da Stellen kontinuierliche Verfügbarkeit benötigen

**F: Was ist ein "Aufteilungsvorschlag"?**

A: Wenn keine einzelne Stelle Ihre Anforderungen erfüllen kann, schlägt Position Manager vor, mehrere Teilstellen zu kombinieren. Zum Beispiel könnten zwei 50%-Stellen einen 100%-Bedarf decken. Der Algorithmus:
- Testet Kombinationen von 2, 3 und 4 Stellen
- Filtert diejenigen, die Ihre Gesamtprozentanforderung erfüllen
- Rangiert sie nach wenigsten benötigten Stellen und minimalem Überschuss

**F: Warum zeigt eine Stelle weniger Verfügbarkeit als erwartet?**

A: Die Stellensuche zeigt die **garantierte Mindestverfügbarkeit** während Ihres gesamten Suchzeitraums. Selbst wenn eine Stelle heute zu 100% verfügbar ist, wird die angezeigte Verfügbarkeit den schlechtesten Fall widerspiegeln, wenn sie während irgendeines Teils Ihres angeforderten Zeitraums teilweise besetzt sein wird. Dies stellt sicher, dass Ihr Mitarbeiter einen garantierten Platz für seine gesamte Vertragslaufzeit hat.

**F: Was bedeuten die Übereinstimmungsqualitätsbewertungen (Ausgezeichnet, Gut, Befriedigend, Mangelhaft)?**

A: Diese Bewertungen spiegeln die Gesamtübereinstimmungspunktzahl wider, die aus drei Faktoren berechnet wird:
- **Budgeteffizienz (50%)**: Wie gut das Stellenbudget zu den Kosten Ihres Mitarbeiters passt
- **Aufteilungsminimierung (30%)**: Stellen mit weniger bestehenden Zuweisungen erzielen höhere Punktzahlen
- **Zeitliche Überlappung (20%)**: Stellen, die Ihren Datumsbereich vollständig abdecken, erzielen höhere Punktzahlen

Eine "Ausgezeichnete" Übereinstimmung (85-100 Punkte) bedeutet typischerweise: gleiche Gehaltsstufe, leere oder fast leere Stelle und vollständige Datumsabdeckung.

**F: Kann ich einen E13-Mitarbeiter auf einer E14-Stelle platzieren?**

A: Ja. Ein Mitarbeiter kann auf einer Stelle mit einer höheren Gehaltsstufe als benötigt platziert werden - die Stelle hat ausreichend Budget. Dies führt jedoch zu "Budgetverschwendung" (der Unterschied in den monatlichen Kosten zwischen E14 und E13). Der Algorithmus zeigt diese Übereinstimmungen weiterhin an, bewertet sie aber niedriger als perfekt passende Gehaltsstufen.

**F: Warum wird die Gehaltsstufe meines Mitarbeiters nicht erkannt?**

A: Das System normalisiert Gehaltsstufen-Codes automatisch (z.B. werden "E13", "E 13", "e13" alle erkannt). Wenn Sie "Unbekannte Gehaltsstufe"-Fehler sehen:
1. Prüfen Sie auf Tippfehler im Gehaltsstufen-Code
2. Die Gehaltsstufe ist möglicherweise noch nicht im System konfiguriert - kontaktieren Sie einen Administrator, um sie über die Gehaltsstufenverwaltung hinzuzufügen

**F: Was bedeutet die Warnung "Mehrere Zuweisungen"?**

A: Dies zeigt an, dass der Stelle bereits 2 oder mehr Mitarbeiter zugewiesen sind. Während das Aufteilen von Stellen erlaubt ist, haben stark aufgeteilte Stellen:
- Sind administrativ komplexer zu verwalten
- Können Koordinationsherausforderungen haben
- Erzielen niedrigere Punktzahlen im Matching-Algorithmus

Sie können solche Stellen trotzdem wählen, aber überlegen Sie, ob der administrative Aufwand akzeptabel ist.

### Fragen zu Forschungsgruppen

**F: Was bedeutet "Manuelle Zuordnung erforderlich"?**

A: Dies zeigt an, dass das System den Professor für diese Forschungsgruppe nicht automatisch identifizieren konnte. Ein Administrator muss den korrekten Professor manuell zuweisen oder die Universitäts-ID des Professors aktualisieren.

**F: Wie werden Professoren ihren Gruppen zugewiesen?**

A: Es gibt drei Möglichkeiten:
1. **Automatisch per ID**: Wenn die Universitäts-ID des Professors übereinstimmt, wird er bei der Anmeldung automatisch zugewiesen
2. **Automatisch per E-Mail**: Wenn die E-Mail des Professors übereinstimmt, wird er bei der Anmeldung zugewiesen
3. **Manuell**: Ein Administrator weist ihn direkt zu

### Technische Fragen

**F: Welche Browser werden unterstützt?**

A: Position Manager funktioniert am besten mit:
- Google Chrome (empfohlen)
- Mozilla Firefox
- Microsoft Edge
- Safari

**F: Warum lädt die Seite langsam?**

A: Große Datensätze können Zeit zum Laden benötigen. Versuchen Sie:
1. Filter verwenden, um die angezeigten Daten zu reduzieren
2. Einen kürzeren Zeitbereich im Gantt-Diagramm auswählen
3. Ihren Browser-Cache leeren

**F: Ich erhalte einen "Sitzung abgelaufen"-Fehler. Was soll ich tun?**

A: Ihre Anmeldesitzung ist abgelaufen. Aktualisieren Sie einfach die Seite und melden Sie sich erneut an.

---

## Schnelle Tipps

- **Setzen Sie ein Lesezeichen für die Anwendung**: Speichern Sie die Position Manager-URL für einfachen Zugriff
- **Verwenden Sie Filter**: Wenn Seiten langsam laden, verwenden Sie Filter, um die angezeigten Daten zu reduzieren
- **Überprüfen Sie Ihre Rolle**: Wenn Sie erwartete Funktionen nicht sehen können, überprüfen Sie bei einem Administrator, ob Ihre Rolle korrekt ist
- **Browser-Cache leeren**: Wenn Sie Anzeigeprobleme haben, versuchen Sie, den Cache und die Cookies Ihres Browsers zu löschen

---

*Zuletzt aktualisiert: 5. Februar 2026*
