import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp, getStoredOnboardingStatus, getNextPendingRoute } from '../../context/AppContext';
import { googleAuthApi } from '../../api/googleAuthApi';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkProfileStatus, showToast } = useApp();
  const [statusMsg, setStatusMsg] = useState('Authenticating with Google...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token or code from URL query or hash params
        const queryParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.substring(1));

        const idToken = queryParams.get('id_token') || hashParams.get('id_token') || queryParams.get('code');

        if (idToken) {
          setStatusMsg('Verifying Google credentials with server...');
          const resGoogle = await googleAuthApi.googleLogin({ id_token: idToken, action: 'login' });
          if (resGoogle.user && resGoogle.user.email) {
            localStorage.setItem('logged_in_email', resGoogle.user.email);
          }
          localStorage.removeItem('google_avatar');
          localStorage.setItem('login_method', 'google');
          const res = await checkProfileStatus();
          showToast('Google Sign-In successful!');

          const email = localStorage.getItem('logged_in_email') || res.email || '';
          const status = getStoredOnboardingStatus(email);
          const nextRoute = getNextPendingRoute(status);
          navigate(nextRoute, { replace: true });
        } else {
          // If no token in URL, redirect back to login
          navigate('/login', { replace: true });
        }
      } catch (err: any) {
        showToast(err.message || 'Google Authentication failed');
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [location, navigate, checkProfileStatus, showToast]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <LoadingScreen title="Google Authentication" message={statusMsg} />
    </div>
  );
};
