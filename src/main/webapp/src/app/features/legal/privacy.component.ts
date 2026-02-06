import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-privacy',
  template: `
    <div class="legal-page">
      <div class="content">
        <h1>Datenschutzerklärung</h1>

        <section>
          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br /><br />
            Technische Universität München<br />
            Prof. Dr. Stephan Krusche<br />
            Boltzmannstraße 3<br />
            85748 Garching<br />
            E-Mail: krusche(at)tum.de
          </p>
        </section>

        <section>
          <h2>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
          <p>Bei der Nutzung von Position Manager werden folgende personenbezogene Daten verarbeitet:</p>
          <ul>
            <li>Name und Vorname</li>
            <li>E-Mail-Adresse</li>
            <li>Universitätskennung (TUM-ID)</li>
            <li>Zugewiesene Rollen und Berechtigungen</li>
          </ul>
          <p>
            Diese Daten werden über das zentrale Identitätsmanagementsystem der TUM (Keycloak)
            bereitgestellt und sind für die Nutzung der Anwendung erforderlich.
          </p>
        </section>

        <section>
          <h2>3. Zweck der Datenverarbeitung</h2>
          <p>Die erhobenen Daten werden ausschließlich für folgende Zwecke verwendet:</p>
          <ul>
            <li>Authentifizierung und Autorisierung der Benutzer</li>
            <li>Verwaltung von Stellenbesetzungen und Personalplanung</li>
            <li>Protokollierung von Änderungen zu Revisionszwecken</li>
          </ul>
        </section>

        <section>
          <h2>4. Rechtsgrundlage</h2>
          <p>
            Die Verarbeitung der personenbezogenen Daten erfolgt auf Grundlage von Art. 6 Abs. 1
            lit. e DSGVO in Verbindung mit Art. 4 BayDSG zur Wahrnehmung einer Aufgabe, die im
            öffentlichen Interesse liegt.
          </p>
        </section>

        <section>
          <h2>5. Speicherdauer</h2>
          <p>
            Die personenbezogenen Daten werden nur so lange gespeichert, wie dies für die Erfüllung
            der oben genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten
            bestehen.
          </p>
        </section>

        <section>
          <h2>6. Ihre Rechte</h2>
          <p>Sie haben das Recht:</p>
          <ul>
            <li>Auskunft über Ihre gespeicherten personenbezogenen Daten zu verlangen</li>
            <li>Berichtigung unrichtiger Daten zu verlangen</li>
            <li>
              Löschung Ihrer Daten zu verlangen, soweit keine gesetzlichen Aufbewahrungspflichten
              entgegenstehen
            </li>
            <li>Einschränkung der Verarbeitung zu verlangen</li>
            <li>Sich bei einer Aufsichtsbehörde zu beschweren</li>
          </ul>
        </section>

        <section>
          <h2>7. Datenschutzbeauftragter</h2>
          <p>
            Der Datenschutzbeauftragte der Technischen Universität München:<br /><br />
            Technische Universität München<br />
            Behördlicher Datenschutzbeauftragter<br />
            Arcisstraße 21<br />
            80333 München<br />
            E-Mail: beauftragter(at)datenschutz.tum.de
          </p>
        </section>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }

    .legal-page {
      flex: 1;
      padding: 2rem;
    }

    .content {
      max-width: 800px;
      margin: 0 auto;
    }

    h1 {
      margin: 0 0 2rem 0;
      color: var(--p-text-color);
    }

    h2 {
      margin: 1.5rem 0 0.5rem 0;
      font-size: 1.1rem;
      color: var(--p-text-color);
    }

    section:first-of-type h2 {
      margin-top: 0;
    }

    p {
      margin: 0.5rem 0;
      color: var(--p-text-muted-color);
      line-height: 1.6;
    }

    ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
      color: var(--p-text-muted-color);
      line-height: 1.6;
    }

    li {
      margin: 0.25rem 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {}
