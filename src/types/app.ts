// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Bestellungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    bestellnummer?: string;
    bestelldatum?: string; // Format: YYYY-MM-DD oder ISO String
    lieferant?: string;
    artikelnummer?: string;
    artikelbezeichnung?: string;
    bestellte_menge?: number;
    mengeneinheit?: string;
    einzelpreis?: number;
    gesamtpreis?: number;
    erwartetes_lieferdatum?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Auftragsbestaetigungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    ab_artikelbezeichnung?: string;
    ab_menge?: number;
    ab_mengeneinheit?: string;
    ab_einzelpreis?: number;
    ab_gesamtpreis?: number;
    ab_liefertermin?: string; // Format: YYYY-MM-DD oder ISO String
    bestellung?: string; // applookup -> URL zu 'Bestellungen' Record
    pdf_dokument?: string;
    extraktionsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    lieferant_name?: string;
    auftragsnummer?: string;
    auftragsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    ab_artikelnummer?: string;
  };
}

export interface Abgleichsergebnisse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    bestellung?: string; // applookup -> URL zu 'Bestellungen' Record
    auftragsbestaetigung?: string; // applookup -> URL zu 'Auftragsbestaetigungen' Record
    abgleichsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    abweichungen_vorhanden?: boolean;
    abweichungstyp?: string;
    mengenabweichung_wert?: number;
    mengenabweichung_prozent?: number;
    preisabweichung_wert?: number;
    preisabweichung_prozent?: number;
    artikelnummer_bestellung?: string;
    artikelnummer_ab?: string;
    mengentoleranzschwelle?: number;
    preistoleranz_schwelle?: number;
    innerhalb_mengentoleran?: boolean;
    innerhalb_preistoleranz?: boolean;
    abweichungsbegruendung?: string;
    freigabestatus?: 'offen' | 'in_pruefung' | 'freigegeben' | 'abgelehnt';
  };
}

export interface FreigabeWorkflow {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    abgleichsergebnis?: string; // applookup -> URL zu 'Abgleichsergebnisse' Record
    pruefer_vorname?: string;
    pruefer_nachname?: string;
    pruefdatum?: string; // Format: YYYY-MM-DD oder ISO String
    freigabeentscheidung?: string;
    kommentar?: string;
    korrekturmassnahmen?: string;
    nachverfolgung_erforderlich?: boolean;
    nachverfolgungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export const APP_IDS = {
  BESTELLUNGEN: '694532fe73b552902caa58ed',
  AUFTRAGSBESTAETIGUNGEN: '69453303665fce2960971eb7',
  ABGLEICHSERGEBNISSE: '694533049c70094c80005f30',
  FREIGABE_WORKFLOW: '69453305f1dda178412288b8',
} as const;

// Helper Types for creating new records
export type CreateBestellungen = Bestellungen['fields'];
export type CreateAuftragsbestaetigungen = Auftragsbestaetigungen['fields'];
export type CreateAbgleichsergebnisse = Abgleichsergebnisse['fields'];
export type CreateFreigabeWorkflow = FreigabeWorkflow['fields'];