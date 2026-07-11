import React, { useEffect, useState } from 'react';
import { SincronizacaoStatus } from '@/types/index';
import { apiService } from '@services/api';

// Mapas estáticos (Tailwind não gera classes montadas dinamicamente).
const CARD_STATUS: Record<string, string> = {
  sucesso: 'bg-green-50 border-green-500',
  erro: 'bg-red-50 border-red-500',
  pendente: 'bg-yellow-50 border-yellow-500',
};
const TEXTO_STATUS: Record<string, string> = {
  sucesso: 'text-green-700',
  erro: 'text-red-700',
  pendente: 'text-yellow-700',
};
const ICONE_STATUS: Record<string, string> = { sucesso: '✓', erro: '✗', pendente: '⏳' };
const ROTULO_STATUS: Record<string, string> = {
  sucesso: 'Sincronizado',
  erro: 'Erro na sincronização',
  pendente: 'Aguardando conexão',
};

export function SincronizacaoScreen() {
  const [status, setStatus] = useState<SincronizacaoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const [conectado, setConectado] = useState(apiService.isConectado());
  const [url, setUrl] = useState(apiService.getAppsScriptUrl());
  const [conectando, setConectando] = useState(false);
  const [msgConexao, setMsgConexao] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError('');
      const statusData = await apiService.getSyncStatus();
      setStatus(statusData);
    } catch (err) {
      setError('Erro ao carregar status de sincronização');
      console.error(err);
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
      if (result.status === 'erro') {
        setError(result.motivoErro || 'Erro ao sincronizar com a planilha');
      }
    } catch (err) {
      setError('Erro ao sincronizar com a planilha');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleConectar = async () => {
    setConectando(true);
    setMsgConexao('');
    try {
      await apiService.conectarPlanilha(url);
      setConectado(true);
      setMsgConexao('✓ Conectado! Seus dados agora ficam salvos na planilha.');
      await loadStatus();
    } catch (err: any) {
      apiService.desconectarPlanilha();
      setConectado(false);
      setMsgConexao(
        '✗ Não foi possível conectar. Confira se a URL termina em /exec e se o acesso está como "Qualquer pessoa".'
      );
      console.error(err);
    } finally {
      setConectando(false);
    }
  };

  const handleDesconectar = () => {
    apiService.desconectarPlanilha();
    setConectado(false);
    setUrl('');
    setMsgConexao('Desconectado. Os dados continuam salvos neste aparelho.');
    loadStatus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  const st = status?.status || 'pendente';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sincronização com a Planilha</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">{error}</div>
      )}

      {/* Conexão com a planilha */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-1">
          {conectado ? '🟢 Planilha conectada' : '🔌 Conectar à sua planilha'}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {conectado
            ? 'Tudo que você registra aqui é salvo automaticamente na sua planilha do Google.'
            : 'Cole a URL do App da Web (Google Apps Script) para salvar tudo direto na sua planilha.'}
        </p>

        {conectado ? (
          <div className="space-y-3">
            <div className="text-sm bg-green-50 border border-green-200 rounded p-3 break-all">
              {apiService.getAppsScriptUrl()}
            </div>
            <button
              onClick={handleDesconectar}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
            <button
              onClick={handleConectar}
              disabled={conectando || !url.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {conectando ? 'Conectando...' : 'Conectar planilha'}
            </button>
          </div>
        )}

        {msgConexao && (
          <p
            className={`text-sm mt-3 ${
              msgConexao.startsWith('✓') ? 'text-green-700' : msgConexao.startsWith('✗') ? 'text-red-700' : 'text-gray-600'
            }`}
          >
            {msgConexao}
          </p>
        )}
      </div>

      {/* Status atual */}
      <div className={`rounded-lg shadow p-6 border-l-4 ${CARD_STATUS[st]}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Status</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{ICONE_STATUS[st]}</span>
              <span className={`text-lg font-semibold ${TEXTO_STATUS[st]}`}>{ROTULO_STATUS[st]}</span>
            </div>
            {status?.ultimaSincronizacao && (
              <p className="text-sm text-gray-700 mt-3">
                <strong>Última atualização:</strong>{' '}
                {new Date(status.ultimaSincronizacao).toLocaleString('pt-BR')}
              </p>
            )}
            {status?.transacoesSincronizadas !== undefined && (
              <p className="text-sm text-gray-700">
                <strong>Transações:</strong> {status.transacoesSincronizadas}
              </p>
            )}
          </div>

          <button
            onClick={handleSync}
            disabled={syncing || !conectado}
            title={!conectado ? 'Conecte a planilha primeiro' : ''}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 whitespace-nowrap"
          >
            {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar agora'}
          </button>
        </div>
      </div>

      {/* Informações */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Como funciona</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Conectada: cada lançamento é salvo direto na sua planilha do Google.</li>
          <li>• O botão "Sincronizar agora" puxa as últimas mudanças feitas na planilha.</li>
          <li>• Sem conexão com a internet, o app usa a última cópia salva no aparelho.</li>
          <li>• Sem a planilha conectada, os dados ficam salvos apenas neste aparelho.</li>
        </ul>
      </div>
    </div>
  );
}
