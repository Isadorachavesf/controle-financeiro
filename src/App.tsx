import React, { useState, useEffect } from 'react';
import { useAuth } from '@hooks/useAuth';
import { PinAuthScreen } from '@components/PinAuthScreen';
import { Layout } from '@components/Layout';

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
      {/* Screen Content */}
      {currentScreen === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Receitas (Junho 2026)</p>
              <p className="text-3xl font-bold text-green-600 mt-2">R$ 0,00</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Despesas (Junho 2026)</p>
              <p className="text-3xl font-bold text-red-600 mt-2">R$ 0,00</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Saldo</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">R$ 0,00</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Gráficos em desenvolvimento...</h2>
            <p className="text-gray-600">Os gráficos serão renderizados aqui</p>
          </div>
        </div>
      )}

      {currentScreen === 'transacoes' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Transações</h2>
          <p className="text-gray-600">Tela de transações em desenvolvimento...</p>
        </div>
      )}

      {currentScreen === 'orcamento' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Orçamento</h2>
          <p className="text-gray-600">Tela de orçamento em desenvolvimento...</p>
        </div>
      )}

      {currentScreen === 'sincronizacao' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Sincronização Google Sheets</h2>
          <p className="text-gray-600">Status de sincronização em desenvolvimento...</p>
        </div>
      )}
    </Layout>
  );
}

export default App;
