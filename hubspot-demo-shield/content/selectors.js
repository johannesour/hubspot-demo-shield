// Erkennungsregeln für HubSpot. Zentral gesammelt, damit sie bei
// Änderungen am HubSpot-UI leicht nachgepflegt werden können.
// Eigene Regeln kommen zusätzlich über den Element-Picker im Popup.
(() => {
  const HDS = (self.HDS = self.HDS || {});

  // Welcher Generator gehört zu welcher Datenkategorie (Popup-Checkboxen)?
  HDS.GEN_CATEGORY = {
    person: 'names',
    firstname: 'names',
    lastname: 'names',
    email: 'emails',
    phone: 'phones',
    address: 'addresses',
    company: 'companies',
    deal: 'companies',
    domain: 'domains',
    amount: 'amounts',
    text: 'freetext',
    initials: 'names',
    owner: 'owners',
    date: 'personal',
    number: 'personal',
    blur: null // immer aktiv
  };

  // Strukturierte Bereiche. HubSpot-Record-Links sind sehr stabil:
  // /record/0-1/ = Kontakt, 0-2 = Unternehmen, 0-3 = Deal, 0-5 = Ticket.
  HDS.RULES = [
    {
      // Inbox / Konversationen: Absender, Empfänger-Chips, Kopfzeilen
      gen: 'person',
      sel: [
        '[data-test-id="member-header"]',
        '[data-test-id="InboxViewMemberDetailsHeader"]',
        '[data-test-id="sender-name"]',
        '[data-test-id="known-contact-info-highlight"]',
        '[data-selenium-test^="metadata-"] [data-component-name="UITag"]',
        // Formular-Einsendung: Name im Panel-Kopf
        '[data-test-id="submissions-panel-header"] [data-test-id="title-name"]'
      ]
    },
    {
      // Inbox: Betreff, Vorschau, E-Mail-Inhalt, Anhänge; Benachrichtigungs-Karten
      gen: 'text',
      sel: [
        '[data-test-id="member-context"]',
        '[data-test-id="member-preview"]',
        '[data-test-id="thread-toolbar"] [role="heading"]',
        '[data-test-id="email-message-content"]',
        '[data-component-name="MessageContentDom"]',
        '[data-test-id="file-attachments-grid"]',
        '[data-test-id="sidebar-notificationCard-subject"]',
        '[data-test-id="sidebar-notificationCard-body"]'
      ]
    },
    {
      // Avatar-Initialen (SVG-Text) → Fake-Initialen
      gen: 'initials',
      sel: ['[data-test-id="AvatarDisplay-avatarContent"] text', '[data-test-id="content-holder"] text']
    },
    {
      gen: 'person',
      sel: [
        'a[href*="/record/0-1/"]',
        'a[href*="/contact/"]',
        '[data-selenium-test*="contact-name"]',
        '[data-test-id*="contact-name"]'
      ]
    },
    {
      gen: 'company',
      sel: [
        'a[href*="/record/0-2/"]',
        'a[href*="/company/"]',
        '[data-selenium-test*="company-name"]',
        '[data-test-id*="company-name"]'
      ]
    },
    {
      gen: 'deal',
      sel: [
        'a[href*="/record/0-3/"]',
        'a[href*="/deal/"]',
        '[data-selenium-test*="deal-name"]',
        '[data-test-id*="deal-name"]'
      ]
    },
    {
      gen: 'text',
      sel: [
        'a[href*="/record/0-5/"]',
        'a[href*="/ticket/"]',
        // Timeline / Aktivitäten / Notizen (Best effort – ggf. per Picker ergänzen)
        '[data-selenium-test*="timeline-activity-body"]',
        '[data-selenium-test*="timeline-body"]',
        '[data-selenium-test*="engagement-body"]',
        '[data-test-id*="timeline-activity-body"]',
        '[data-test-id*="engagement-body"]',
        '[data-test-id*="note-body"]',
        '[data-test-id*="email-body"]',
        '[class*="TimelineBody"]',
        '[class*="EngagementBody"]'
      ]
    }
  ];

  // HubSpot-interne Property-Namen → Generator. HubSpot schreibt sie in stabile
  // Test-Attribute: Seitenleiste (property-input-<p>), Kopfbereich
  // (highlight-property-display-<p>) und Tabellenzellen (cell-0-1-<p>-<id>).
  HDS.PROPERTY_GEN = {
    firstname: 'firstname',
    lastname: 'lastname',
    hs_full_name_or_email: 'person',
    email: 'email',
    hs_additional_emails: 'email',
    work_email: 'email',
    phone: 'phone',
    mobilephone: 'phone',
    fax: 'phone',
    hs_whatsapp_phone_number: 'phone',
    address: 'address',
    address2: 'address',
    zip: 'address',
    city: 'address',
    company: 'company',
    associatedcompanyid: 'company',
    domain: 'domain',
    website: 'domain',
    hs_linkedin_url: 'domain',
    linkedin_company_page: 'domain',
    twitterhandle: 'domain',
    annualrevenue: 'amount',
    amount: 'amount',
    hs_acv: 'amount',
    hs_arr: 'amount',
    hs_mrr: 'amount',
    hs_tcv: 'amount',
    amount_in_home_currency: 'amount',
    total_revenue: 'amount',
    dealname: 'deal',
    subject: 'text',
    content: 'text',
    description: 'text',
    message: 'text'
  };
  const propRules = {};
  for (const [p, gen] of Object.entries(HDS.PROPERTY_GEN)) {
    (propRules[gen] = propRules[gen] || []).push(
      `[data-selenium-test="property-input-${p}"]`,
      `[data-test-id="highlight-property-display-${p}"]`,
      `[data-test-id^="cell-0-"][data-test-id*="-${p}-"]`
    );
  }
  // Kopfbereich "Jobtitel bei Firma": letzter Teil ist die Firma
  (propRules.company = propRules.company || []).push(
    '[data-key="ObjectHighlightCard.jobtitleAndCompany"] > span:last-child:not(:first-child)'
  );
  // Name-Spalte in Index-Tabellen (Unternehmen: name = Firmenname)
  propRules.company.push('[data-test-id^="cell-0-2-name-"]');
  propRules.person = (propRules.person || []).concat('[data-test-id^="cell-0-1-name-"]');
  HDS.RULES.unshift(...Object.entries(propRules).map(([gen, sel]) => ({ gen, sel })));

  // Eigene (portal-spezifische) Properties anhand ihres internen Namens erkennen,
  // z. B. stastu_geburtstag, mitgliedsnummer, bemerkung, hauptansprechpartner_in.
  HDS.PROPERTY_SKIP = /^(notes_|num_|hs_(?!linkedin|whatsapp|additional_emails|full_name))|(_date|date|datum|_count|_status|_stage|_source|_type)$|createdate|lastmodified|lifecycle/i;
  HDS.PROPERTY_PATTERNS = [
    [/geburt|birth/i, 'date'],
    [/iban|bic|konto|bank|steuer|tax_?id|vat|ust_?id|mitgliedsnummer|member_?(id|nr|number)|kundennummer|customer_?(id|number)|ticket_code|passport|ausweis/i, 'number'],
    [/owner|zustaendig|zuständig/i, 'owner'],
    [/e_?mail/i, 'email'],
    [/phone|telefon|mobil|fax|whatsapp/i, 'phone'],
    [/firstname|vorname/i, 'firstname'],
    [/lastname|nachname/i, 'lastname'],
    [/ansprechpartner|kontaktperson|contact_?person/i, 'person'],
    [/strasse|street|address|adresse|zip|plz|postal|(^|_)(city|stadt|ort)(_|$)/i, 'address'],
    [/linkedin|xing|twitter|facebook|instagram|website|homepage|domain|url/i, 'domain'],
    [/revenue|umsatz|amount|betrag|gehalt|salary|budget|preis|price/i, 'amount'],
    [/bemerkung|notiz|note|comment|kommentar|beschreibung|description|nachricht|message|feedback|anmerkung/i, 'text']
  ];
  // objType: "0-1" Kontakt, "0-2" Firma, "0-3" Deal … ; fallback z. B. 'text' für Formularantworten
  HDS.genForProperty = (prop, objType, fallback = null) => {
    if (!prop) return fallback;
    prop = prop.toLowerCase();
    if (prop === 'name') return objType === '0-1' ? 'person' : objType === '0-2' ? 'company' : fallback || 'text';
    if (HDS.PROPERTY_GEN[prop]) return HDS.PROPERTY_GEN[prop];
    if (/^(hubspot_owner_id|hs_created_by_user_id|hs_updated_by_user_id|hubspot_team_id)$/.test(prop)) return 'owner';
    if (/^associations\./.test(prop) || HDS.PROPERTY_SKIP.test(prop)) return fallback;
    for (const [re, gen] of HDS.PROPERTY_PATTERNS) if (re.test(prop)) return gen;
    return fallback;
  };

  // Werte, die nur Platzhalter sind ("Kein zuständiger Mitarbeiter", "Keine", "Nicht zugewiesen")
  HDS.PLACEHOLDER = /^(kein|keine|keiner|no|none|nicht|unbekannt|unknown|n\/a|unassigned)\b/i;

  // Bilder/Avatare/Logos werden immer unscharf gemacht (nicht ersetzbar).
  HDS.BLUR_SELECTORS = [
    // HubSpot-Avatare: echte Fotos/Logos (KNOWN-SRC) kommen als background-image
    '[data-test-id="content-holder"]:not([data-source^="DEFAULT"])',
    'img[src*="avatar"]',
    'img[src*="gravatar"]',
    'img[src*="logo"]',
    'img[src*="clearbit"]',
    'img[src*="/hubfs/"]',
    '[class*="Avatar"] img',
    '[class*="avatar"] img',
    '[data-test-id*="avatar"] img',
    '[data-selenium-test*="avatar"] img'
  ];

  // Record-Detailseite: Objekt-Typ aus der URL → Überschrift entsprechend ersetzen.
  HDS.RECORD_TYPES = {
    '0-1': 'person',
    '0-2': 'company',
    '0-3': 'deal',
    '0-5': 'text',
    contact: 'person',
    company: 'company',
    deal: 'deal',
    ticket: 'text'
  };
  HDS.RECORD_TITLE_SELECTORS = [
    'h1',
    '[data-selenium-test="highlightTitle"]',
    '[data-selenium-test*="record-title"]',
    '[data-test-id*="record-title"]'
  ];
  HDS.recordTypeFromUrl = (path = location.pathname) => {
    const m =
      path.match(/\/record\/(0-\d+)\//) ||
      path.match(/\/(contact|company|deal|ticket)\/\d+/);
    return m ? HDS.RECORD_TYPES[m[1]] || null : null;
  };

  // Property-Labels (DE + EN). Der Wert neben dem Label wird ersetzt.
  // Bewusst KEINE mehrdeutigen Wörter wie "Name" oder "Unternehmen",
  // die auch in der Navigation vorkommen.
  const L = (gen, ...labels) => labels.map((l) => [l.toLowerCase(), gen]);
  HDS.LABELS = new Map([
    ...L('firstname', 'Vorname', 'First name'),
    ...L('lastname', 'Nachname', 'Last name'),
    ...L('person', 'Vollständiger Name', 'Full name', 'Kontaktperson', 'Ansprechpartner'),
    ...L('email', 'E-Mail', 'E-Mail-Adresse', 'Email', 'Email address'),
    ...L('phone', 'Telefonnummer', 'Mobiltelefonnummer', 'Telefon', 'Mobil', 'Fax', 'Faxnummer',
      'Phone number', 'Mobile phone number', 'Phone', 'Fax number'),
    ...L('address', 'Straße', 'Strasse', 'Adresse', 'Straße und Hausnummer', 'Postleitzahl', 'PLZ',
      'Stadt', 'Ort', 'Street address', 'Address', 'Postal code', 'Zip', 'Zip code', 'City'),
    ...L('company', 'Firmenname', 'Unternehmensname', 'Company name', 'Firma (Text)'),
    ...L('domain', 'Website-URL', 'Website URL', 'Website', 'Unternehmensdomainname',
      'Company domain name', 'Domain name', 'LinkedIn-Profil', 'LinkedIn', 'LinkedIn Bio'),
    ...L('amount', 'Betrag', 'Amount', 'Jahresumsatz', 'Annual revenue', 'Gesamtumsatz',
      'Total revenue', 'Deal-Betrag', 'Deal amount', 'Umsatz', 'Revenue')
  ]);

  HDS.LABEL_PATTERNS = [
    [/zuständige[rn]?\s+mitarbeiter(in)?$|(^|\s)owner$|^zugewiesen an$|^assigned to$/i, 'owner'],
    [/geburtstag|geburtsdatum|birthday|date of birth/i, 'date'],
    [/mitgliedsnummer|kundennummer|^iban$|steuernummer|ust-?id/i, 'number'],
    [/bemerkung|^notiz$|kommentar|anmerkung/i, 'text'],
    [/ansprechpartner(\/?in)?$/i, 'person']
  ];
  HDS.labelGen = (t) => {
    const g = HDS.LABELS.get(t);
    if (g) return g;
    for (const [re, gen] of HDS.LABEL_PATTERNS) if (re.test(t)) return gen;
    return null;
  };

  // Hier werden keine Property-Labels gesucht (Navigation, Timeline-Texte, Tabellenköpfe)
  HDS.LABEL_EXCLUDE = [
    'nav', '[role="navigation"]', '[role="menu"]', '[role="tab"]', '[role="tablist"]', 'button',
    'thead', 'th', '[data-test-id="formatted-be-message"]',
    '[data-selenium-test*="timeline"]', '[data-test-id*="timeline"]'
  ].join(',');

  // Nie anfassen
  HDS.IGNORE_SELECTOR = [
    'script', 'style', 'noscript', 'template', 'code', '[data-hds-ignore]',
    // eigener Account / Portalname in der globalen Leiste (keine Kundendaten)
    '#hs-global-toolbar-accounts', '[data-test-id="hs-global-toolbar-accounts"]'
  ].join(',');

  // Domains, die niemals ersetzt werden (HubSpot selbst etc.)
  HDS.SAFE_HOSTS = /(^|\.)(hubspot\.(com|de|net)|hubspotusercontent[\w-]*\.(com|net)|hubapi\.com|hsforms\.(com|net)|hs-sites\.com|hscollectedforms\.net|example\.(com|org|net)|w3\.org|google\.com|gstatic\.com)$/i;

  // Regex-Fallback für Fließtext
  HDS.RE = {
    email: /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g,
    url: /(?<![@\w.\-])(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+(?:de|com|net|org|io|ch|at|eu|co|info|biz|ai|app|tech|digital|shop|uk|fr|nl|it|es|be|pl|cz|dk|se|no|fi|us|ca|me|tv|cloud|online|gmbh|ag))(?![\w\-])((?:\/[^\s"'<>)]*)?)/gi,
    phone: /(?:\+|\b00)\d{1,3}[\s\-/().]*(?:\d[\s\-/().]*){5,14}\d|\b0[1-9]\d{1,5}[\s\-/]+\d{2,}(?:[\s\-]\d{1,6})*|\b0[1-9]\d{8,12}\b/g,
    amount: /(?:[€$£]|EUR|USD|CHF|GBP)\s?\d{1,3}(?:[.,   ]\d{3})*(?:[.,]\d{1,2})?(?:\s?(?:Tsd\.|Mio\.|k|K|M)\b)?|\b\d{1,3}(?:[.,   ]\d{3})*(?:[.,]\d{1,2})?\s?(?:Tsd\.\s?|Mio\.\s?|k\s?|K\s?)?(?:[€$£]|EUR\b|USD\b|CHF\b|GBP\b)/g,
    iban: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g
  };
})();
