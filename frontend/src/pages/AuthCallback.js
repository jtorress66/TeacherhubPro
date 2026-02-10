import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { processGoogleSession } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Extract session_id from URL fragment
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', ''));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        console.error('No session_id in URL');
        navigate('/');
        return;
      }

      try {
        const user = await processGoogleSession(sessionId);
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        // Navigate to dashboard with user data
        navigate('/dashboard', { state: { user } });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    processAuth();
  }, [navigate, processGoogleSession]);

  return (
    <div className="min-h-screen flex items-center justify-center paper-bg">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-slate-600 mx-auto" />
        <p className="text-slate-600">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
