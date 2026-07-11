import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  currentScreen: 'dashboard' | 'transacoes' | 'orcamento' | 'sincronizacao';
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
}

export function Layout({
  children,
  currentScreen,
  onNavigate,
  onLogout,
  syncStatus = 'idle',
}: LayoutProps) {
  const NavLink = ({
    screen,
    label,
    icon,
  }: {
    screen: string;
    label: string;
    icon: string;
  }) => (
    <button
      onClick={() => onNavigate(screen)}
      className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs sm:text-sm font-medium rounded-lg transition ${
        currentScreen === screen
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="text-xl sm:text-2xl mb-1">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Financeiro</h1>
          </div>
          <div className="flex items-center gap-3">
            {syncStatus === 'syncing' && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <span className="animate-spin">⚙️</span>
                <span className="hidden sm:inline">Sincronizando...</span>
              </div>
            )}
            {syncStatus === 'success' && (
              <span className="text-sm text-green-600 hidden sm:inline">✓ Sincronizado</span>
            )}
            {syncStatus === 'error' && (
              <span className="text-sm text-red-600 hidden sm:inline">✗ Erro na sync</span>
            )}
            <button
              onClick={onLogout}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 sticky bottom-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 sm:gap-4">
            <NavLink screen="dashboard" label="Dashboard" icon="📊" />
            <NavLink screen="transacoes" label="Transações" icon="💳" />
            <NavLink screen="orcamento" label="Orçamento" icon="📈" />
            <NavLink screen="sincronizacao" label="Sincronizar" icon="🔄" />
          </div>
        </div>
      </nav>
    </div>
  );
}
