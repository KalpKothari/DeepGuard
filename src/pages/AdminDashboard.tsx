import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Crown, RefreshCw, Shield, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<VisitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVisitors = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    // Dev debug: show whether env vars are available at runtime (do not print full anon key)
    // Remove in production.
    // eslint-disable-next-line no-console
    console.debug('AdminDashboard supabaseUrl=', supabaseUrl, 'anonKeyPresent=', Boolean(supabaseAnonKey));

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const requestUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/website_visitors?select=user_id,name,email,subscription,event_type,first_seen_at,last_seen_at,visit_count&order=last_seen_at.desc`;

    // Dev debug: print composed request (masked key printed above in console)
    // eslint-disable-next-line no-console
    console.debug('AdminDashboard fetch ->', requestUrl);

    const response = await fetch(requestUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.debug('AdminDashboard fetch failed', response.status, body);
      throw new Error(`Unable to load visitors (${response.status}): ${body}`);
    }

    const data = (await response.json()) as VisitorRow[];
    setRows(data);
  };

  useEffect(() => {
    loadVisitors()
      .catch((error: any) => {
        toast.error(error.message || 'Unable to load admin analytics');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVisitors();
      toast.success('Dashboard refreshed');
    } catch (error: any) {
      toast.error(error.message || 'Unable to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const uniqueVisitors = rows.length;
    const premiumUsers = rows.filter((row) => row.subscription === 'premium').length;
    const totalVisits = rows.reduce((acc, row) => acc + (row.visit_count ?? 0), 0);
    return { uniqueVisitors, premiumUsers, totalVisits };
  }, [rows]);

  const trendData = useMemo(() => {
    const today = new Date();
    const labels: Array<{ key: string; day: string }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      labels.push({
        key: d.toISOString().slice(0, 10),
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }

    return labels.map((item) => {
      const dayRows = rows.filter((row) => row.last_seen_at?.startsWith(item.key));
      const uniqueVisitors = dayRows.length;
      const totalVisits = dayRows.reduce((acc, row) => acc + (row.visit_count ?? 0), 0);
      const premiumUsers = dayRows.filter((row) => row.subscription === 'premium').length;
      
      return {
        day: item.day,
        uniqueVisitors,
        totalVisits,
        premiumUsers,
      };
    });
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em]">
                <Shield className="w-3.5 h-3.5" />
                Admin Dashboard
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Website Visitor Analytics</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Unified view of unique visitors, plans, and recent login activity.
              </p>
            </div>

            <Button onClick={handleRefresh} disabled={refreshing || loading} className="gap-2 rounded-xl">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin-unique-visitors')}
              className="rounded-2xl border border-border/40 bg-muted/20 p-4 cursor-pointer transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                <Users className="w-4 h-4 text-primary" />
                Unique Visitors
              </div>
              <div className="text-3xl font-black text-foreground">{stats.uniqueVisitors}</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin-total-visits')}
              className="rounded-2xl border border-border/40 bg-muted/20 p-4 cursor-pointer transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                <Activity className="w-4 h-4 text-warning" />
                Total Visits
              </div>
              <div className="text-3xl font-black text-foreground">{stats.totalVisits}</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin-premium-users')}
              className="rounded-2xl border border-border/40 bg-muted/20 p-4 cursor-pointer transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                <Crown className="w-4 h-4 text-success" />
                Premium Users
              </div>
              <div className="text-3xl font-black text-foreground">{stats.premiumUsers}</div>
            </motion.div>
          </div>

          <div className="rounded-2xl border border-border/40 p-4 bg-background/80 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Analytics Trend (7 Days)</p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div>
                  <span className="text-muted-foreground">Unique Visitors</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#f97316]"></div>
                  <span className="text-muted-foreground">Total Visits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                  <span className="text-muted-foreground">Premium Users</span>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="h-60 flex items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uniqueVisitorsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="totalVisitsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="premiumUsersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => value}
                  />
                  <Area type="monotone" dataKey="uniqueVisitors" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#uniqueVisitorsFill)" />
                  <Area type="monotone" dataKey="totalVisits" stroke="#f97316" strokeWidth={2.5} fill="url(#totalVisitsFill)" />
                  <Area type="monotone" dataKey="premiumUsers" stroke="#10b981" strokeWidth={2.5} fill="url(#premiumUsersFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;