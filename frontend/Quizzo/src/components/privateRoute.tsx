import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;
      
      try {
        await axios.get(import.meta.env.VITE_BACKEND_URL+ '/api/quizzes', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    };

    verifyToken();
  }, [token]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}