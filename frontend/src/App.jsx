import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, googleLogout } from '@react-oauth/google';
import { SetupPage } from '@/components/setup-page';
import { LabelingApp } from '@/components/labeling-app';
import { LoginPage } from '@/components/login-page';
import { getAuthSession, setAuthSession } from '@/lib/auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  const [user, setUser] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const session = getAuthSession();
    if (session && session.user) {
      setUser(session.user);
    }
    setIsAuthChecking(false);
  }, []);

  if (isAuthChecking) {
    return <div className="h-screen bg-background" />; // Blank while checking
  }

  const handleLogout = () => {
    googleLogout();
    setAuthSession(null);
    setUser(null);
    setSetupData(null);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {!user ? (
        <LoginPage onLoginSuccess={(userData) => setUser(userData)} />
      ) : !setupData ? (
        <SetupPage onContinue={setSetupData} user={user} onLogout={handleLogout} />
      ) : (
        <LabelingApp
          initialFiles={setupData.files}
          selectedModel={setupData.model}
          onBack={() => setSetupData(null)}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </GoogleOAuthProvider>
  );
}
