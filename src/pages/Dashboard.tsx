import { useEffect, useState } from 'react';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Bestellungen, Auftragsbestaetigungen, Abgleichsergebnisse, FreigabeWorkflow } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  PlusCircle,
  Package,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Chart Colors
const COLORS = {
  mengenabweichung: '#ef4444',
  preisabweichung: '#f59e0b',
  artikelnummernabweichung: '#8b5cf6',
  lieferterminabweichung: '#06b6d4',
  offen: '#64748b',
  in_pruefung: '#f59e0b',
  freigegeben: '#22c55e',
  abgelehnt: '#ef4444',
};

interface DashboardData {
  bestellungen: Bestellungen[];
  auftragsbestaetigungen: Auftragsbestaetigungen[];
  abgleichsergebnisse: Abgleichsergebnisse[];
  freigabeWorkflow: FreigabeWorkflow[];
}

interface BestellungFormData {
  bestellnummer: string;
  bestelldatum: string;
  lieferant: string;
  artikelnummer: string;
  artikelbezeichnung: string;
  bestellte_menge: string;
  mengeneinheit: string;
  einzelpreis: string;
  erwartetes_lieferdatum: string;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<BestellungFormData>({
    bestellnummer: '',
    bestelldatum: format(new Date(), 'yyyy-MM-dd'),
    lieferant: '',
    artikelnummer: '',
    artikelbezeichnung: '',
    bestellte_menge: '',
    mengeneinheit: 'Stück',
    einzelpreis: '',
    erwartetes_lieferdatum: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [bestellungen, auftragsbestaetigungen, abgleichsergebnisse, freigabeWorkflow] = await Promise.all([
        LivingAppsService.getBestellungen(),
        LivingAppsService.getAuftragsbestaetigungen(),
        LivingAppsService.getAbgleichsergebnisse(),
        LivingAppsService.getFreigabeWorkflow(),
      ]);
      setData({ bestellungen, auftragsbestaetigungen, abgleichsergebnisse, freigabeWorkflow });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBestellung(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const gesamtpreis = parseFloat(formData.einzelpreis) * parseFloat(formData.bestellte_menge);
      await LivingAppsService.createBestellungenEntry({
        bestellnummer: formData.bestellnummer,
        bestelldatum: formData.bestelldatum,
        lieferant: formData.lieferant,
        artikelnummer: formData.artikelnummer,
        artikelbezeichnung: formData.artikelbezeichnung,
        bestellte_menge: parseFloat(formData.bestellte_menge),
        mengeneinheit: formData.mengeneinheit,
        einzelpreis: parseFloat(formData.einzelpreis),
        gesamtpreis: gesamtpreis,
        erwartetes_lieferdatum: formData.erwartetes_lieferdatum,
      });
      setDialogOpen(false);
      setFormData({
        bestellnummer: '',
        bestelldatum: format(new Date(), 'yyyy-MM-dd'),
        lieferant: '',
        artikelnummer: '',
        artikelbezeichnung: '',
        bestellte_menge: '',
        mengeneinheit: 'Stück',
        einzelpreis: '',
        erwartetes_lieferdatum: '',
      });
      await loadData();
    } catch (err) {
      alert('Fehler beim Erstellen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setSubmitting(false);
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Lade Dashboard-Daten...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Keine Daten verfügbar'}
            <Button onClick={loadData} variant="outline" className="mt-4 w-full">
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate KPIs
  const totalBestellungen = data.bestellungen.length;
  const totalAuftragsbestaetigungen = data.auftragsbestaetigungen.length;
  const abgleichsergebnisseMitAbweichungen = data.abgleichsergebnisse.filter(a => a.fields.abweichungen_vorhanden).length;
  const abgleichsergebnisseOhneAbweichungen = data.abgleichsergebnisse.length - abgleichsergebnisseMitAbweichungen;

  const statusCounts = {
    offen: data.abgleichsergebnisse.filter(a => a.fields.freigabestatus === 'offen').length,
    in_pruefung: data.abgleichsergebnisse.filter(a => a.fields.freigabestatus === 'in_pruefung').length,
    freigegeben: data.abgleichsergebnisse.filter(a => a.fields.freigabestatus === 'freigegeben').length,
    abgelehnt: data.abgleichsergebnisse.filter(a => a.fields.freigabestatus === 'abgelehnt').length,
  };

  const totalGesamtpreis = data.bestellungen.reduce((sum, b) => sum + (b.fields.gesamtpreis || 0), 0);

  // Abweichungstypen analysieren (multiplelookup ist ein Array von Keys)
  const abweichungsTypenCount: Record<string, number> = {
    mengenabweichung: 0,
    preisabweichung: 0,
    artikelnummernabweichung: 0,
    lieferterminabweichung: 0,
  };

  data.abgleichsergebnisse.forEach(a => {
    if (a.fields.abweichungstyp) {
      // abweichungstyp ist ein String wie "mengenabweichung,preisabweichung"
      const typen = a.fields.abweichungstyp.split(',').map(t => t.trim());
      typen.forEach(typ => {
        if (typ in abweichungsTypenCount) {
          abweichungsTypenCount[typ]++;
        }
      });
    }
  });

  const abweichungsChartData = [
    { name: 'Mengenabweichung', value: abweichungsTypenCount.mengenabweichung, color: COLORS.mengenabweichung },
    { name: 'Preisabweichung', value: abweichungsTypenCount.preisabweichung, color: COLORS.preisabweichung },
    { name: 'Artikelnr.-Abw.', value: abweichungsTypenCount.artikelnummernabweichung, color: COLORS.artikelnummernabweichung },
    { name: 'Liefertermin-Abw.', value: abweichungsTypenCount.lieferterminabweichung, color: COLORS.lieferterminabweichung },
  ].filter(d => d.value > 0);

  const freigabeStatusChartData = [
    { name: 'Offen', value: statusCounts.offen, color: COLORS.offen },
    { name: 'In Prüfung', value: statusCounts.in_pruefung, color: COLORS.in_pruefung },
    { name: 'Freigegeben', value: statusCounts.freigegeben, color: COLORS.freigegeben },
    { name: 'Abgelehnt', value: statusCounts.abgelehnt, color: COLORS.abgelehnt },
  ].filter(d => d.value > 0);

  // Kritische Fälle: Abweichungen mit Status "offen" oder "abgelehnt"
  const kritischeFaelle = data.abgleichsergebnisse.filter(a =>
    a.fields.abweichungen_vorhanden &&
    (a.fields.freigabestatus === 'offen' || a.fields.freigabestatus === 'abgelehnt')
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Auftragsbestätigungs-Abgleich</h1>
              <p className="text-sm text-slate-600 mt-1">Überwachung und Verwaltung von Bestellabgleichen</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Neue Bestellung
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Neue Bestellung erstellen</DialogTitle>
                  <DialogDescription>
                    Erfassen Sie eine neue Bestellung im System
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBestellung} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bestellnummer">Bestellnummer *</Label>
                      <Input
                        id="bestellnummer"
                        required
                        value={formData.bestellnummer}
                        onChange={e => setFormData({ ...formData, bestellnummer: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bestelldatum">Bestelldatum *</Label>
                      <Input
                        id="bestelldatum"
                        type="date"
                        required
                        value={formData.bestelldatum}
                        onChange={e => setFormData({ ...formData, bestelldatum: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="lieferant">Lieferant *</Label>
                    <Input
                      id="lieferant"
                      required
                      value={formData.lieferant}
                      onChange={e => setFormData({ ...formData, lieferant: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="artikelnummer">Artikelnummer *</Label>
                      <Input
                        id="artikelnummer"
                        required
                        value={formData.artikelnummer}
                        onChange={e => setFormData({ ...formData, artikelnummer: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="artikelbezeichnung">Artikelbezeichnung *</Label>
                      <Input
                        id="artikelbezeichnung"
                        required
                        value={formData.artikelbezeichnung}
                        onChange={e => setFormData({ ...formData, artikelbezeichnung: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bestellte_menge">Menge *</Label>
                      <Input
                        id="bestellte_menge"
                        type="number"
                        step="0.01"
                        required
                        value={formData.bestellte_menge}
                        onChange={e => setFormData({ ...formData, bestellte_menge: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mengeneinheit">Einheit *</Label>
                      <Input
                        id="mengeneinheit"
                        required
                        value={formData.mengeneinheit}
                        onChange={e => setFormData({ ...formData, mengeneinheit: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="einzelpreis">Einzelpreis (EUR) *</Label>
                      <Input
                        id="einzelpreis"
                        type="number"
                        step="0.01"
                        required
                        value={formData.einzelpreis}
                        onChange={e => setFormData({ ...formData, einzelpreis: e.target.value })}
                      />
                    </div>
                  </div>

                  {formData.bestellte_menge && formData.einzelpreis && (
                    <div className="bg-slate-100 p-3 rounded-md">
                      <p className="text-sm text-slate-600">
                        Gesamtpreis: <span className="font-semibold text-slate-900">
                          {(parseFloat(formData.einzelpreis) * parseFloat(formData.bestellte_menge)).toFixed(2)} EUR
                        </span>
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="erwartetes_lieferdatum">Erwartetes Lieferdatum *</Label>
                    <Input
                      id="erwartetes_lieferdatum"
                      type="date"
                      required
                      value={formData.erwartetes_lieferdatum}
                      onChange={e => setFormData({ ...formData, erwartetes_lieferdatum: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting ? 'Erstelle...' : 'Bestellung erstellen'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Bestellungen</CardTitle>
              <Package className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBestellungen}</div>
              <p className="text-xs text-slate-600 mt-1">
                Gesamtwert: {totalGesamtpreis.toFixed(2)} EUR
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Auftragsbestätigungen</CardTitle>
              <FileText className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAuftragsbestaetigungen}</div>
              <p className="text-xs text-slate-600 mt-1">
                Empfangene PDFs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Abweichungen</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{abgleichsergebnisseMitAbweichungen}</div>
              <p className="text-xs text-slate-600 mt-1">
                {abgleichsergebnisseOhneAbweichungen} ohne Abweichung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Freigabestatus</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statusCounts.freigegeben}</div>
              <p className="text-xs text-slate-600 mt-1">
                {statusCounts.offen} offen, {statusCounts.in_pruefung} in Prüfung
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Abweichungstypen Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Abweichungstypen</CardTitle>
            </CardHeader>
            <CardContent>
              {abweichungsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={abweichungsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {abweichungsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Keine Abweichungen vorhanden</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Freigabestatus Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Freigabestatus-Verteilung</CardTitle>
            </CardHeader>
            <CardContent>
              {freigabeStatusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={freigabeStatusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {freigabeStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Keine Freigabedaten vorhanden</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kritische Fälle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Kritische Fälle ({kritischeFaelle.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kritischeFaelle.length > 0 ? (
              <div className="space-y-4">
                {kritischeFaelle.slice(0, 10).map((abgleich) => {
                  const bestellungId = extractRecordId(abgleich.fields.bestellung);
                  const bestellung = bestellungId ? data.bestellungen.find(b => b.record_id === bestellungId) : null;

                  return (
                    <div key={abgleich.record_id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={abgleich.fields.freigabestatus === 'abgelehnt' ? 'destructive' : 'default'}>
                              {abgleich.fields.freigabestatus === 'offen' && 'Offen'}
                              {abgleich.fields.freigabestatus === 'abgelehnt' && 'Abgelehnt'}
                              {abgleich.fields.freigabestatus === 'in_pruefung' && 'In Prüfung'}
                              {abgleich.fields.freigabestatus === 'freigegeben' && 'Freigegeben'}
                            </Badge>
                            {bestellung && (
                              <span className="text-sm font-medium text-slate-900">
                                Bestellung: {bestellung.fields.bestellnummer}
                              </span>
                            )}
                          </div>

                          {bestellung && (
                            <p className="text-sm text-slate-600 mb-2">
                              {bestellung.fields.artikelbezeichnung} ({bestellung.fields.artikelnummer})
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {abgleich.fields.abweichungstyp?.split(',').map(typ => {
                              const trimmedTyp = typ.trim();
                              let label = trimmedTyp;
                              let icon = null;

                              if (trimmedTyp === 'mengenabweichung') {
                                label = 'Mengenabweichung';
                                icon = <TrendingDown className="h-3 w-3" />;
                              } else if (trimmedTyp === 'preisabweichung') {
                                label = 'Preisabweichung';
                                icon = <TrendingUp className="h-3 w-3" />;
                              } else if (trimmedTyp === 'artikelnummernabweichung') {
                                label = 'Artikelnr.-Abweichung';
                                icon = <AlertCircle className="h-3 w-3" />;
                              } else if (trimmedTyp === 'lieferterminabweichung') {
                                label = 'Liefertermin-Abweichung';
                                icon = <Clock className="h-3 w-3" />;
                              }

                              return (
                                <Badge key={trimmedTyp} variant="outline" className="flex items-center gap-1">
                                  {icon}
                                  {label}
                                </Badge>
                              );
                            })}
                          </div>

                          {abgleich.fields.abweichungsbegruendung && (
                            <p className="text-sm text-slate-500 mt-2 italic">
                              "{abgleich.fields.abweichungsbegruendung}"
                            </p>
                          )}
                        </div>

                        <div className="text-right ml-4">
                          {abgleich.fields.mengenabweichung_prozent !== undefined && (
                            <div className="text-sm">
                              <span className="text-slate-600">Menge:</span>
                              <span className={`ml-1 font-semibold ${Math.abs(abgleich.fields.mengenabweichung_prozent) > 10 ? 'text-red-600' : 'text-orange-600'}`}>
                                {abgleich.fields.mengenabweichung_prozent > 0 ? '+' : ''}{abgleich.fields.mengenabweichung_prozent.toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {abgleich.fields.preisabweichung_prozent !== undefined && (
                            <div className="text-sm">
                              <span className="text-slate-600">Preis:</span>
                              <span className={`ml-1 font-semibold ${Math.abs(abgleich.fields.preisabweichung_prozent) > 10 ? 'text-red-600' : 'text-orange-600'}`}>
                                {abgleich.fields.preisabweichung_prozent > 0 ? '+' : ''}{abgleich.fields.preisabweichung_prozent.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {kritischeFaelle.length > 10 && (
                  <p className="text-sm text-slate-500 text-center pt-2">
                    ... und {kritischeFaelle.length - 10} weitere kritische Fälle
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Keine kritischen Fälle vorhanden</p>
                <p className="text-sm mt-1">Alle Abweichungen sind freigegeben oder in Prüfung</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Stats */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Dashboard aktualisiert am {format(new Date(), 'PPP', { locale: de })} um {format(new Date(), 'HH:mm')} Uhr
          </p>
        </div>
      </main>
    </div>
  );
}
