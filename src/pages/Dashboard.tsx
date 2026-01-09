import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Bestellungen, Auftragsbestaetigungen, FreigabeWorkflow, Abgleichsergebnisse } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  BarChart3,
  PlusCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Color Palette
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface DashboardStats {
  totalAbgleiche: number;
  offeneAbgleiche: number;
  abweichungenCount: number;
  freigegeben: number;
  inPruefung: number;
  abgelehnt: number;
  kritischeAbweichungen: number;
  durchschnittlichePreisabweichung: number;
  durchschnittlicheMengenabweichung: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [bestellungen, setBestellungen] = useState<Bestellungen[]>([]);
  const [auftragsbestaetigungen, setAuftragsbestaetigungen] = useState<Auftragsbestaetigungen[]>([]);
  const [abgleichsergebnisse, setAbgleichsergebnisse] = useState<Abgleichsergebnisse[]>([]);
  const [freigabeWorkflow, setFreigabeWorkflow] = useState<FreigabeWorkflow[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    totalAbgleiche: 0,
    offeneAbgleiche: 0,
    abweichungenCount: 0,
    freigegeben: 0,
    inPruefung: 0,
    abgelehnt: 0,
    kritischeAbweichungen: 0,
    durchschnittlichePreisabweichung: 0,
    durchschnittlicheMengenabweichung: 0,
  });

  // Load Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [bestellungenData, abData, abgleichData, freigabeData] = await Promise.all([
        LivingAppsService.getBestellungen(),
        LivingAppsService.getAuftragsbestaetigungen(),
        LivingAppsService.getAbgleichsergebnisse(),
        LivingAppsService.getFreigabeWorkflow(),
      ]);

      setBestellungen(bestellungenData);
      setAuftragsbestaetigungen(abData);
      setAbgleichsergebnisse(abgleichData);
      setFreigabeWorkflow(freigabeData);

      // Calculate Stats
      calculateStats(abgleichData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (abgleiche: Abgleichsergebnisse[]) => {
    const totalAbgleiche = abgleiche.length;
    const offeneAbgleiche = abgleiche.filter(a => a.fields.freigabestatus === 'offen' || a.fields.freigabestatus === 'in_pruefung').length;
    const abweichungenCount = abgleiche.filter(a => a.fields.abweichungen_vorhanden === true).length;
    const freigegeben = abgleiche.filter(a => a.fields.freigabestatus === 'freigegeben').length;
    const inPruefung = abgleiche.filter(a => a.fields.freigabestatus === 'in_pruefung').length;
    const abgelehnt = abgleiche.filter(a => a.fields.freigabestatus === 'abgelehnt').length;

    // Kritische Abweichungen: Außerhalb der Toleranz
    const kritischeAbweichungen = abgleiche.filter(a =>
      (a.fields.innerhalb_mengentoleran === false && a.fields.mengenabweichung_prozent != null) ||
      (a.fields.innerhalb_preistoleranz === false && a.fields.preisabweichung_prozent != null)
    ).length;

    // Durchschnittliche Abweichungen
    const preisAbweichungen = abgleiche
      .filter(a => a.fields.preisabweichung_prozent != null)
      .map(a => Math.abs(a.fields.preisabweichung_prozent || 0));
    const mengenAbweichungen = abgleiche
      .filter(a => a.fields.mengenabweichung_prozent != null)
      .map(a => Math.abs(a.fields.mengenabweichung_prozent || 0));

    const durchschnittlichePreisabweichung = preisAbweichungen.length > 0
      ? preisAbweichungen.reduce((a, b) => a + b, 0) / preisAbweichungen.length
      : 0;
    const durchschnittlicheMengenabweichung = mengenAbweichungen.length > 0
      ? mengenAbweichungen.reduce((a, b) => a + b, 0) / mengenAbweichungen.length
      : 0;

    setStats({
      totalAbgleiche,
      offeneAbgleiche,
      abweichungenCount,
      freigegeben,
      inPruefung,
      abgelehnt,
      kritischeAbweichungen,
      durchschnittlichePreisabweichung,
      durchschnittlicheMengenabweichung,
    });
  };

  // Chart Data Preparation
  const getAbweichungstypenData = () => {
    const types: Record<string, number> = {
      'Mengenabweichung': 0,
      'Preisabweichung': 0,
      'Artikelnummernabweichung': 0,
      'Lieferterminabweichung': 0,
    };

    abgleichsergebnisse.forEach(abgleich => {
      const abweichungstyp = abgleich.fields.abweichungstyp;
      if (abweichungstyp) {
        // abweichungstyp ist multiplelookup/checkbox -> Array oder String
        const typen = Array.isArray(abweichungstyp) ? abweichungstyp : [abweichungstyp];
        typen.forEach((typ: string) => {
          if (typ === 'mengenabweichung') types['Mengenabweichung']++;
          if (typ === 'preisabweichung') types['Preisabweichung']++;
          if (typ === 'artikelnummernabweichung') types['Artikelnummernabweichung']++;
          if (typ === 'lieferterminabweichung') types['Lieferterminabweichung']++;
        });
      }
    });

    return Object.entries(types)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  };

  const getFreigabestatusData = () => {
    const statusLabels: Record<string, string> = {
      offen: 'Offen',
      in_pruefung: 'In Prüfung',
      freigegeben: 'Freigegeben',
      abgelehnt: 'Abgelehnt',
    };

    return [
      { name: statusLabels.offen, value: abgleichsergebnisse.filter(a => a.fields.freigabestatus === 'offen').length },
      { name: statusLabels.in_pruefung, value: stats.inPruefung },
      { name: statusLabels.freigegeben, value: stats.freigegeben },
      { name: statusLabels.abgelehnt, value: stats.abgelehnt },
    ].filter(item => item.value > 0);
  };

  const getToleranzanalyseData = () => {
    const innerhalbToleranz = abgleichsergebnisse.filter(a =>
      a.fields.innerhalb_mengentoleran === true && a.fields.innerhalb_preistoleranz === true
    ).length;
    const ausserhalbToleranz = abgleichsergebnisse.filter(a =>
      a.fields.innerhalb_mengentoleran === false || a.fields.innerhalb_preistoleranz === false
    ).length;

    return [
      { name: 'Innerhalb Toleranz', Anzahl: innerhalbToleranz },
      { name: 'Außerhalb Toleranz', Anzahl: ausserhalbToleranz },
    ].filter(item => item.Anzahl > 0);
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={loadData} className="ml-4">
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty State
  if (abgleichsergebnisse.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Keine Abgleichsergebnisse vorhanden</h2>
          <p className="text-muted-foreground mb-6">
            Es wurden noch keine Auftragsbestätigungen mit Bestellungen abgeglichen.
          </p>
          <Button size="lg" onClick={() => window.location.reload()}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Neuen Abgleich starten
          </Button>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auftragsbestätigungs-Abgleich</h1>
          <p className="text-muted-foreground mt-1">
            Übersicht über alle Abgleichsergebnisse und Freigaben
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            Aktualisieren
          </Button>
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Neuer Abgleich
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {stats.kritischeAbweichungen > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {stats.kritischeAbweichungen} kritische Abweichung{stats.kritischeAbweichungen > 1 ? 'en' : ''} außerhalb der Toleranz erfordern sofortige Aufmerksamkeit!
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Abgleiche */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Abgleiche</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAbgleiche}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bestellungen.length} Bestellungen • {auftragsbestaetigungen.length} Bestätigungen
            </p>
          </CardContent>
        </Card>

        {/* Offene Abgleiche */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Abgleiche</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offeneAbgleiche}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.inPruefung} in Prüfung
            </p>
          </CardContent>
        </Card>

        {/* Abweichungen */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abweichungen erkannt</CardTitle>
            <AlertCircle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.abweichungenCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.kritischeAbweichungen} kritisch
            </p>
          </CardContent>
        </Card>

        {/* Freigegeben */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freigegeben</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.freigegeben}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.abgelehnt} abgelehnt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Abweichungstypen */}
        <Card>
          <CardHeader>
            <CardTitle>Abweichungstypen</CardTitle>
            <CardDescription>Verteilung der erkannten Abweichungsarten</CardDescription>
          </CardHeader>
          <CardContent>
            {getAbweichungstypenData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getAbweichungstypenData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Keine Abweichungen vorhanden
              </div>
            )}
          </CardContent>
        </Card>

        {/* Freigabestatus Verteilung */}
        <Card>
          <CardHeader>
            <CardTitle>Freigabestatus</CardTitle>
            <CardDescription>Aktuelle Verteilung der Freigabestatus</CardDescription>
          </CardHeader>
          <CardContent>
            {getFreigabestatusData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getFreigabestatusData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getFreigabestatusData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Keine Daten verfügbar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Toleranzanalyse */}
        <Card>
          <CardHeader>
            <CardTitle>Toleranzanalyse</CardTitle>
            <CardDescription>Abgleiche innerhalb und außerhalb der definierten Toleranzen</CardDescription>
          </CardHeader>
          <CardContent>
            {getToleranzanalyseData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getToleranzanalyseData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Anzahl" fill={COLORS.info} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Keine Toleranzdaten verfügbar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Durchschnittliche Abweichungen */}
        <Card>
          <CardHeader>
            <CardTitle>Durchschnittliche Abweichungen</CardTitle>
            <CardDescription>Durchschnittliche Preis- und Mengenabweichungen in Prozent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 pt-4">
              {/* Preisabweichung */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Preisabweichung</span>
                  <Badge variant={stats.durchschnittlichePreisabweichung > 5 ? "destructive" : "secondary"}>
                    {stats.durchschnittlichePreisabweichung.toFixed(2)}%
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${stats.durchschnittlichePreisabweichung > 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(stats.durchschnittlichePreisabweichung * 10, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Mengenabweichung */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Mengenabweichung</span>
                  <Badge variant={stats.durchschnittlicheMengenabweichung > 5 ? "destructive" : "secondary"}>
                    {stats.durchschnittlicheMengenabweichung.toFixed(2)}%
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${stats.durchschnittlicheMengenabweichung > 5 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(stats.durchschnittlicheMengenabweichung * 10, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Info Text */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {stats.durchschnittlichePreisabweichung > 5 || stats.durchschnittlicheMengenabweichung > 5 ? (
                    <>
                      <TrendingUp className="inline h-4 w-4 text-red-500 mr-1" />
                      Erhöhte Abweichungen erkannt - Überprüfung empfohlen
                    </>
                  ) : (
                    <>
                      <TrendingDown className="inline h-4 w-4 text-green-500 mr-1" />
                      Abweichungen im normalen Bereich
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Letzte Abgleichsergebnisse */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Abgleichsergebnisse</CardTitle>
          <CardDescription>Die 5 neuesten Abgleichsergebnisse</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {abgleichsergebnisse
              .sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
              .slice(0, 5)
              .map((abgleich) => (
                <div key={abgleich.record_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status Icon */}
                    {abgleich.fields.freigabestatus === 'freigegeben' && (
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    )}
                    {abgleich.fields.freigabestatus === 'abgelehnt' && (
                      <XCircle className="h-5 w-5 text-danger flex-shrink-0" />
                    )}
                    {abgleich.fields.freigabestatus === 'in_pruefung' && (
                      <Clock className="h-5 w-5 text-warning flex-shrink-0" />
                    )}
                    {abgleich.fields.freigabestatus === 'offen' && (
                      <AlertCircle className="h-5 w-5 text-info flex-shrink-0" />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {abgleich.fields.artikelnummer_bestellung || 'Keine Artikelnummer'}
                        </span>
                        {abgleich.fields.abweichungen_vorhanden && (
                          <Badge variant="destructive" className="text-xs">
                            Abweichungen
                          </Badge>
                        )}
                        {!abgleich.fields.innerhalb_preistoleranz && abgleich.fields.preisabweichung_prozent != null && (
                          <Badge variant="outline" className="text-xs border-red-500 text-red-500">
                            Preis kritisch
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {abgleich.fields.abgleichsdatum
                          ? format(new Date(abgleich.fields.abgleichsdatum), 'PPp', { locale: de })
                          : format(new Date(abgleich.createdat), 'PPp', { locale: de })}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={
                      abgleich.fields.freigabestatus === 'freigegeben' ? 'default' :
                      abgleich.fields.freigabestatus === 'abgelehnt' ? 'destructive' :
                      abgleich.fields.freigabestatus === 'in_pruefung' ? 'secondary' :
                      'outline'
                    }
                  >
                    {abgleich.fields.freigabestatus === 'offen' && 'Offen'}
                    {abgleich.fields.freigabestatus === 'in_pruefung' && 'In Prüfung'}
                    {abgleich.fields.freigabestatus === 'freigegeben' && 'Freigegeben'}
                    {abgleich.fields.freigabestatus === 'abgelehnt' && 'Abgelehnt'}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
