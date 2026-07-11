import React, { useState, useEffect } from 'react';
import { useAuth } from '@hooks/useAuth';
import { PinAuthScreen, Layout } from '@components/index';
import { DashboardScreen, TransacoesScreen, OrcamentoScreen, SincronizacaoScreen } from '@screens/index';

type Screen = 'dashboard' | 'transacoes' | 'orcamento' | 'sincronizacao';

function App() {
  const { isAuthenticated, loading, login, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const handleLogin = async (pin: string): Promise<boolean> => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const success = await login(pin);
      if (!success) {
        setLoginError('PIN inválido. Tente novamente.');
      }
      return success;
    } catch (error) {
      setLoginError('Erro ao autenticar. Tente novamente.');
      return false;
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentScreen('dashboard');
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  // Register PWA service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.log('ServiceWorker registration failed:', error);
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💰</div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <PinAuthScreen
        onAuthenticate={handleLogin}
        isLoading={loginLoading}
        error={loginError}
      />
    );
  }

  return (
    <Layout
      currentScreen={currentScreen}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      syncStatus={syncStatus}
    >
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'transacoes' && <TransacoesScreen />}
      {currentScreen === 'orcamento' && <OrcamentoScreen />}
      {currentScreen === 'sincronizacao' && <SincronizacaoScreen />}
    </Layout>
  );
}

export default App;
