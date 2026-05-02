import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import loginPanelImg from '@/assets/login-panel.png';

const PhotoPanel = () => (
  <div className="absolute inset-0 w-full h-full">
    <img
      src={loginPanelImg}
      alt="DeepGuard AI Detection"
      className="w-full h-full object-cover object-center"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" />
    <div className="absolute bottom-0 left-0 right-0 p-10 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-px w-10 bg-violet-400 opacity-80" />
        <p className="text-violet-300 text-[11px] font-bold tracking-[0.25em] uppercase">Detect · Protect · Verify</p>
      </div>
      <div className="space-y-1">
        <p className="text-white font-bold leading-none" style={{ fontSize: '72px', letterSpacing: '-2px', textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}>
          99.2%
        </p>
        <p className="text-white/70 text-xs font-semibold tracking-[0.22em] uppercase">Detection Accuracy</p>
      </div>
      <p className="text-white/25 text-[11px]">© {new Date().getFullYear()} DeepGuard Inc.</p>
    </div>
  </div>
);

/* ── Login page ─────────────────────────────────────────────────── */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Art panel ── */}
      <div className="hidden lg:block relative w-[45%] overflow-hidden flex-shrink-0">
        <PhotoPanel />
        {/* Logo overlay */}
        <div className="absolute top-10 left-10 z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold text-white tracking-tight">DeepGuard</span>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center gradient-soft px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-base font-bold text-foreground">DeepGuard</span>
          </Link>

          {/* Heading block */}
          <div className="mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Welcome back</p>
            <h1 className="font-heading text-4xl font-bold text-foreground leading-tight">
              Sign in to<br />your account
            </h1>
            <p className="text-muted-foreground mt-3 text-sm">
              Don't have one?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline underline-offset-2">
                Create for free
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border/60 bg-background focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-border/60 bg-background pr-11 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </Button>
          </form>

        </motion.div>
      </div>
    </div>
  );
};

export default Login;