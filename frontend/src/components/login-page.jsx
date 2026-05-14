import { useState, useEffect, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ShieldCheck, Zap, Database,
  MousePointer2, Layers, Box, Tag, Download, Eye
} from 'lucide-react';
import { authAPI, setAuthSession } from '@/lib/auth';

const CARDS = [
  { src: '/cards/seg_person.png',  label: 'Person Detection',      badge: 'SAM 2',      color: '#60a5fa' },
  { src: '/cards/seg_car.png',     label: 'Vehicle Segmentation',  badge: 'DINO',       color: '#818cf8' },
  { src: '/cards/seg_dog.png',     label: 'SAM2 Point Click',      badge: 'SAM 2',      color: '#38bdf8' },
  { src: '/cards/seg_medical.png', label: 'Medical Imaging',       badge: 'Multi-class',color: '#a78bfa' },
  { src: '/cards/seg_street.png',  label: 'Autonomous Driving',    badge: 'YOLO Export',color: '#3b82f6' },
  { src: '/cards/seg_drone.png',   label: 'Aerial Segmentation',   badge: 'COCO Export',color: '#2563eb' },
];

// ── Single image card ───────────────────────────────────────────────────────
function AnnotationCard({ card }) {
  return (
    <div
      className="relative w-52 h-44 rounded-2xl overflow-hidden flex-shrink-0 group"
      style={{
        border: `1.5px solid ${card.color}40`,
        boxShadow: `0 4px 24px ${card.color}20`,
      }}
    >
      <img
        src={card.src}
        alt={card.label}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* badge */}
      <span
        className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
        style={{
          background: `${card.color}25`,
          border: `1px solid ${card.color}60`,
          color: card.color,
        }}
      >
        {card.badge}
      </span>

      {/* label */}
      <p className="absolute bottom-2 left-3 text-xs font-semibold text-white drop-shadow">
        {card.label}
      </p>

      {/* animated border glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1.5px ${card.color}` }}
      />
    </div>
  );
}

// ── Infinite vertical scrolling column ─────────────────────────────────────
function ScrollColumn({ cards, direction = 'up', speed = 30 }) {
  // Duplicate to create seamless loop
  const items = [...cards, ...cards, ...cards];
  const totalH = cards.length * (176 + 16); // card height + gap

  return (
    <div className="overflow-hidden h-full relative">
      <motion.div
        className="flex flex-col gap-4"
        animate={{ y: direction === 'up' ? [-totalH, 0] : [0, -totalH] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
      >
        {items.map((card, i) => (
          <AnnotationCard key={`${card.label}-${i}`} card={card} />
        ))}
      </motion.div>

      {/* Top & bottom fades */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
    </div>
  );
}

// ── Features ───────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Zap,           text: 'Zero-shot auto-labeling with SAM 2',       color: '#60a5fa' },
  { icon: MousePointer2, text: 'One-click point segmentation',              color: '#818cf8' },
  { icon: Download,      text: 'Export YOLO · COCO · Pascal VOC',           color: '#38bdf8' },
  { icon: Database,      text: 'MongoDB cloud dataset storage',             color: '#a78bfa' },
  { icon: Tag,           text: 'Text-prompt detection (GroundingDINO)',     color: '#3b82f6' },
  { icon: ShieldCheck,   text: 'Secure Google OAuth login',                 color: '#2563eb' },
];

