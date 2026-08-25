import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { queryClient } from './lib/queryClient';
import { AppProvider } from './context/AppContext';
import { AppRouter } from './app/router';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '727391199502-g8hcd4g0l67qqfvsu5cvb4fdb2ia2f72.apps.googleusercontent.com';

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <AppRouter />
        </AppProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
