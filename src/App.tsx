import React, { useState, useEffect } from 'react';
import { Layout } from '@components/index';
import { DashboardScreen, TransacoesScreen, OrcamentoScreen, InvestimentosScreen, SincronizacaoScreen } from '@screens/index';

type Screen = 'dashboard' | 'transacoes' | 'orcamento' | 'investimentos' | 'sincronizacao';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [syncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  // Remove any previously-registered service worker so stale cached versions
  // of the app are never served after a deploy.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
  }, []);

  return (
    <Layout currentScreen={currentScreen} onNavigate={handleNavigate} syncStatus={syncStatus}>
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'transacoes' && <TransacoesScreen />}
      {currentScreen === 'orcamento' && <OrcamentoScreen />}
      {currentScreen === 'investimentos' && <InvestimentosScreen />}
      {currentScreen === 'sincronizacao' && <SincronizacaoScreen />}
    </Layout>
  );
}

export default App;
