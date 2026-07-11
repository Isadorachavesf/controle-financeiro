import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { apiService } from '@services/api';
export function SincronizacaoScreen() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [syncHistory, setSyncHistory] = useState([]);
    useEffect(() => {
        loadStatus();
    }, []);
    const loadStatus = async () => {
        try {
            setLoading(true);
            setError('');
            const statusData = await apiService.getSyncStatus();
            setStatus(statusData || mockStatus());
            // Add to history
            setSyncHistory((prev) => [statusData || mockStatus(), ...prev.slice(0, 9)]);
        }
        catch (err) {
            setError('Erro ao carregar status de sincronização');
            console.error(err);
            const mock = mockStatus();
            setStatus(mock);
            setSyncHistory([mock]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSync = async () => {
        try {
            setSyncing(true);
            setError('');
            const result = await apiService.triggerSync();
            setStatus(result);
            setSyncHistory((prev) => [result, ...prev.slice(0, 9)]);
        }
        catch (err) {
            setError('Erro ao sincronizar com Google Sheets');
            console.error(err);
        }
        finally {
            setSyncing(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("p", { className: "text-gray-600", children: "Carregando status de sincroniza\u00E7\u00E3o..." }) }));
    }
    const statusColor = {
        sucesso: 'green',
        erro: 'red',
        pendente: 'yellow',
    };
    const statusIcon = {
        sucesso: '✓',
        erro: '✗',
        pendente: '⏳',
    };
    const color = statusColor[status?.status || 'pendente'];
    const icon = statusIcon[status?.status || 'pendente'];
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Sincroniza\u00E7\u00E3o Google Sheets" }), error && (_jsx("div", { className: "bg-red-100 border border-red-400 text-red-700 p-4 rounded", children: error })), _jsx("div", { className: `bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg shadow p-6 border-l-4 border-${color}-500`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-2", children: "Status Atual" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `text-2xl text-${color}-600`, children: icon }), _jsx("span", { className: `text-lg font-semibold text-${color}-700 capitalize`, children: status?.status === 'sucesso' ? 'Sincronizado' : status?.status === 'erro' ? 'Erro na sincronização' : 'Pendente' })] }), status?.ultimaSincronizacao && (_jsx("div", { className: "text-sm text-gray-700 mt-3", children: _jsxs("p", { children: [_jsx("strong", { children: "\u00DAltima sincroniza\u00E7\u00E3o:" }), ' ', new Date(status.ultimaSincronizacao).toLocaleString('pt-BR')] }) })), status?.proximaSincronizacaoAgendada && (_jsx("div", { className: "text-sm text-gray-700", children: _jsxs("p", { children: [_jsx("strong", { children: "Pr\u00F3xima agendada:" }), ' ', new Date(status.proximaSincronizacaoAgendada).toLocaleString('pt-BR')] }) })), status?.transacoesSincronizadas !== undefined && (_jsx("div", { className: "text-sm text-gray-700", children: _jsxs("p", { children: [_jsx("strong", { children: "Transa\u00E7\u00F5es sincronizadas:" }), " ", status.transacoesSincronizadas] }) })), status?.motivoErro && (_jsx("div", { className: "text-sm text-gray-700 mt-2 p-2 bg-red-50 border border-red-200 rounded", children: _jsxs("p", { children: [_jsx("strong", { children: "Motivo do erro:" }), " ", status.motivoErro] }) }))] })] }), _jsx("button", { onClick: handleSync, disabled: syncing || loading, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50", children: syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar Agora' })] }) }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-blue-900 mb-2", children: "\u2139\uFE0F Informa\u00E7\u00F5es de Sincroniza\u00E7\u00E3o" }), _jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsx("li", { children: "\u2022 A sincroniza\u00E7\u00E3o autom\u00E1tica ocorre a cada 30 minutos" }), _jsx("li", { children: "\u2022 Novas transa\u00E7\u00F5es s\u00E3o enviadas automaticamente para a planilha" }), _jsx("li", { children: "\u2022 Altera\u00E7\u00F5es na planilha s\u00E3o refletidas no app" }), _jsx("li", { children: "\u2022 Use o bot\u00E3o acima para for\u00E7ar uma sincroniza\u00E7\u00E3o manual" }), _jsx("li", { children: "\u2022 Planilha: Google Sheets (ID: 1LS3gF5SSzB6xJisoo6GFUG7Lvy93oePlNkfud_Q7ed4)" })] })] }), syncHistory.length > 1 && (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "font-semibold mb-4", children: "Hist\u00F3rico de Sincroniza\u00E7\u00E3o" }), _jsx("div", { className: "space-y-2", children: syncHistory.map((item, idx) => (_jsxs("div", { className: "flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: `text-lg ${item.status === 'sucesso'
                                                ? 'text-green-600'
                                                : item.status === 'erro'
                                                    ? 'text-red-600'
                                                    : 'text-yellow-600'}`, children: statusIcon[item.status || 'pendente'] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium capitalize", children: item.status === 'sucesso' ? 'Sincronizado' : item.status === 'erro' ? 'Erro' : 'Pendente' }), item.ultimaSincronizacao && (_jsx("p", { className: "text-xs text-gray-600", children: new Date(item.ultimaSincronizacao).toLocaleString('pt-BR') }))] })] }), _jsxs("div", { className: "text-right text-sm", children: [item.transacoesSincronizadas !== undefined && (_jsxs("p", { className: "text-gray-600", children: [item.transacoesSincronizadas, " transa\u00E7\u00F5es"] })), item.motivoErro && (_jsx("p", { className: "text-red-600 text-xs", children: item.motivoErro }))] })] }, idx))) })] })), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "font-semibold mb-4", children: "\u2699\uFE0F Configura\u00E7\u00E3o" }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Intervalo de sincroniza\u00E7\u00E3o autom\u00E1tica" }), _jsx("span", { className: "font-medium", children: "30 minutos" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Autentica\u00E7\u00E3o" }), _jsx("span", { className: "font-medium", children: "Service Account" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Dire\u00E7\u00E3o da sincroniza\u00E7\u00E3o" }), _jsx("span", { className: "font-medium", children: "Bidirecional" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\u00DAltima tentativa de conex\u00E3o" }), _jsx("span", { className: "font-medium", children: status?.ultimaSincronizacao
                                            ? new Date(status.ultimaSincronizacao).toLocaleString('pt-BR')
                                            : 'Nunca' })] })] })] })] }));
}
function mockStatus() {
    return {
        status: 'sucesso',
        ultimaSincronizacao: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
        proximaSincronizacaoAgendada: new Date(Date.now() + 25 * 60000).toISOString(), // 25 minutes from now
        transacoesSincronizadas: 3,
    };
}
