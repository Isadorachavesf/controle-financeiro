import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@hooks/useAuth';
import { PinAuthScreen, Layout } from '@components/index';
import { DashboardScreen, TransacoesScreen, OrcamentoScreen, SincronizacaoScreen } from '@screens/index';
function App() {
    const { isAuthenticated, loading, login, logout } = useAuth();
    const [currentScreen, setCurrentScreen] = useState('dashboard');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [syncStatus, setSyncStatus] = useState('idle');
    const handleLogin = async (pin) => {
        setLoginLoading(true);
        setLoginError('');
        try {
            const success = await login(pin);
            if (!success) {
                setLoginError('PIN inválido. Tente novamente.');
            }
            return success;
        }
        catch (error) {
            setLoginError('Erro ao autenticar. Tente novamente.');
            return false;
        }
        finally {
            setLoginLoading(false);
        }
    };
    const handleLogout = () => {
        logout();
        setCurrentScreen('dashboard');
    };
    const handleNavigate = (screen) => {
        setCurrentScreen(screen);
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
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDCB0" }), _jsx("p", { className: "text-white text-lg", children: "Carregando..." })] }) }));
    }
    if (!isAuthenticated) {
        return (_jsx(PinAuthScreen, { onAuthenticate: handleLogin, isLoading: loginLoading, error: loginError }));
    }
    return (_jsxs(Layout, { currentScreen: currentScreen, onNavigate: handleNavigate, onLogout: handleLogout, syncStatus: syncStatus, children: [currentScreen === 'dashboard' && _jsx(DashboardScreen, {}), currentScreen === 'transacoes' && _jsx(TransacoesScreen, {}), currentScreen === 'orcamento' && _jsx(OrcamentoScreen, {}), currentScreen === 'sincronizacao' && _jsx(SincronizacaoScreen, {})] }));
}
export default App;
