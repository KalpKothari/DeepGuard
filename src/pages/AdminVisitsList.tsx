import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

type VisitorRow = {
  user_id: string;
  name: string;
  email: string;
  subscription: 'free' | 'premium';
  event_type: 'signup' | 'login' | 'subscription_update';
  first_seen_at?: string;
  last_seen_at?: string;
  visit_count?: number;
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const AdminVisitsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<VisitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVisitors = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    // eslint-disable-next-line no-console
    console.debug('AdminVisitsList supabaseUrl=', supabaseUrl, 'anonKeyPresent=', Boolean(supabaseAnonKey));

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const baseUrl = supabaseUrl.replace(/\/$/, '');
    const headers = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    };

    // Try to fetch from the per-visit event log first (new schema)
    try {
      const eventLogUrl = `${baseUrl}/rest/v1/website_visit_events?select=id,user_id,name,email,subscription,event_type,seen_at&order=seen_at.desc`;
      // eslint-disable-next-line no-console
      console.debug('AdminVisitsList trying event log ->', eventLogUrl);

      const eventResponse = await fetch(eventLogUrl, { headers });

      if (eventResponse.ok) {
        const eventData = (await eventResponse.json()) as Array<{
          id: number;
          user_id: string;
          name: string;
          email: string;
          subscription: 'free' | 'premium';
          event_type: string;
          seen_at: string;
        }>;
        // Transform to VisitorRow format with seen_at as last_seen_at
        const data: VisitorRow[] = eventData.map((row) => ({
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          subscription: row.subscription,
          event_type: row.event_type as 'signup' | 'login' | 'subscription_update',
          last_seen_at: row.seen_at,
        }));
        setRows(data);
        return;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('AdminVisitsList event log fetch failed, falling back to summary:', error);
    }

    // Fall back to the summary visitors table (old schema or while new table is being provisioned)
    try {
      const summaryUrl = `${baseUrl}/rest/v1/website_visitors?select=user_id,name,email,subscription,event_type,first_seen_at,last_seen_at,visit_count&order=last_seen_at.desc`;
      // eslint-disable-next-line no-console
      console.debug('AdminVisitsList fetch summary ->', summaryUrl);

      const response = await fetch(summaryUrl, { headers });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        // eslint-disable-next-line no-console
        console.debug('AdminVisitsList summary fetch failed', response.status, body);
        throw new Error(`Unable to load visits (${response.status}): ${body}`);
      }

      const data = (await response.json()) as VisitorRow[];
      setRows(data);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    loadVisitors()
      .catch((error: any) => {
        toast.error(error.message || 'Unable to load visit analytics');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVisitors();
      toast.success('Visit analytics refreshed');
    } catch (error: any) {
      toast.error(error.message || 'Unable to refresh visit analytics');
    } finally {
      setRefreshing(false);
    }
  };

  const totalVisits = useMemo(() => {
    return rows.reduce((acc, row) => acc + (row.visit_count ?? 1), 0);
  }, [rows]);

  const uniqueUsers = useMemo(() => {
    return rows.length;
  }, [rows]);

  const averageVisits = useMemo(() => {
    return uniqueUsers > 0 ? (totalVisits / uniqueUsers).toFixed(1) : '0';
  }, [totalVisits, uniqueUsers]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl border border-border/50 p-6 md:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/admin-dashboard')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-xs font-bold uppercase tracking-[0.2em] mt-4">
                <Activity className="w-3.5 h-3.5" />
                Total Visits
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Visit Tracking Details</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Every visit is counted here, including multiple visits from the same user. Track the complete user activity.
              </p>
            </div>

            <Button onClick={handleRefresh} disabled={refreshing || loading} className="gap-2 rounded-xl">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                <Activity className="w-4 h-4 text-warning" />
                Total Visits
              </div>
              <div className="text-3xl font-black text-foreground">{totalVisits}</div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Unique Users
              </div>
              <div className="text-3xl font-black text-foreground">{uniqueUsers}</div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Average Visits
              </div>
              <div className="text-3xl font-black text-foreground">{averageVisits}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 overflow-hidden bg-background/80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visit #</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Loading visit records...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No visit records yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((visit, idx) => (
                    <TableRow key={visit.user_id}>
                      <TableCell className="text-sm font-semibold text-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{visit.name}</TableCell>
                      <TableCell className="text-muted-foreground">{visit.email}</TableCell>
                      <TableCell>
                        <Badge variant={visit.subscription === 'premium' ? 'default' : 'outline'}>
                          {visit.subscription}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(visit.last_seen_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default AdminVisitsList;
