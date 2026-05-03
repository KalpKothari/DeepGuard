import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, RefreshCw, Shield, BadgeCheck, Clock3 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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

const ADMIN_EMAIL = 'kalpkothari14@gmail.com';

const AdminUniqueVisitorsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<VisitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = user?.email === ADMIN_EMAIL;

  const loadVisitors = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    // eslint-disable-next-line no-console
    console.debug('AdminUniqueVisitorsList supabaseUrl=', supabaseUrl, 'anonKeyPresent=', Boolean(supabaseAnonKey));

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const requestUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/website_visitors?select=user_id,name,email,subscription,event_type,first_seen_at,last_seen_at,visit_count&order=last_seen_at.desc`;

    // eslint-disable-next-line no-console
    console.debug('AdminUniqueVisitorsList fetch ->', requestUrl);

    const response = await fetch(requestUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.debug('AdminUniqueVisitorsList fetch failed', response.status, body);
      throw new Error(`Unable to load visitors (${response.status}): ${body}`);
    }

    const data = (await response.json()) as VisitorRow[];
    setRows(data);
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    loadVisitors()
      .catch((error: any) => {
        toast.error(error.message || 'Unable to load visitor analytics');
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="glass rounded-3xl border border-border/50 p-8 max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-[0.2em]">
            <Shield className="w-3.5 h-3.5" />
            Restricted Access
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Admin view is locked</h1>
          <p className="text-sm text-muted-foreground">
            This page is available only to the admin account tied to {ADMIN_EMAIL}.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVisitors();
      toast.success('Unique visitors list refreshed');
    } catch (error: any) {
      toast.error(error.message || 'Unable to refresh unique visitors list');
    } finally {
      setRefreshing(false);
    }
  };

  const premiumUsersCount = useMemo(() => {
    return rows.filter((row) => row.subscription === 'premium').length;
  }, [rows]);

  const latestActivity = useMemo(() => {
    return rows[0]?.last_seen_at;
  }, [rows]);

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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] mt-4">
                <Shield className="w-3.5 h-3.5" />
                Unique Visitors
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Unique Registered Users</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Complete list of all unique registered users. Each user is counted only once regardless of visit frequency.
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
                <Users className="w-4 h-4 text-primary" />
                Total Unique Visitors
              </div>
              <div className="text-3xl font-black text-foreground">{rows.length}</div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                <BadgeCheck className="w-4 h-4 text-success" />
                Premium Users
              </div>
              <div className="text-3xl font-black text-foreground">{premiumUsersCount}</div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                <Clock3 className="w-4 h-4 text-warning" />
                Latest Activity
              </div>
              <div className="text-sm font-semibold text-foreground">{formatDateTime(latestActivity)}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 overflow-hidden bg-background/80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Total Visits</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Loading unique visitors...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No unique visitors yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground">{row.email}</TableCell>
                      <TableCell>
                        <span className="text-xs px-2.5 py-1.5 rounded-full font-semibold" 
                          style={{
                            backgroundColor: row.subscription === 'premium' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.3)',
                            color: row.subscription === 'premium' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                          }}
                        >
                          {row.subscription}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">{row.visit_count || 0}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(row.first_seen_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(row.last_seen_at)}</TableCell>
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

export default AdminUniqueVisitorsList;
