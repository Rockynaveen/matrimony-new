import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp, isUserProfileCompleted } from '../../context/AppContext';
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
          if (resGoogle.user) {
            const name = `${resGoogle.user.first_name || ''} ${resGoogle.user.last_name || ''}`.trim();
            if (name) {
              localStorage.setItem('logged_in_name', name);
            }
            if (resGoogle.user.email) {
              localStorage.setItem('logged_in_email', resGoogle.user.email);
            }
          }
          localStorage.setItem('login_method', 'google');
          const res = await checkProfileStatus();
          showToast('Google Sign-In successful!');

          const email = localStorage.getItem('logged_in_email') || res.email || '';
          const isDetailedDone = res.is_detailed_complete || isUserProfileCompleted(email);

          if (isDetailedDone) {
            // 2nd Time Login -> Redirect directly to matches
            navigate('/matches', { replace: true });
          } else if (!res.is_basic_complete && localStorage.getItem('login_method') === 'google_register') {
            // Google Registration ONLY -> Show basic profile
            navigate('/complete-basic-profile', { replace: true });
          } else {
            // 1st Time Login -> Show complete profile
            navigate('/profile/complete', { replace: true });
          }
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
