import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import signupPanelImg from '@/assets/signup-panel.png';

const PasswordStrength = ({ value }: { value: string }) => {
  const rules = [
    value.length >= 6,
    /[A-Z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];
  const score = rules.filter(Boolean).length;
  const label = ['Weak', 'Fair', 'Good', 'Strong'][Math.max(0, score - 1)] ?? 'Weak';
  const barClass = score <= 1 ? 'bg-destructive' : score === 2 ? 'bg-amber-500' : score === 3 ? 'bg-primary' : 'bg-emerald-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span>Password strength</span>
        <span className={score <= 1 ? 'text-destructive' : score === 2 ? 'text-amber-500' : score === 3 ? 'text-primary' : 'text-emerald-500'}>
          {label}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${Math.max(25, score * 25)}%` }} />
      </div>
    </div>
  );
};

const PhotoPanelRight = () => (
  <div className="absolute inset-0 w-full h-full">
    <img
      src={signupPanelImg}
      alt="DeepGuard Protection"
      className="w-full h-full object-cover object-center"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
    <div className="absolute bottom-0 left-0 right-0 p-10 space-y-5">
     <div className="flex items-center gap-3">
  <div className="h-px w-10 bg-violet-400 opacity-80" />
  <p className="text-violet-300 text-[11px] font-bold tracking-[0.25em] uppercase">
    Protect · Verify · Reclaim
  </p>
</div>
<div className="space-y-1">
  <p className="text-white font-bold leading-none" style={{ fontSize: '72px', letterSpacing: '-2px', textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}>
    2M+
  </p>
  <p className="text-white/70 text-xs font-semibold tracking-[0.22em] uppercase">
    Reputations Secured
  </p>
</div>
      <p className="text-white/25 text-[11px]">© {new Date().getFullYear()} DeepGuard Inc.</p>
    </div>
  </div>
);

/* ── Signup page ─────────────────────────────────────────────────── */
const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success('Account created! 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Form panel — LEFT ── */}
      <div className="flex-1 flex items-center justify-center gradient-soft px-6 py-16 order-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-base font-bold text-foreground">DeepGuard</span>
          </Link>

          {/* Heading */}
          <div className="mb-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Get started</p>
            <h1 className="font-heading text-4xl font-bold text-foreground leading-tight">
              Create your<br />free account
            </h1>
            <p className="text-muted-foreground mt-3 text-sm">
              Already have one?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Full name
              </label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-border/60 bg-background focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              />
            </div>

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
                  placeholder="Min 6 characters"
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
              {password.length > 0 && <PasswordStrength value={password} />}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Confirm password
              </label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-12 rounded-xl border-border/60 bg-background focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              />
              {confirm.length > 0 && password !== confirm && (
                <p className="text-[11px] text-destructive font-medium">Passwords don't match</p>
              )}
              {confirm.length > 0 && password === confirm && confirm.length >= 6 && (
                <p className="text-[11px] text-primary font-medium">Looks good ✓</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity mt-2"
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] text-muted-foreground/50">
            By signing up you agree to our{' '}
            <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Terms</span>
            {' & '}
            <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
          </p>
        </motion.div>
      </div>

      {/* ── Art panel — RIGHT ── */}
      <div className="hidden lg:block relative w-[45%] overflow-hidden flex-shrink-0 order-2">
        <PhotoPanelRight />
        {/* Logo overlay */}
        <div className="absolute top-10 right-10 z-10 flex items-center gap-3">
          <span className="font-heading text-lg font-bold text-white tracking-tight">DeepGuard</span>
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;