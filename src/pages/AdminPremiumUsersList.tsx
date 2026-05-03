import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
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

const AdminPremiumUsersList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<VisitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVisitors = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    // eslint-disable-next-line no-console
    console.debug('AdminPremiumUsersList supabaseUrl=', supabaseUrl, 'anonKeyPresent=', Boolean(supabaseAnonKey));

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const requestUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/website_visitors?select=user_id,name,email,subscription,event_type,first_seen_at,last_seen_at,visit_count&order=last_seen_at.desc`;

    // eslint-disable-next-line no-console
    console.debug('AdminPremiumUsersList fetch ->', requestUrl);

    const response = await fetch(requestUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.debug('AdminPremiumUsersList fetch failed', response.status, body);
      throw new Error(`Unable to load premium users (${response.status}): ${body}`);
    }

    const data = (await response.json()) as VisitorRow[];
    setRows(data);
  };

  useEffect(() => {
    loadVisitors()
      .catch((error: any) => {
        toast.error(error.message || 'Unable to load premium users');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVisitors();
      toast.success('Premium users list refreshed');
    } catch (error: any) {
      toast.error(error.message || 'Unable to refresh premium users list');
    } finally {
      setRefreshing(false);
    }
  };

  const premiumUsers = useMemo(() => {
    return rows.filter((row) => row.subscription === 'premium');
  }, [rows]);

  const totalPremiumRevenue = useMemo(() => {
    return premiumUsers.length;
  }, [premiumUsers]);

  const totalPremiumVisits = useMemo(() => {
    return premiumUsers.reduce((acc, user) => acc + (user.visit_count ?? 0), 0);
  }, [premiumUsers]);

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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-bold uppercase tracking-[0.2em] mt-4">
                <Crown className="w-3.5 h-3.5" />
                Premium Users
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Premium Users</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                View all users with premium subscription. See their contact information and engagement metrics.
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
                <Crown className="w-4 h-4 text-success" />
                Total Premium Users
              </div>
              <div className="text-3xl font-black text-foreground">{totalPremiumRevenue}</div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Total Visits
              </div>
              <div className="text-3xl font-black text-foreground">{totalPremiumVisits}</div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Avg Visits/User
              </div>
              <div className="text-3xl font-black text-foreground">
                {premiumUsers.length > 0 ? (totalPremiumVisits / premiumUsers.length).toFixed(1) : 0}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 overflow-hidden bg-background/80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Visit Count</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Loading premium users...
                    </TableCell>
                  </TableRow>
                ) : premiumUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No premium users yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  premiumUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">{user.visit_count || 0}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(user.first_seen_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(user.last_seen_at)}</TableCell>
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

export default AdminPremiumUsersList;
