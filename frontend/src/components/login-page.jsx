import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Sparkles, ShieldCheck, Zap, Database } from 'lucide-react';
import { authAPI, setAuthSession } from '@/lib/auth';

export function LoginPage({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setError('');
      
      // The credential is the id_token that Google returns
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background is already handled globally by the ocean theme in globals.css */}
      
      <div className="max-w-5xl w-full mx-auto px-6 grid md:grid-cols-2 gap-12 items-center z-10">
        
        {/* Left Side: Value Proposition (Roboflow style) */}
        <div className="hidden md:flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="brand-logo animate-sparkle-pulse">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-white text-2xl tracking-tight">
              Annotation<span className="gradient-text"> Studio</span>
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Build Better Datasets, <br />
            <span className="gradient-text">Deploy Faster AI.</span>
          </h1>
          
          <p className="text-lg text-blue-100/70 max-w-md">
            Join thousands of machine learning engineers who use Annotation Studio to streamline their computer vision workflows.
          </p>

          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/20 border border-blue-400/30">
                <Zap className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="text-blue-50">Zero-shot auto-labeling with SAM 2</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/20 border border-blue-400/30">
                <Database className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="text-blue-50">Seamless dataset export to COCO & YOLO</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/20 border border-blue-400/30">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="text-blue-50">Secure MongoDB cloud storage</div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="glass-panel rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Subtle glow inside card */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-blue-500/20 blur-[50px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-sm text-blue-200/70 text-center mb-8">
                Sign in to your account to continue your annotation workspace.
              </p>

              {error && (
                <div className="w-full mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="w-full flex justify-center mt-2">
                {isLoading ? (
                  <div className="py-2">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    theme="filled_black"
                    size="large"
                    shape="pill"
                    text="continue_with"
                    width="100%"
                  />
                )}
              </div>
              
              <div className="w-full mt-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-blue-500/20" />
                <span className="text-xs text-blue-200/50 uppercase tracking-widest font-semibold">Or</span>
                <div className="flex-1 h-px bg-blue-500/20" />
              </div>
              
              <button
                disabled
                className="w-full mt-6 flex items-center justify-center gap-3 bg-transparent hover:bg-blue-900/30 text-blue-100 font-semibold py-3 px-4 border border-blue-500/30 rounded-xl transition-all opacity-50 cursor-not-allowed"
              >
                Continue with Email (Coming Soon)
              </button>

              <p className="mt-8 text-xs text-blue-200/50 text-center leading-relaxed">
                By continuing, you agree to Annotation Studio's <br/>
                <a href="#" className="underline hover:text-blue-100 transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-blue-100 transition-colors">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
