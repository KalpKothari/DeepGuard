import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue, type Variants } from 'framer-motion';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { 
  Shield, Upload, Zap, Lock, ArrowRight, CheckCircle, 
  BarChart3, Globe, ShieldCheck, Cpu, HelpCircle, AlertTriangle,
  Activity, Video, Image as ImageIcon, TrendingUp, Heart, QrCode, Smartphone, IndianRupee, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { buildSupportUpiLink, recordSupportIntent, SUPPORT_PAYEE_NAME, SUPPORT_UPI_ID } from '@/lib/support';
import { SUPPORT_SECTION_ID, scrollToSupportSection } from '@/lib/supportNavigation';

/* ─── DATA ─────────────────────────────────────────────────────────────── */
const features = [
  { icon: Upload, title: 'Easy Upload', desc: 'Drag & drop images, videos, or audio files', color: 'bg-primary/10 text-primary', accent: '#a855f7' },
  { icon: Zap, title: 'Instant Results', desc: 'Get real-time analysis with confidence scores', color: 'bg-warning/10 text-warning', accent: '#eab308' },
  { icon: Lock, title: 'Fully Private', desc: 'All processing happens locally on your device', color: 'bg-success/10 text-success', accent: '#22c55e' },
  { icon: CheckCircle, title: 'AI Powered', desc: 'Advanced deep learning detection models', color: 'bg-pink-500/10 text-pink-500', accent: '#ec4899' },
];

const stats = [
  { label: 'Accuracy Rate', value: '99.2%', icon: ShieldCheck },
  { label: 'Files Analyzed', value: '2M+', icon: BarChart3 },
  { label: 'Latency', value: '3s > ', icon: Globe },
];

const liveThreats = [
  { icon: Video, name: 'news_broadcast_final.mp4', status: 'Deepfake', conf: '98%', time: '1s ago' },
  { icon: ImageIcon, name: 'passport_scan_front.jpg', status: 'Authentic', conf: '99%', time: '3s ago' },
  { icon: ImageIcon, name: 'profile_pic_update.png', status: 'Authentic', conf: '97%', time: '15s ago' },
  { icon: Video, name: 'security_cam_04.mp4', status: 'Deepfake', conf: '88%', time: '22s ago' },
  { icon: ImageIcon, name: 'evidence_photo_b.jpg', status: 'Authentic', conf: '96%', time: '28s ago' },
  { icon: Video, name: 'interview_clip_raw.mp4', status: 'Authentic', conf: '95%', time: '35s ago' },
  { icon: ImageIcon, name: 'id_card_scan.png', status: 'Deepfake', conf: '91%', time: '42s ago' },
  { icon: Video, name: 'conference_call_recording.mp4', status: 'Deepfake', conf: '93%', time: '50s ago' },
  { icon: ImageIcon, name: 'selfie_upload.jpg', status: 'Authentic', conf: '98%', time: '1m ago' },
  { icon: Video, name: 'celebrity_interview.mp4', status: 'Deepfake', conf: '97%', time: '1m ago' },
  { icon: ImageIcon, name: 'document_verification.png', status: 'Authentic', conf: '94%', time: '1m ago' },
  { icon: Video, name: 'zoom_meeting_clip.mp4', status: 'Authentic', conf: '96%', time: '2m ago' },
  { icon: ImageIcon, name: 'social_media_dp.jpg', status: 'Deepfake', conf: '89%', time: '2m ago' },
  { icon: Video, name: 'political_speech_edit.mp4', status: 'Deepfake', conf: '99%', time: '2m ago' },
  { icon: ImageIcon, name: 'family_photo_old.jpg', status: 'Authentic', conf: '97%', time: '3m ago' },
];

const supportAmounts = [49, 99, 199];

/* ─── ANIMATED STAT ─────────────────────────────────────────────────────── */
const AnimatedStat = ({ value }: { value: string }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [hasAnimated, setHasAnimated] = useState(false);
  const numMatch = value.match(/[\d.]+/);
  const suffix = value.replace(/[\d.]+/, '');
  const target = numMatch ? parseFloat(numMatch[0]) : 0;
  const isFloat = value.includes('.');

  const handleViewportEnter = () => {
    if (hasAnimated) return;
    setHasAnimated(true);
    const duration = 2000;
    const startTime = performance.now();
    const update = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      const v = target * ease;
      setDisplayValue(isFloat ? v.toFixed(1) : Math.round(v).toString());
      if (p < 1) requestAnimationFrame(update);
      else setDisplayValue(isFloat ? target.toFixed(1) : target.toString());
    };
    requestAnimationFrame(update);
  };

  return <motion.span onViewportEnter={handleViewportEnter}>{displayValue}{suffix}</motion.span>;
};

