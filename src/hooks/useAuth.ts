import { useEffect, useState } from 'react';
import { apiService } from '@services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isValid = apiService.isTokenValid();
      setIsAuthenticated(isValid);
      setLoading(false);

      if (isValid) {
        // Setup auto-logout timer
        const expiresAt = localStorage.getItem('token_expires_at');
        if (expiresAt) {
          const timeUntilExpiry = parseInt(expiresAt, 10) - Date.now();
          if (timeUntilExpiry > 0) {
            setTimeout(() => {
              setIsAuthenticated(false);
              apiService.logout();
            }, timeUntilExpiry);
          }
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (pin: string) => {
    try {
      setLoading(true);
      const result = await apiService.verifyPin(pin);
      if (result.success && result.token) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    loading,
    login,
    logout,
  };
}
