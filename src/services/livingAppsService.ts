// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Bestellungen, Auftragsbestaetigungen, FreigabeWorkflow, Abgleichsergebnisse } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- BESTELLUNGEN ---
  static async getBestellungen(): Promise<Bestellungen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.BESTELLUNGEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getBestellungenEntry(id: string): Promise<Bestellungen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.BESTELLUNGEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createBestellungenEntry(fields: Bestellungen['fields']) {
    return callApi('POST', `/apps/${APP_IDS.BESTELLUNGEN}/records`, { fields });
  }
  static async updateBestellungenEntry(id: string, fields: Partial<Bestellungen['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.BESTELLUNGEN}/records/${id}`, { fields });
  }
  static async deleteBestellungenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.BESTELLUNGEN}/records/${id}`);
  }

  // --- AUFTRAGSBESTAETIGUNGEN ---
  static async getAuftragsbestaetigungen(): Promise<Auftragsbestaetigungen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.AUFTRAGSBESTAETIGUNGEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getAuftragsbestaetigungenEntry(id: string): Promise<Auftragsbestaetigungen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.AUFTRAGSBESTAETIGUNGEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createAuftragsbestaetigungenEntry(fields: Auftragsbestaetigungen['fields']) {
    return callApi('POST', `/apps/${APP_IDS.AUFTRAGSBESTAETIGUNGEN}/records`, { fields });
  }
  static async updateAuftragsbestaetigungenEntry(id: string, fields: Partial<Auftragsbestaetigungen['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.AUFTRAGSBESTAETIGUNGEN}/records/${id}`, { fields });
  }
  static async deleteAuftragsbestaetigungenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.AUFTRAGSBESTAETIGUNGEN}/records/${id}`);
  }

  // --- FREIGABE_WORKFLOW ---
  static async getFreigabeWorkflow(): Promise<FreigabeWorkflow[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.FREIGABE_WORKFLOW}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getFreigabeWorkflowEntry(id: string): Promise<FreigabeWorkflow | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.FREIGABE_WORKFLOW}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createFreigabeWorkflowEntry(fields: FreigabeWorkflow['fields']) {
    return callApi('POST', `/apps/${APP_IDS.FREIGABE_WORKFLOW}/records`, { fields });
  }
  static async updateFreigabeWorkflowEntry(id: string, fields: Partial<FreigabeWorkflow['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.FREIGABE_WORKFLOW}/records/${id}`, { fields });
  }
  static async deleteFreigabeWorkflowEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.FREIGABE_WORKFLOW}/records/${id}`);
  }

  // --- ABGLEICHSERGEBNISSE ---
  static async getAbgleichsergebnisse(): Promise<Abgleichsergebnisse[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ABGLEICHSERGEBNISSE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getAbgleichsergebnisseEntry(id: string): Promise<Abgleichsergebnisse | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ABGLEICHSERGEBNISSE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createAbgleichsergebnisseEntry(fields: Abgleichsergebnisse['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ABGLEICHSERGEBNISSE}/records`, { fields });
  }
  static async updateAbgleichsergebnisseEntry(id: string, fields: Partial<Abgleichsergebnisse['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ABGLEICHSERGEBNISSE}/records/${id}`, { fields });
  }
  static async deleteAbgleichsergebnisseEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ABGLEICHSERGEBNISSE}/records/${id}`);
  }

}