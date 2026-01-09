import { useEffect, useState } from 'react';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type {
  Auftragsbestaetigungen,
  FreigabeWorkflow,
  Bestellungen,
  Abgleichsergebnisse
} from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  PlusCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [auftragsbestaetigungen, setAuftragsbestaetigungen] = useState<Auftragsbestaetigungen[]>([]);
  const [abgleichsergebnisse, setAbgleichsergebnisse] = useState<Abgleichsergebnisse[]>([]);
  const [freigabeWorkflows, setFreigabeWorkflows] = useState<FreigabeWorkflow[]>([]);

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [abs, results, workflows] = await Promise.all([
          LivingAppsService.getAuftragsbestaetigungen(),
          LivingAppsService.getAbgleichsergebnisse(),
          LivingAppsService.getFreigabeWorkflow(),
        ]);

        setAuftragsbestaetigungen(abs);
        setAbgleichsergebnisse(results);
        setFreigabeWorkflows(workflows);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Calculate KPIs
  const offeneAbgleiche = abgleichsergebnisse.filter(
    a => a.fields.freigabestatus === 'offen' || a.fields.freigabestatus === 'in_pruefung'
  ).length;

  const abgleicheGesamt = abgleichsergebnisse.length;

  const abgleicheMitAbweichungen = abgleichsergebnisse.filter(
    a => a.fields.abweichungen_vorhanden === true
  ).length;

  const abweichungsRate = abgleicheGesamt > 0
    ? Math.round((abgleicheMitAbweichungen / abgleicheGesamt) * 100)
    : 0;

  const freigegebeneAbgleiche = abgleichsergebnisse.filter(
    a => a.fields.freigabestatus === 'freigegeben'
  ).length;

  const freigabeQuote = abgleicheGesamt > 0
    ? Math.round((freigegebeneAbgleiche / abgleicheGesamt) * 100)
    : 0;

  // Chart Data: Freigabestatus Distribution
  const statusData = [
    {
      name: 'Offen',
      value: abgleichsergebnisse.filter(a => a.fields.freigabestatus === 'offen').length,
      color: '#94a3b8'
    },
    {
      name: 'In Prüfung',
      value: abgleichsergebnisse.filter(a => a.fields.freigabestatus === 'in_pruefung').length,
      color: '#60a5fa'
    },
    {
      name: 'Freigegeben',
      value: abgleichsergebnisse.filter(a => a.fields.freigabestatus === 'freigegeben').length,
      color: '#22c55e'
    },
    {
      name: 'Abgelehnt',
      value: abgleichsergebnisse.filter(a => a.fields.freigabestatus === 'abgelehnt').length,
      color: '#ef4444'
    },
  ].filter(item => item.value > 0);

  // Chart Data: Abweichungstypen
  const abweichungsTypen: { [key: string]: number } = {};
  abgleichsergebnisse.forEach(result => {
    if (result.fields.abweichungen_vorhanden && result.fields.abweichungstyp) {
      // abweichungstyp ist multiplelookup/checkbox - kann Array oder String sein
      const typen = Array.isArray(result.fields.abweichungstyp)
        ? result.fields.abweichungstyp
        : [result.fields.abweichungstyp];

      typen.forEach((typ: string) => {
        abweichungsTypen[typ] = (abweichungsTypen[typ] || 0) + 1;
      });
    }
  });

  const abweichungsData = Object.entries(abweichungsTypen).map(([key, value]) => {
    const labels: { [key: string]: string } = {
      preisabweichung: 'Preis',
      mengenabweichung: 'Menge',
      lieferterminabweichung: 'Liefertermin',
      artikelnummernabweichung: 'Artikelnummer'
    };
    return { name: labels[key] || key, value };
  });

  // Recent results for table
  const recentResults = [...abgleichsergebnisse]
    .sort((a, b) => {
      const dateA = a.fields.abgleichsdatum || a.createdat;
      const dateB = b.fields.abgleichsdatum || b.createdat;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 10);

  // Get Auftragsbestaetigung details for a result
  const getABDetails = (abUrl: string | null | undefined) => {
    if (!abUrl) return null;
    const abId = extractRecordId(abUrl);
    if (!abId) return null;
    return auftragsbestaetigungen.find(ab => ab.record_id === abId);
  };

  // Format badge for status
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">Unbekannt</Badge>;

    const variants: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      offen: { label: 'Offen', variant: 'outline' },
      in_pruefung: { label: 'In Prüfung', variant: 'default' },
      freigegeben: { label: 'Freigegeben', variant: 'default' },
      abgelehnt: { label: 'Abgelehnt', variant: 'destructive' },
    };

    const config = variants[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Auftragsbestätigungs-Abgleich</h1>
            <p className="text-gray-600 mt-1">
              Übersicht aller Abgleichsergebnisse und Freigaben
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-5 w-5" />
                Neuen Abgleich starten
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Abgleich starten</DialogTitle>
                <DialogDescription>
                  Diese Funktion würde einen neuen Abgleich zwischen Bestellung und Auftragsbestätigung durchführen.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Diese Demo zeigt nur die Visualisierung. Ein vollständiger Abgleich-Workflow würde hier implementiert werden.
                  </AlertDescription>
                </Alert>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Offene Abgleiche */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Offene Abgleiche
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{offeneAbgleiche}</div>
            <p className="text-xs text-gray-600 mt-1">
              von {abgleicheGesamt} gesamt
            </p>
          </CardContent>
        </Card>

        {/* Abweichungsrate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Abweichungsrate
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{abweichungsRate}%</div>
            <p className="text-xs text-gray-600 mt-1">
              {abgleicheMitAbweichungen} von {abgleicheGesamt}
            </p>
            {abweichungsRate > 20 && (
              <div className="flex items-center mt-2 text-orange-600 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Erhöhte Abweichungsrate
              </div>
            )}
          </CardContent>
        </Card>

        {/* Freigabequote */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Freigabequote
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{freigabeQuote}%</div>
            <p className="text-xs text-gray-600 mt-1">
              {freigegebeneAbgleiche} freigegeben
            </p>
            {freigabeQuote >= 80 && (
              <div className="flex items-center mt-2 text-green-600 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Hohe Freigabequote
              </div>
            )}
            {freigabeQuote < 50 && (
              <div className="flex items-center mt-2 text-red-600 text-xs">
                <TrendingDown className="h-3 w-3 mr-1" />
                Niedrige Freigabequote
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auftragsbestätigungen */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Auftragsbestätigungen
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{auftragsbestaetigungen.length}</div>
            <p className="text-xs text-gray-600 mt-1">
              im System erfasst
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Freigabestatus Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Freigabestatus</CardTitle>
            <CardDescription>Verteilung der Abgleichsergebnisse nach Status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Keine Daten verfügbar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Abweichungstypen Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Abweichungstypen</CardTitle>
            <CardDescription>Häufigkeit der verschiedenen Abweichungsarten</CardDescription>
          </CardHeader>
          <CardContent>
            {abweichungsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={abweichungsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Anzahl" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Keine Abweichungen erfasst
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aktuelle Abgleichsergebnisse</CardTitle>
          <CardDescription>Die 10 neuesten Abgleiche im System</CardDescription>
        </CardHeader>
        <CardContent>
          {recentResults.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Auftragsnummer</TableHead>
                    <TableHead>Lieferant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Abweichungen</TableHead>
                    <TableHead className="text-right">Preis-Abw.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentResults.map(result => {
                    const ab = getABDetails(result.fields.auftragsbestaetigung);
                    const datum = result.fields.abgleichsdatum || result.createdat;

                    return (
                      <TableRow key={result.record_id}>
                        <TableCell className="font-medium">
                          {format(new Date(datum), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell>
                          {ab?.fields.auftragsnummer || '-'}
                        </TableCell>
                        <TableCell>
                          {ab?.fields.lieferant_name || '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(result.fields.freigabestatus)}
                        </TableCell>
                        <TableCell>
                          {result.fields.abweichungen_vorhanden ? (
                            <div className="flex items-center text-orange-600">
                              <XCircle className="h-4 w-4 mr-1" />
                              Ja
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Nein
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {result.fields.preisabweichung_wert != null ? (
                            <span className={result.fields.preisabweichung_wert !== 0 ? 'text-orange-600 font-medium' : ''}>
                              {result.fields.preisabweichung_wert.toFixed(2)} €
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Abgleichsergebnisse vorhanden</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