// ── Main login page ─────────────────────────────────────────────────────────
export function LoginPage({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  // Split cards into 3 columns: [0,1], [2,3], [4,5]
  const col1 = CARDS.slice(0, 2);
  const col2 = CARDS.slice(2, 4);
  const col3 = CARDS.slice(4, 6);

  const handleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setError('');
      const result = await authAPI.verifyGoogleToken(credentialResponse.credential);
      if (result.success) {
        setAuthSession({ user: result.user, token: result.token });
        onLoginSuccess(result.user);
      }
    } catch (err) {
      const detailedError = err.response?.data?.details;
      setError(detailedError ? `Authentication failed: ${detailedError}` : 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden relative bg-background">

      {/* ── LEFT: scrolling image columns ─────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-sam-cyan/8 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-sam-purple/8 rounded-full blur-[100px] pointer-events-none" />

        {/* 3 columns */}
        <div className="flex gap-4 px-8 pt-0 h-full w-full">
          <div className="flex-1 h-full py-8">
            <ScrollColumn cards={col1} direction="up" speed={25} />
          </div>
          <div className="flex-1 h-full py-8">
            <ScrollColumn cards={col2} direction="down" speed={32} />
          </div>
          <div className="flex-1 h-full py-8">
            <ScrollColumn cards={col3} direction="up" speed={20} />
          </div>
        </div>
      </div>

      {/* ── RIGHT: hero / login panel ─────────────────────────────────── */}
      <div className="w-full lg:w-[520px] xl:w-[580px] flex-shrink-0 flex flex-col justify-center px-10 xl:px-16 py-12 relative z-20 bg-background/95 backdrop-blur-sm border-l border-border/50">

        {/* gradient orbs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-sam-cyan/10  rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sam-purple/10 rounded-full blur-[60px] pointer-events-none" />

        <AnimatePresence mode="wait">
          {!showLogin ? (
            /* ── Hero screen ──────────────────────────────────────────── */
            <motion.div
              key="hero"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-8 relative z-10 mb-50"
            >
              {/* Logo */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="brand-logo">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground text-xl tracking-tight">
                  Annotation<span className="gradient-text">Studio</span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl xl:text-5xl font-extrabold text-foreground leading-tight mb-4">
                  Annotate Smarter.<br />
                  <span className="gradient-text">Ship Faster.</span>
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  AI-powered annotation studio with SAM 2 segmentation, GroundingDINO detection, and one-click dataset export — built for modern ML teams.
                </p>
              </motion.div>

              {/* Feature list */}
              <motion.div
                className="grid grid-cols-1 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 group"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{
                        background: `${f.color}15`,
                        border: `1px solid ${f.color}35`,
                      }}
                    >
                      <f.icon className="h-3.5 w-3.5" style={{ color: f.color }} />
                    </div>
                    <span className="text-sm text-foreground/75">{f.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col gap-3 pt-2"
              >
                <motion.button
                  className="gradient-btn px-8 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-3 w-full"
                  onClick={() => setShowLogin(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <MousePointer2 className="w-5 h-5" />
                  Get Started — It's Free
                </motion.button>
                <p className="text-xs text-muted-foreground text-center">
                  No credit card required · Google sign-in · Instant access
                </p>
              </motion.div>

              {/* Stats strip */}
              <motion.div
                className="flex items-center gap-6 pt-2 border-t border-border/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {[
                  { val: 'SAM 2', sub: 'AI Backbone' },
                  { val: '5 Formats', sub: 'Export' },
                  { val: '∞', sub: 'Images' },
                ].map((s) => (
                  <div key={s.sub}>
                    <p className="text-lg font-bold gradient-text">{s.val}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            /* ── Login card ───────────────────────────────────────────── */
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6 relative z-10"
            >
              {/* back */}
              <motion.button
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                onClick={() => setShowLogin(false)}
                whileHover={{ x: -4 }}
              >
                ← Back
              </motion.button>

              {/* logo */}
              <div className="flex items-center gap-3">
                <div className="brand-logo">
                  <Layers className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground text-xl tracking-tight">
                  Annotation<span className="gradient-text">Studio</span>
                </span>
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-foreground mb-2">Welcome back</h2>
                <p className="text-sm text-muted-foreground">
                  Sign in to continue your annotation workspace.
                </p>
              </div>

              {/* error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Google login */}
              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-sam-cyan/20 blur-[40px] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <p className="text-sm font-medium text-foreground/70">Continue with your Google account</p>
                  {isLoading ? (
                    <div className="py-3">
                      <div className="w-8 h-8 border-2 border-sam-cyan border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleSuccess}
                      onError={() => setError('Google login was unsuccessful.')}
                      theme="filled_black"
                      size="large"
                      shape="pill"
                      text="continue_with"
                      width="100%"
                    />
                  )}
                </div>
              </div>

              {/* divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                disabled
                className="w-full flex items-center justify-center gap-3 bg-secondary/40 text-muted-foreground/50 font-semibold py-3.5 px-4 border border-border/40 rounded-xl cursor-not-allowed text-sm"
              >
                Continue with Email — Coming Soon
              </button>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                By continuing, you agree to Annotation Studio's{' '}
                <a href="#" className="underline hover:text-foreground">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
