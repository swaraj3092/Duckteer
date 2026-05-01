import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  useEffect(() => {
    // Check if user is authenticated, if not redirect to login
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated && window.location.pathname !== '/login' && window.location.pathname !== '/verify-otp') {
      window.location.href = '/login';
    }
  }, []);

  return <RouterProvider router={router} />;
}
