import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, Database, MousePointer2, Layers, Box } from 'lucide-react';
import { authAPI, setAuthSession } from '@/lib/auth';

// Sample images for the floating 3D ring
const SAMPLE_SEGMENTS = [
  { id: 1, color: '#22d3ee', delay: 0 },
  { id: 2, color: '#a78bfa', delay: 0.5 },
  { id: 3, color: '#34d399', delay: 1 },
  { id: 4, color: '#f472b6', delay: 1.5 },
  { id: 5, color: '#fbbf24', delay: 2 },
  { id: 6, color: '#60a5fa', delay: 2.5 },
  { id: 7, color: '#f87171', delay: 3 },
  { id: 8, color: '#4ade80', delay: 3.5 },
];

// Floating 3D Segment Component
function FloatingSegment({ segment, index, total }) {
  const angle = (index / total) * Math.PI * 2;
  const radius = 280;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const rotateY = (angle * 180) / Math.PI;

  return (
    <motion.div
      className="absolute"
      style={{
        transformStyle: 'preserve-3d',
        transform: `translateX(${x}px) translateZ(${z}px) rotateY(${-rotateY}deg)`,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -10, 0, -5, 0],
      }}
      transition={{
        opacity: { duration: 0.8, delay: segment.delay },
        scale: { duration: 0.8, delay: segment.delay },
        y: { duration: 4 + index * 0.5, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <motion.div
        className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden relative cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${segment.color}20 0%, ${segment.color}40 100%)`,
          border: `2px solid ${segment.color}60`,
          boxShadow: `0 8px 32px ${segment.color}30, 0 0 0 1px rgba(255,255,255,0.1) inset`,
        }}
        whileHover={{ 
          scale: 1.2, 
          z: 50,
          boxShadow: `0 16px 48px ${segment.color}50, 0 0 0 2px ${segment.color}`,
        }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${segment.color}30 0%, transparent 70%)` }}
        >
          <Box className="w-8 h-8 md:w-10 md:h-10" style={{ color: segment.color }} />
        </div>
        <div 
          className="absolute inset-0 animate-shimmer"
          style={{ background: `linear-gradient(90deg, transparent, ${segment.color}20, transparent)`, backgroundSize: '200% 100%' }}
        />
      </motion.div>
    </motion.div>
  );
}

// Particle Background
function ParticleBackground() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 4 + 4,
    delay: Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.6) 0%, transparent 70%)',
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// 3D Ring Component
function Ring3D() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => prev + 0.3);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[600px] h-[600px] md:w-[700px] md:h-[700px]">
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{
          perspective: '1500px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <motion.div
          className="relative"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotation}deg) rotateX(10deg)`,
          }}
        >
          {SAMPLE_SEGMENTS.map((segment, index) => (
            <FloatingSegment
              key={segment.id}
              segment={segment}
              index={index}
              total={SAMPLE_SEGMENTS.length}
            />
          ))}
        </motion.div>
        
        {/* Center content */}
        <motion.div
          className="absolute flex flex-col items-center text-center z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.p 
            className="text-lg md:text-xl text-foreground/80 font-medium max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            The future is built on
          </motion.p>
          <motion.p 
            className="text-lg md:text-xl gradient-text font-semibold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            Artificial Intelligence.
          </motion.p>
          <motion.p
            className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Scroll to explore
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

export function LoginPage({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);

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
      console.error('Login error:', err);
      const detailedError = err.response?.data?.details;
      setError(detailedError ? `Authentication failed: ${detailedError}` : 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setError('Google login was unsuccessful.');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-background">
      <ParticleBackground />
      
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sam-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sam-purple/10 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!showLogin ? (
          <motion.div
            key="hero"
            className="flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            {/* 3D Ring */}
            <Ring3D />
            
            {/* CTA Button */}
            <motion.button
              className="gradient-btn px-10 py-4 rounded-full text-lg font-semibold flex items-center gap-3 mt-8"
              onClick={() => setShowLogin(true)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <MousePointer2 className="w-5 h-5" />
              Get Started
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            className="flex flex-col md:flex-row items-center justify-center gap-16 z-10 px-6 max-w-6xl w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Left Side: Value Proposition */}
            <motion.div 
              className="hidden md:flex flex-col gap-8 max-w-md"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="brand-logo"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </motion.div>
                <span className="font-bold text-foreground text-2xl tracking-tight">
                  Annotation<span className="gradient-text"> Studio</span>
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Build Better Datasets, <br />
                <span className="gradient-text">Deploy Faster AI.</span>
              </h1>
              
              <p className="text-lg text-muted-foreground">
                Join thousands of machine learning engineers who use Annotation Studio to streamline their computer vision workflows.
              </p>

              <div className="space-y-4 mt-4">
                {[
                  { icon: Zap, text: 'Zero-shot auto-labeling with SAM 2', color: '#22d3ee' },
                  { icon: Database, text: 'Seamless dataset export to COCO & YOLO', color: '#a78bfa' },
                  { icon: ShieldCheck, text: 'Secure MongoDB cloud storage', color: '#34d399' },
                ].map((feature, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <motion.div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ 
                        background: `${feature.color}15`,
                        border: `1px solid ${feature.color}30`,
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <feature.icon className="h-5 w-5" style={{ color: feature.color }} />
                    </motion.div>
                    <span className="text-foreground/80">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
              
              <motion.button
                className="text-muted-foreground text-sm flex items-center gap-2 hover:text-foreground transition-colors mt-4"
                onClick={() => setShowLogin(false)}
                whileHover={{ x: -4 }}
              >
                ← Back to home
              </motion.button>
            </motion.div>

            {/* Right Side: Login Card */}
            <motion.div 
              className="w-full max-w-md"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="glass-panel rounded-3xl p-8 md:p-10 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[200%] h-40 bg-gradient-to-b from-sam-cyan/20 to-transparent blur-[60px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sam-cyan to-sam-teal flex items-center justify-center mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                  >
                    <Layers className="w-8 h-8 text-primary-foreground" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
                  <p className="text-sm text-muted-foreground text-center mb-8">
                    Sign in to your account to continue your annotation workspace.
                  </p>

                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        className="w-full mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="w-full flex justify-center mt-2">
                    {isLoading ? (
                      <motion.div 
                        className="py-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="w-8 h-8 border-2 border-sam-cyan border-t-transparent rounded-full animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <GoogleLogin
                          onSuccess={handleSuccess}
                          onError={handleError}
                          theme="filled_black"
                          size="large"
                          shape="pill"
                          text="continue_with"
                          width="100%"
                        />
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="w-full mt-8 flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  <motion.button
                    disabled
                    className="w-full mt-6 flex items-center justify-center gap-3 bg-secondary/50 text-muted-foreground font-semibold py-4 px-4 border border-border rounded-xl transition-all opacity-50 cursor-not-allowed"
                    whileHover={{ scale: 1.01 }}
                  >
                    Continue with Email (Coming Soon)
                  </motion.button>

                  <p className="mt-8 text-xs text-muted-foreground text-center leading-relaxed">
                    By continuing, you agree to Annotation Studio&apos;s <br/>
                    <a href="#" className="underline hover:text-foreground transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-foreground transition-colors">Privacy Policy</a>.
                  </p>
                </div>
              </div>
              
              {/* Mobile back button */}
              <motion.button
                className="md:hidden text-muted-foreground text-sm flex items-center gap-2 hover:text-foreground transition-colors mt-6 mx-auto"
                onClick={() => setShowLogin(false)}
                whileHover={{ x: -4 }}
              >
                ← Back to home
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
