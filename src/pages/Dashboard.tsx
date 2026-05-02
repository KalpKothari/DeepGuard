import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { useAuth } from '@/contexts/AuthContext';
import { getScanHistory, ScanResult } from '@/lib/detection';
import { motion } from 'framer-motion';
import { 
  Upload, Shield, AlertTriangle, CheckCircle, ArrowRight, 
  Activity, Zap, Info, ShieldCheck, Clock, FileText, Download,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// ─── Premium Scan Analytics Chart ──────────────────────────────────────────
const COLORS = {
  fake: '#ef4444',
  real: '#22c55e',
  total: '#8b5cf6',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl p-3 border border-border/60 shadow-xl text-xs space-y-1">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface ScanAnalyticsProps {
  scans: ScanResult[];
  fakeCount: number;
  realCount: number;
}

const ScanAnalyticsChart = ({ scans, fakeCount, realCount }: ScanAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'breakdown'>('trend');

  // Build last-7-days trend data
  const trendData = (() => {
    const days: { label: string; date: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        date: d,
      });
    }
    return days.map(({ label, date }) => {
      const dayScans = scans.filter((s) => {
        const sd = new Date(s.createdAt);
        return (
          sd.getDate() === date.getDate() &&
          sd.getMonth() === date.getMonth() &&
          sd.getFullYear() === date.getFullYear()
        );
      });
      return {
        name: label.split(',')[0], // "Mon"
        Total: dayScans.length,
        Fake: dayScans.filter((s) => s.result === 'fake').length,
        Real: dayScans.filter((s) => s.result === 'real').length,
      };
    });
  })();

  // Pie breakdown data
  const pieData = [
    { name: 'Fake', value: fakeCount },
    { name: 'Real', value: realCount },
  ].filter((d) => d.value > 0);

  const total = scans.length;
  const fakeRate = total > 0 ? Math.round((fakeCount / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass rounded-2xl border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground text-sm leading-none">Scan Analytics</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">Smart Insights</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 text-xs font-semibold w-fit">
          {(['trend', 'breakdown'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 px-6 pt-4 flex-wrap">
        {[
          { label: 'Total', value: total, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Fake', value: fakeCount, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Real', value: realCount, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Fake Rate', value: `${fakeRate}%`, color: 'text-warning', bg: 'bg-warning/10' },
        ].map((p) => (
          <div key={p.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${p.bg} text-xs font-bold`}>
            <span className={p.color}>{p.value}</span>
            <span className="text-muted-foreground font-medium">{p.label}</span>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="px-2 pb-5 pt-4">
        {activeTab === 'trend' ? (
          scans.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              No scan data yet — run your first scan!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  {(['Total', 'Fake', 'Real'] as const).map((key) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={key === 'Total' ? COLORS.total : key === 'Fake' ? COLORS.fake : COLORS.real}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={key === 'Total' ? COLORS.total : key === 'Fake' ? COLORS.fake : COLORS.real}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Total" stroke={COLORS.total} strokeWidth={2} fill={`url(#grad-Total)`} dot={false} />
                <Area type="monotone" dataKey="Real" stroke={COLORS.real} strokeWidth={2} fill={`url(#grad-Real)`} dot={false} />
                <Area type="monotone" dataKey="Fake" stroke={COLORS.fake} strokeWidth={2} fill={`url(#grad-Fake)`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )
        ) : (
          pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              No scan data yet — run your first scan!
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.name === 'Fake' ? COLORS.fake : COLORS.real}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="text-center shrink-0">
                <p className="text-3xl font-black text-foreground">{total}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Scans</p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                    <span className="text-muted-foreground">{fakeCount} Fake ({fakeRate}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-success inline-block" />
                    <span className="text-muted-foreground">{realCount} Real ({100 - fakeRate}%)</span>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Dashboard ─────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const scans = user ? getScanHistory(user.id) : [];
  const isPremium = (user as any)?.subscription === 'premium';

  const fakeCount = scans.filter(s => s.result === 'fake').length;
  const realCount = scans.filter(s => s.result === 'real').length;

  const stats = [
    { label: 'Total Scans', value: scans.length, icon: Shield, color: 'bg-primary/10 text-primary' },
    { label: 'Fake Detected', value: fakeCount, icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
    { label: 'Verified Real', value: realCount, icon: CheckCircle, color: 'bg-success/10 text-success' },
  ];

  const generatePDFBlob = (scan: ScanResult) => {
    const doc = new jsPDF();
    const isFake = scan.result === 'fake';
    doc.setFillColor(isFake ? 220 : 34, isFake ? 38 : 197, isFake ? 38 : 94);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("FORENSIC ANALYSIS REPORT", 105, 25, { align: 'center' });
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text(`File Name: ${scan.fileName}`, 20, 60);
    doc.text(`Scan Date: ${new Date(scan.createdAt).toLocaleString()}`, 20, 70);
    doc.text(`Verdict: ${scan.result.toUpperCase()}`, 20, 80);
    doc.text(`Confidence: ${scan.confidence}%`, 20, 90);
    const splitExplanation = doc.splitTextToSize(scan.explanation, 170);
    doc.text(splitExplanation, 20, 105);
    return doc.output('blob');
  };

  const handleBulkExport = async () => {
    if (scans.length === 0) { toast.error("No scans found in history to export."); return; }
    const zip = new JSZip();
    const folder = zip.folder("DeepGuard_Scans_Export");
    toast.loading("Zipping reports...");
    scans.forEach((scan) => {
      const blob = generatePDFBlob(scan);
      folder?.file(`Report_${scan.id.slice(0, 5)}_${scan.fileName}.pdf`, blob);
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `DeepGuard_Bulk_History_${new Date().getTime()}.zip`);
    toast.dismiss();
    toast.success("Bulk history downloaded! Check your downloads folder.");
  };

  const handleLatestReport = () => {
    if (scans.length === 0) return toast.error("No scans available.");
    const blob = generatePDFBlob(scans[0]);
    saveAs(blob, `Latest_Report_${scans[0].fileName}.pdf`);
    toast.success("Latest report downloaded.");
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
        
        {/* Welcome & Security Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Hey, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Your identity protection is active and monitoring.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> System Secured
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-5 border border-border/50">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Premium Analytics Chart (shown only for premium users) ── */}
        {isPremium && (
          <ScanAnalyticsChart scans={scans} fakeCount={fakeCount} realCount={realCount} />
        )}

        {/* Hybrid Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          
          {/* CTA / Upload Box */}
          <div className="order-1 lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-8 text-center gradient-soft border border-primary/10 relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <Upload className="w-12 h-12 mx-auto text-primary mb-4" />
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">New Deepfake Analysis</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Analyze visual or auditory media using our latest neural detection engine.</p>
              <Link to="/detect">
                <Button className="rounded-xl gradient-primary text-primary-foreground font-semibold px-8 h-12 shadow-lg shadow-primary/20 transition-transform hover:scale-105">
                  Start Detection <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Quick Tools */}
          <div className="order-2 lg:col-span-1 lg:col-start-3 lg:row-start-1">
            <div className="glass rounded-2xl p-6 border border-border/50">
              <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" /> Quick Tools
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleLatestReport}
                  className="justify-start gap-3 rounded-xl border-border/50 h-11 text-sm hover:bg-primary/5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-primary" /> Latest Report
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleBulkExport}
                  className="w-full justify-start gap-3 rounded-xl border-border/50 h-11 text-sm hover:bg-pink-500/5 hover:text-pink-500 transition-colors"
                >
                  <Download className="w-4 h-4 text-pink-500" /> Download Bulk ZIP
                </Button>

                <Link to="/history" className="w-full">
                  <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-border/50 h-11 text-sm hover:bg-success/5 transition-colors">
                    <Clock className="w-4 h-4 text-success" /> View History
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Scans */}
          <div className="order-3 lg:col-span-2 lg:col-start-1 lg:row-start-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-foreground">Recent Scans</h2>
                <Link to="/history" className="text-sm text-primary hover:underline font-medium">View all history</Link>
              </div>
              {scans.length > 0 ? (
                <div className="space-y-3">
                  {scans.slice(0, 4).map((scan) => (
                    <ScanCard key={scan.id} scan={scan} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-2xl">
                  <p className="text-muted-foreground">No scans detected yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Deepfake Fact */}
          <div className="order-4 lg:col-span-1 lg:col-start-3 lg:row-start-2">
            <div className="glass rounded-2xl p-6 border border-border/50 bg-primary/5">
              <div className="flex items-start gap-2 text-primary mb-3">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <h3 className="text-sm font-bold uppercase tracking-wider leading-tight">Not All Media Is Real</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Over <strong>90%</strong> of online deepfake content is non-consensual, and the number of deepfake videos is increasing every year making it harder to trust what you see.
              </p>
            </div>
          </div>

        </div>
      </motion.div>
    </AppLayout>
  );
};

const ScanCard = ({ scan }: { scan: ScanResult }) => (
  <motion.div 
    whileHover={{ x: 4 }}
    className="glass rounded-xl p-4 flex items-center justify-between border border-border/40 hover:border-primary/30 transition-all cursor-pointer"
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scan.result === 'fake' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
        {scan.result === 'fake' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
      </div>
      <div>
        <p className="font-medium text-foreground text-sm truncate max-w-48">{scan.fileName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {new Date(scan.createdAt).toLocaleDateString()}
          </p>
          <span className="w-1 h-1 rounded-full bg-border" />
          <p className="text-[10px] text-muted-foreground uppercase">Media</p>
        </div>
      </div>
    </div>
    <div className="text-right">
      <div className={`text-xs font-black px-2 py-0.5 rounded-md inline-block mb-1 ${scan.result === 'fake' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
        {scan.result === 'fake' ? 'FAKE' : 'REAL'}
      </div>
      <p className="text-sm font-mono font-bold text-foreground">{scan.confidence}%</p>
    </div>
  </motion.div>
);

export default Dashboard;