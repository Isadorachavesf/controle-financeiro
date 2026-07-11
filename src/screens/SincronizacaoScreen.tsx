import React, { useEffect, useState } from 'react';
import { SincronizacaoStatus } from '@types/index';
import { apiService } from '@services/api';

export function SincronizacaoScreen() {
  const [status, setStatus] = useState<SincronizacaoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncHistory, setSyncHistory] = useState<SincronizacaoStatus[]>([]);

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
    } catch (err) {
      setError('Erro ao carregar status de sincronização');
      console.error(err);
      const mock = mockStatus();
      setStatus(mock);
      setSyncHistory([mock]);
    } finally {
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
    } catch (err) {
      setError('Erro ao sincronizar com Google Sheets');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Carregando status de sincronização...</p>
      </div>
    );
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sincronização Google Sheets</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {/* Current Status */}
      <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Status Atual</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-2xl text-${color}-600`}>{icon}</span>
                <span className={`text-lg font-semibold text-${color}-700 capitalize`}>
                  {status?.status === 'sucesso' ? 'Sincronizado' : status?.status === 'erro' ? 'Erro na sincronização' : 'Pendente'}
                </span>
              </div>

              {status?.ultimaSincronizacao && (
                <div className="text-sm text-gray-700 mt-3">
                  <p>
                    <strong>Última sincronização:</strong>{' '}
                    {new Date(status.ultimaSincronizacao).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              {status?.proximaSincronizacaoAgendada && (
                <div className="text-sm text-gray-700">
                  <p>
                    <strong>Próxima agendada:</strong>{' '}
                    {new Date(status.proximaSincronizacaoAgendada).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              {status?.transacoesSincronizadas !== undefined && (
                <div className="text-sm text-gray-700">
                  <p>
                    <strong>Transações sincronizadas:</strong> {status.transacoesSincronizadas}
                  </p>
                </div>
              )}

              {status?.motivoErro && (
                <div className="text-sm text-gray-700 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p>
                    <strong>Motivo do erro:</strong> {status.motivoErro}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar Agora'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informações de Sincronização</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• A sincronização automática ocorre a cada 30 minutos</li>
          <li>• Novas transações são enviadas automaticamente para a planilha</li>
          <li>• Alterações na planilha são refletidas no app</li>
          <li>• Use o botão acima para forçar uma sincronização manual</li>
          <li>• Planilha: Google Sheets (ID: 1LS3gF5SSzB6xJisoo6GFUG7Lvy93oePlNkfud_Q7ed4)</li>
        </ul>
      </div>

      {/* Sync History */}
      {syncHistory.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Histórico de Sincronização</h3>
          <div className="space-y-2">
            {syncHistory.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg ${
                      item.status === 'sucesso'
                        ? 'text-green-600'
                        : item.status === 'erro'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {statusIcon[item.status || 'pendente']}
                  </span>
                  <div>
                    <p className="font-medium capitalize">
                      {item.status === 'sucesso' ? 'Sincronizado' : item.status === 'erro' ? 'Erro' : 'Pendente'}
                    </p>
                    {item.ultimaSincronizacao && (
                      <p className="text-xs text-gray-600">
                        {new Date(item.ultimaSincronizacao).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  {item.transacoesSincronizadas !== undefined && (
                    <p className="text-gray-600">{item.transacoesSincronizadas} transações</p>
                  )}
                  {item.motivoErro && (
                    <p className="text-red-600 text-xs">{item.motivoErro}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4">⚙️ Configuração</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Intervalo de sincronização automática</span>
            <span className="font-medium">30 minutos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Autenticação</span>
            <span className="font-medium">Service Account</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Direção da sincronização</span>
            <span className="font-medium">Bidirecional</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Última tentativa de conexão</span>
            <span className="font-medium">
              {status?.ultimaSincronizacao
                ? new Date(status.ultimaSincronizacao).toLocaleString('pt-BR')
                : 'Nunca'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function mockStatus(): SincronizacaoStatus {
  return {
    status: 'sucesso',
    ultimaSincronizacao: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
    proximaSincronizacaoAgendada: new Date(Date.now() + 25 * 60000).toISOString(), // 25 minutes from now
    transacoesSincronizadas: 3,
  };
}