/* ─── PARTICLE FIELD ─────────────────────────────────────────────────────── */
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,85,247,${p.alpha})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168,85,247,${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

/* ─── MAGNETIC BUTTON ────────────────────────────────────────────────────── */
const MagneticButton = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };
  const reset = () => { x.set(0); y.set(0); };
  return (
    <motion.div ref={ref} style={{ x: sx, y: sy }} onMouseMove={handleMouseMove} onMouseLeave={reset} className={className}>
      {children}
    </motion.div>
  );
};

/* ─── GLITCH TEXT ─────────────────────────────────────────────────────────── */
const GlitchText = ({ text, className }: { text: string; className?: string }) => {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className={`relative inline-block ${className}`}>
      {text}
      {glitch && (
        <>
          <span className="absolute inset-0 text-primary/60" style={{ clipPath: 'inset(20% 0 60% 0)', transform: 'translate(-3px, 2px)' }}>{text}</span>
          <span className="absolute inset-0 text-pink-400/60" style={{ clipPath: 'inset(60% 0 10% 0)', transform: 'translate(3px, -2px)' }}>{text}</span>
        </>
      )}
    </span>
  );
};

/* ─── 3D TILT CARD ───────────────────────────────────────────────────────── */
const TiltCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sRotX = useSpring(rotX, { stiffness: 200, damping: 20 });
  const sRotY = useSpring(rotY, { stiffness: 200, damping: 20 });
  const handleMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rotX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 12);
    rotY.set(((e.clientX - rect.left) / rect.width - 0.5) * 12);
  };
  const reset = () => { rotX.set(0); rotY.set(0); };
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX: sRotX, rotateY: sRotY, transformStyle: 'preserve-3d', perspective: '800px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── SCROLL REVEAL ──────────────────────────────────────────────────────── */
const ScrollReveal = ({
  children,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'scale';
}) => {
  const variants: Record<'up' | 'left' | 'right' | 'scale', Variants> = {
    up: { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } },
  };
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      variants={variants[direction]}
    >
      {children}
    </motion.div>
  );
};

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
const Landing = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedSupportAmount, setSelectedSupportAmount] = useState(99);
  const [customSupportAmount, setCustomSupportAmount] = useState('');
  const [showSupportQr, setShowSupportQr] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const supportSectionRef = useRef<HTMLDivElement>(null);

  // Scroll-driven hero parallax
  const heroScale = useTransform(scrollYProgress, [0, 0.18], [1, 0.9]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Mouse parallax for hero orbs
  useEffect(() => {
    const move = (e: MouseEvent) =>
      setMousePos({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as typeof window & { opera?: string }).opera || '';
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const mobileUa = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobileDevice(Boolean(mobileUa || coarsePointer));
    };

    detectMobile();
    window.addEventListener('resize', detectMobile);
    return () => window.removeEventListener('resize', detectMobile);
  }, []);

  useEffect(() => {
    const locationState = location.state as { scrollToSupportSection?: boolean } | null;
    if (!locationState?.scrollToSupportSection) return;

    const rafId = window.requestAnimationFrame(() => {
      scrollToSupportSection();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [location.key, location.state]);

  const parsedCustomAmount = Number(customSupportAmount);
  const supportAmount = customSupportAmount.trim() && Number.isFinite(parsedCustomAmount) && parsedCustomAmount > 0
    ? parsedCustomAmount
    : selectedSupportAmount;
  const isSupportAmountValid = Number.isFinite(supportAmount) && supportAmount >= 10;
  const supportAmountLabel = Number.isInteger(supportAmount) ? supportAmount.toFixed(0) : supportAmount.toFixed(2);
  const supportPaymentLink = isSupportAmountValid ? buildSupportUpiLink(supportAmount) : '';

  // Reset QR if amount becomes invalid
  useEffect(() => {
    if (!isSupportAmountValid && showSupportQr) {
      setShowSupportQr(false);
    }
  }, [isSupportAmountValid, showSupportQr]);

  const handleSupportPayment = () => {
    if (!isSupportAmountValid) return;

    const platform: 'mobile' | 'desktop' = isMobileDevice ? 'mobile' : 'desktop';

    void recordSupportIntent({
      amount: supportAmount,
      paymentLink: supportPaymentLink,
      platform,
      source: 'landing-support-section',
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            subscription: user.subscription,
          }
        : null,
    });

    if (platform === 'mobile') {
      window.location.href = supportPaymentLink;
      return;
    }

    supportSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setShowSupportQr(true);
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 overflow-x-hidden">

      {/* ── Scroll progress bar ── */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] z-[100] origin-left"
        style={{
          width: progressWidth,
          background: 'linear-gradient(90deg, #a855f7, #ec4899, #6366f1)',
        }}
      />

      {/* ── NAV ── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="fixed top-0 w-full z-50 glass border-b border-border/40 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
            <motion.div
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Shield className="w-4 h-4 text-primary-foreground" />
            </motion.div>
            <span className="font-heading text-lg font-bold text-foreground">DeepGuard</span>
          </motion.div>
          <div className="flex gap-2 items-center">
            {user ? (
              <Link to="/dashboard">
                <Button className="rounded-xl gradient-primary text-primary-foreground font-semibold shadow-md hover:shadow-primary/25 transition-all">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" className="rounded-xl font-medium hover:bg-primary/5">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <MagneticButton>
                    <Button className="rounded-xl gradient-primary text-primary-foreground font-semibold shadow-md hover:shadow-primary/25 transition-all">
                      Get Started
                    </Button>
                  </MagneticButton>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => scrollToSupportSection()}
                  className="rounded-xl font-medium hover:bg-primary/5 text-primary flex items-center gap-2"
                >
                  Support 💜
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <motion.section
        style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
        className="relative pt-28 pb-16 md:pt-40 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[100vh]"
      >
        <ParticleField />

        {/* Mouse-parallax orbs */}
        <motion.div
          style={{ x: mousePos.x * -60, y: mousePos.y * -40 }}
          className="absolute top-1/4 left-[12%] w-64 h-64 md:w-96 md:h-96 bg-primary/25 rounded-full blur-[120px] pointer-events-none"
        />
        <motion.div
          style={{ x: mousePos.x * 50, y: mousePos.y * 60 }}
          className="absolute bottom-1/4 right-[12%] w-56 h-56 md:w-80 md:h-80 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"
        />
        <motion.div
          style={{ x: mousePos.x * -30, y: mousePos.y * 30 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none"
        />

        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative max-w-6xl mx-auto px-4 text-center z-10 w-full">
          {/* Spinning border badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, type: 'spring', bounce: 0.5 }}
            className="mb-6 inline-block"
          >
            <div className="relative inline-flex overflow-hidden rounded-full p-[1px]">
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-60" />
              <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-background px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-3xl gap-2 border border-border/50 shadow-sm">
                <Shield className="w-3.5 h-3.5" /> AI-Powered Protection
              </span>
            </div>
          </motion.div>

          {/* Staggered headline */}
          <div className="overflow-hidden mb-2">
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-heading text-5xl sm:text-7xl md:text-8xl font-black text-foreground leading-none tracking-tight">
                Detect{' '}
                <GlitchText
                  text="Deepfakes"
                  className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-500"
                />
              </h1>
            </motion.div>
          </div>
          <div className="overflow-hidden mb-10">
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-heading text-5xl sm:text-7xl md:text-8xl font-black leading-none tracking-tight">
                <span className="text-foreground">in </span>
                <motion.span
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="bg-clip-text text-transparent inline-block"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #a855f7, #6366f1)',
                    backgroundSize: '200% auto',
                  }}
                >
                  Seconds
                </motion.span>
              </h1>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10"
          >
            Upload any image, video, or audio file and our AI will analyze it for manipulation. Fast, accurate, and completely private.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to={user ? '/detect' : '/signup'} className="w-full sm:w-auto">
              <MagneticButton className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="w-full sm:w-auto rounded-xl gradient-primary text-primary-foreground font-semibold h-14 px-10 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all text-base">
                    Start Detecting <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </MagneticButton>
            </Link>
            <MagneticButton className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto rounded-xl font-semibold h-14 px-10 border-2 hover:bg-muted/50 transition-all text-base"
                >
                  See How It Works
                </Button>
              </motion.div>
            </MagneticButton>
          </motion.div>

          {/* Mobile floating cards */}
          <div className="flex justify-center gap-4 mt-10 lg:hidden flex-wrap">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="flex glass border border-border/50 p-3 rounded-xl shadow-xl items-center gap-3"
            >
              <motion.div
                className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center shrink-0"
                animate={{ boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 14px rgba(34,197,94,0.4)', '0 0 0px rgba(34,197,94,0)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle className="w-4 h-4 text-success" />
              </motion.div>
              <div className="text-left">
                <p className="text-xs font-bold text-foreground">Media Verified</p>
                <p className="text-[10px] text-success font-mono font-bold">99% Authentic</p>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="flex glass border border-destructive/20 p-3 rounded-xl shadow-xl items-center gap-3 bg-destructive/5"
            >
              <motion.div
                className="w-9 h-9 rounded-full bg-destructive/20 flex items-center justify-center shrink-0"
                animate={{ boxShadow: ['0 0 0px rgba(239,68,68,0)', '0 0 14px rgba(239,68,68,0.4)', '0 0 0px rgba(239,68,68,0)'] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </motion.div>
              <div className="text-left">
                <p className="text-xs font-bold text-foreground">Deepfake Detected</p>
                <p className="text-[10px] text-destructive font-mono font-bold">Facial Morphing</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Desktop floating cards */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden lg:flex absolute top-44 left-[8%] glass border border-border/50 p-4 rounded-2xl shadow-2xl items-center gap-3 w-56 backdrop-blur-xl"
          style={{ boxShadow: '0 0 40px rgba(168,85,247,0.12)' }}
        >
          <motion.div
            className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center shrink-0"
            animate={{ boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 20px rgba(34,197,94,0.4)', '0 0 0px rgba(34,197,94,0)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle className="w-5 h-5 text-success" />
          </motion.div>
          <div>
            <p className="text-xs font-bold text-foreground">Media Verified</p>
            <p className="text-[10px] text-success font-mono font-bold">99% Authentic</p>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="hidden lg:flex absolute bottom-44 right-[8%] glass border border-destructive/20 p-4 rounded-2xl shadow-2xl items-center gap-3 w-60 bg-destructive/5 backdrop-blur-xl"
          style={{ boxShadow: '0 0 40px rgba(239,68,68,0.12)' }}
        >
          <motion.div
            className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0"
            animate={{ boxShadow: ['0 0 0px rgba(239,68,68,0)', '0 0 20px rgba(239,68,68,0.4)', '0 0 0px rgba(239,68,68,0)'] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </motion.div>
          <div>
            <p className="text-xs font-bold text-foreground">Deepfake Detected</p>
            <p className="text-[10px] text-destructive font-mono font-bold">Facial Morphing</p>
          </div>
        </motion.div>
      </motion.section>

      {/* ── STATS ── */}
      <section className="relative z-20 max-w-5xl mx-auto px-4 -mt-4 md:-mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.15} direction="scale">
              <TiltCard className="glass rounded-2xl p-6 flex flex-col items-center text-center shadow-lg border border-border/50 cursor-default group">
                <motion.div
                  className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3"
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon className="w-5 h-5 text-primary" />
                </motion.div>
                <div className="text-4xl font-black text-foreground">
                  <AnimatedStat value={stat.value} />
                </div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
                <motion.div
                  className="w-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 mt-3 rounded-full"
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.2 + 0.4 }}
                />
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── LIVE TICKER ── */}
      <section className="mt-10 md:mt-16 overflow-hidden bg-secondary/30 border-y border-border/40 py-4 backdrop-blur-sm relative">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex items-center gap-4 px-4 w-fit">
          <div className="flex items-center gap-2 mr-4 shrink-0 px-4 border-r border-border/50">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Activity className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Live Scan Feed</span>
          </div>
          <motion.div
            animate={{ x: [0, -1035] }}
            transition={{ ease: 'linear', duration: 25, repeat: Infinity }}
            className="flex gap-4 items-center whitespace-nowrap"
          >
            {[...liveThreats, ...liveThreats].map((threat, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-background/50 border border-border/50 rounded-full px-4 py-1.5 shrink-0">
                <threat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground truncate w-32">{threat.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${threat.status === 'Authentic' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {threat.status} {threat.conf}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">{threat.time}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-12 md:py-24">
        <ScrollReveal direction="up">
          <div className="text-center mb-10 md:mb-16">
            <motion.h2
              className="font-heading text-sm font-bold text-primary uppercase tracking-widest mb-2"
              animate={{ letterSpacing: ['0.1em', '0.25em', '0.1em'] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              Capabilities
            </motion.h2>
            <h3 className="font-heading text-3xl md:text-5xl font-black text-foreground tracking-tight">
              Built for ultimate security
            </h3>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.12} direction="up">
              <TiltCard className="glass rounded-3xl p-8 border border-border/50 hover:border-primary/50 transition-all duration-300 group cursor-default h-full">
                <motion.div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${f.color}`}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  transition={{ type: 'spring', bounce: 0.6 }}
                >
                  <f.icon className="w-7 h-7" />
                </motion.div>
                <h3 className="font-heading font-bold text-foreground mb-3 text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <motion.div
                  className="mt-4 h-0.5 rounded-full origin-left"
                  style={{ background: f.accent }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.15 + 0.3 }}
                />
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── NEURAL ANALYSIS ── */}
      <section className="max-w-5xl mx-auto px-4 py-6 md:py-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <ScrollReveal direction="scale">
          <TiltCard className="glass rounded-3xl overflow-hidden border border-border/50 shadow-2xl relative z-10">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 space-y-6 flex flex-col justify-center">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner"
                  animate={{ boxShadow: ['0 0 0px rgba(168,85,247,0)', '0 0 30px rgba(168,85,247,0.3)', '0 0 0px rgba(168,85,247,0)'] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <Cpu className="w-6 h-6 text-primary" />
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight">Advanced Neural Analysis</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our engine looks beyond what the human eye can see. By analyzing pixel-level inconsistencies and frequency patterns, we identify synthetic artifacts with high precision.
                  </p>
                </div>
                <ul className="space-y-3 bg-muted/30 p-5 rounded-xl border border-border/50">
                  {['Frame-by-frame verification', 'Metadata integrity check', 'Biometric consistency analysis'].map((item, i) => (
                    <motion.li
                      key={item}
                      className="flex items-center gap-2 text-sm font-medium text-foreground"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 + 0.3 }}
                    >
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" /> {item}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900 flex items-center justify-center p-8 border-t md:border-t-0 md:border-l border-slate-800 relative overflow-hidden min-h-[300px]">
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:12px_12px]" />

                <div className="w-full aspect-square max-w-[280px] rounded-xl bg-slate-950/80 flex flex-col items-center justify-center text-slate-500 overflow-hidden shadow-2xl border border-slate-800 relative backdrop-blur-xl">
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 w-full h-1 bg-primary z-20"
                    style={{ boxShadow: '0 0 20px 4px rgba(168,85,247,0.6)' }}
                  >
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-t from-primary/20 to-transparent -translate-y-full" />
                  </motion.div>

                  <div className="w-full h-8 bg-slate-900 border-b border-slate-800 flex items-center px-3 gap-1.5 z-10 relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center p-8 w-full relative z-10">
                    <motion.div
                      className="w-full h-4 bg-slate-800 rounded-full mb-4"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="w-2/3 h-4 bg-slate-800 rounded-full mb-8"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center">
                      <motion.div
                        className="absolute inset-0 rounded-full border border-primary/20"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border border-primary/10"
                        animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                      />
                      <Shield className="w-12 h-12 text-primary opacity-80" />
                    </div>
                  </div>
                </div>

                <motion.div
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute top-[20%] right-4 bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-full text-xs font-bold tracking-widest whitespace-nowrap backdrop-blur-md"
                  style={{ boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}
                >
                  ● SCANNING...
                </motion.div>
              </div>
            </div>
          </TiltCard>
        </ScrollReveal>
      </section>

      {/* ── THREAT LANDSCAPE ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-24">
        <ScrollReveal direction="up">
          <div className="flex flex-col items-center text-center mb-10 md:mb-16">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-bold mb-4"
              animate={{ boxShadow: ['0 0 0px rgba(239,68,68,0)', '0 0 20px rgba(239,68,68,0.25)', '0 0 0px rgba(239,68,68,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <TrendingUp className="w-4 h-4" /> The Deepfake Epidemic
            </motion.div>
            <h2 className="font-heading text-3xl md:text-5xl font-black text-foreground tracking-tight">
              Can You Still Trust What You See?
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
              Generative AI has democratized deception. The barrier to entry for creating hyper-realistic synthetic media is now near zero.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { val: '2,000%+', label: 'Rise in Deepfake Fraud', desc: 'Deepfake-related scams have grown rapidly in recent years, making them one of the fastest-growing cyber threats.', border: 'border-destructive/20', bg: 'bg-destructive/5', color: 'text-destructive', glow: 'rgba(239,68,68,0.18)' },
            { val: '$1T+', label: 'Global Scam Losses', desc: 'AI-driven fraud, including deepfakes, contributes to massive global financial losses every year.', border: 'border-warning/20', bg: 'bg-warning/5', color: 'text-warning', glow: 'rgba(234,179,8,0.18)' },
            { val: '8M+', label: 'Deepfakes Online', desc: 'Millions of deepfake videos are circulating online, increasing misinformation and making verification difficult.', border: 'border-primary/20', bg: 'bg-primary/5', color: 'text-primary', glow: 'rgba(168,85,247,0.18)' },
          ].map((item, i) => (
            <ScrollReveal key={item.val} delay={i * 0.15} direction="up">
              <TiltCard className={`glass rounded-3xl p-8 border ${item.border} ${item.bg} relative overflow-hidden cursor-default h-full`}>
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  animate={{ boxShadow: [`inset 0 0 0px ${item.glow}`, `inset 0 0 40px ${item.glow}`, `inset 0 0 0px ${item.glow}`] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                />
                <motion.h3
                  className={`text-5xl font-black ${item.color} mb-2`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', bounce: 0.5, delay: i * 0.15 }}
                >
                  {item.val}
                </motion.h3>
                <p className="text-sm font-bold text-foreground mb-2">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-24">
        <ScrollReveal direction="up">
          <div className="flex items-center gap-3 mb-8 md:mb-10 justify-center">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <HelpCircle className="w-6 h-6 text-primary" />
            </motion.div>
            <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
          </div>
        </ScrollReveal>
        <Accordion type="single" collapsible className="w-full">
          {[
            { val: 'item-1', q: 'How accurate is the detection?', a: 'DeepGuard currently achieves a 99.2% accuracy rate on industry-standard datasets. However, we always recommend reviewing the detailed confidence scores provided for each scan.' },
            { val: 'item-2', q: 'Is my data secure and private?', a: 'Absolutely. We utilize client-side processing where possible, and any cloud-based analysis is encrypted end-to-end. Your uploaded files are never stored or used to train public AI models.' },
            { val: 'item-3', q: 'What file formats are supported?', a: 'We support all major formats including MP4, AVI, MOV for video analysis; JPG, PNG, WEBP for images; and MP3, WAV for auditory detection.' },
          ].map((item, i) => (
            <ScrollReveal key={item.val} delay={i * 0.1} direction="left">
              <AccordionItem value={item.val} className={`border-border/50 ${item.val === 'item-3' ? 'border-b-0' : ''}`}>
                <AccordionTrigger className="hover:no-underline font-semibold group">
                  <span className="group-hover:text-primary transition-colors">{item.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            </ScrollReveal>
          ))}
        </Accordion>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
        <ScrollReveal direction="scale">
          <div className="relative gradient-primary rounded-[2.5rem] p-10 md:p-16 text-center text-primary-foreground overflow-hidden shadow-2xl">
            {/* Animated rings */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-[2.5rem] border border-white/10 pointer-events-none"
                animate={{ scale: [1, 1.04 + i * 0.04, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
              />
            ))}

            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            {/* Floating particles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-white/25 pointer-events-none"
                style={{ left: `${8 + i * 12}%`, top: `${15 + (i % 3) * 35}%` }}
                animate={{ y: [-12, 12, -12], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}

            <div className="relative z-10 space-y-6">
              <motion.h2
                className="text-3xl md:text-5xl font-black tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                Ready to secure your digital content?
              </motion.h2>
              <motion.p
                className="max-w-2xl mx-auto opacity-90 text-lg font-medium"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 }}
              >
                Join thousands of users protecting themselves from digital misinformation. Start your first scan in less than 30 seconds.
              </motion.p>
              <motion.div
                className="pt-4 flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3, type: 'spring', bounce: 0.4 }}
              >
                <Link to="/signup">
                  <MagneticButton>
                    <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" variant="secondary" className="rounded-full font-bold h-14 px-10 shadow-xl text-primary text-base">
                        Get Started for Free
                      </Button>
                    </motion.div>
                  </MagneticButton>
                </Link>
              </motion.div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── SUPPORT THE PROJECT ── */}
      <section id={SUPPORT_SECTION_ID} className="max-w-6xl mx-auto px-4 pb-16 md:pb-24 scroll-mt-24 md:scroll-mt-28">
        <ScrollReveal direction="up">
          <div
            ref={supportSectionRef}
            className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-background via-background to-primary/5 p-6 md:p-10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.10),transparent_30%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  <Heart className="h-3.5 w-3.5 fill-current" />
                  Support the Project
                </div>

                <div className="space-y-3 max-w-2xl">
                  
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    If you found this tool helpful or interesting, consider supporting its development.
                  </p>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    Your contribution helps improve the experience and keep it accessible for everyone.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {supportAmounts.map((amount) => {
                    const isActive = selectedSupportAmount === amount && !customSupportAmount.trim();
                    return (
                      <motion.button
                        key={amount}
                        type="button"
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedSupportAmount(amount);
                          setCustomSupportAmount('');
                        }}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          isActive
                            ? 'border-primary/40 bg-primary/10 text-primary shadow-[0_10px_30px_-16px_rgba(168,85,247,0.55)]'
                            : 'border-border/60 bg-background/80 text-foreground hover:border-primary/30 hover:bg-muted/40'
                        }`}
                      >
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Preset</div>
                        <div className="mt-1 flex items-center gap-1.5 text-lg font-black">
                          <IndianRupee className="h-4 w-4" />
                          {amount}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Custom amount
                    </label>
                    <Input
                      type="number"
                      min="10"
                      step="1"
                      inputMode="numeric"
                      value={customSupportAmount}
                      onChange={(e) => setCustomSupportAmount(e.target.value)}
                      onFocus={() => setSelectedSupportAmount(99)}
                      placeholder="Enter a custom amount"
                      className="h-12 rounded-2xl border-border/60 bg-background/90 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      onClick={handleSupportPayment}
                      disabled={!isSupportAmountValid}
                      className="h-12 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 px-6 font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/35"
                    >
                      Pay via UPI
                      <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span>UPI ID: <span className="font-semibold text-foreground">{SUPPORT_UPI_ID}</span></span>
                  </div>
                  <div className="font-medium text-foreground/90">Payee: {SUPPORT_PAYEE_NAME}</div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  This is a voluntary contribution. Payments are made directly via UPI and are not automatically verified.
                </p>
              </div>

              {!isMobileDevice && showSupportQr && isSupportAmountValid && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="relative"
                >
                  <div className="rounded-[1.75rem] border border-border/60 bg-background/90 p-4 shadow-2xl mx-auto max-w-[280px] lg:max-w-[300px]">
                    <div className="mb-4 text-center">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Scan this QR with any UPI app to complete payment</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">Amount: ₹{supportAmountLabel}</p>
                    </div>

                    <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-secondary/30 p-3">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-center"
                      >
                        <div className="rounded-[1.25rem] bg-white p-2 shadow-lg">
                          <QRCode
                            value={supportPaymentLink}
                            size={200}
                            level="H"
                            includeMargin
                          />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {!isMobileDevice && !showSupportQr && !isSupportAmountValid && (
              <div className="relative mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-6 text-center text-sm text-destructive">
                Minimum amount is ₹10
              </div>
            )}

            {!isMobileDevice && !showSupportQr && isSupportAmountValid && (
              <div className="relative mt-8 rounded-2xl border border-dashed border-border/60 bg-background/60 px-5 py-6 text-center text-sm text-muted-foreground">
                Desktop mode is ready. Click <span className="font-semibold text-foreground">Pay via UPI</span> to reveal the QR.
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-10 md:py-12 bg-secondary/20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">DeepGuard</span>
          </motion.div>
          <p className="font-medium">© 2026 DeepGuard. Built with ❤️ for a safer internet.</p>
          <div className="flex gap-6 font-medium">
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <motion.a key={link} href="#" className="hover:text-primary transition-colors" whileHover={{ y: -2 }}>
                {link}
              </motion.a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;