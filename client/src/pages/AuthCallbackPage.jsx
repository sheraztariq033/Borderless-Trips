import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Processing your sign-in...');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!supabase) {
          setError('Authentication service unavailable');
          return;
        }

        const fullUrl = window.location.href;
        const url = new URL(fullUrl);

        // Check for OAuth errors returned by Supabase
        const oauthError = url.searchParams.get('error') || url.hash.match(/error=([^&]*)/)?.[1];
        const errorDesc = url.searchParams.get('error_description') || 
          url.hash.match(/error_description=([^&]*)/)?.[1];

        if (oauthError) {
          const decodedDesc = decodeURIComponent(decodeURIComponent(errorDesc || oauthError));
          console.error('[Auth Callback] OAuth error:', oauthError, decodedDesc);
          setError(decodedDesc);
          setStatus('Google sign-in failed');
          return;
        }

        const code = url.searchParams.get('code');
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        // Method 1: PKCE code exchange
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            setStatus('Code exchange failed');
            return;
          }
          if (data.session) {
            localStorage.setItem('bt_token', data.session.access_token);
            const profile = await api.get('/auth/me');
            loginWithToken(data.session.access_token, profile.user);
            navigate('/portal', { replace: true });
            return;
          }
        }

        // Method 2: Hash fragment tokens
        if (accessToken) {
          localStorage.setItem('bt_token', accessToken);
          const profile = await api.get('/auth/me');
          loginWithToken(accessToken, profile.user);
          navigate('/portal', { replace: true });
          return;
        }

        // Method 3: Existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('bt_token', session.access_token);
          const profile = await api.get('/auth/me');
          loginWithToken(session.access_token, profile.user);
          navigate('/portal', { replace: true });
          return;
        }

        setError('No session could be established. Please try again.');
        setStatus('Authentication failed');
      } catch (err) {
        console.error('[Auth Callback] Error:', err);
        setError(err.message);
        setStatus('Something went wrong');
      }
    };

    handleCallback();
  }, [navigate, loginWithToken]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      flexDirection: 'column',
      gap: 20,
      padding: 32
    }}>
      {!error ? (
        <>
          <div style={{
            width: 40, height: 40,
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-secondary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600 }}>
            {status}
          </p>
        </>
      ) : (
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
            {status}
          </h2>
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            color: '#ef4444', fontSize: 13, textAlign: 'left'
          }}>
            {error}
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
            This usually means the Google OAuth credentials in your Supabase dashboard are incorrect.
            Double-check that the <strong>Client ID</strong> and <strong>Client Secret</strong> in
            Supabase → Authentication → Providers → Google match your Google Cloud Console credentials.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ fontSize: 13 }}>Back to Login</Link>
            <Link to="/register" className="btn btn-outline" style={{ fontSize: 13 }}>Register Instead</Link>
          </div>
        </div>
      )}
    </div>
  );
}
