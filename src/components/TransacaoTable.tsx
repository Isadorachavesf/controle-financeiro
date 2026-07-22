import React from 'react';
import { Transacao, Categoria } from '@/types/index';

interface TransacaoTableProps {
  transacoes: Transacao[];
  categorias: Categoria[];
  onEdit: (tx: Transacao) => void;
  onDelete: (id: string) => void;
}

export function TransacaoTable({ transacoes, categorias, onEdit, onDelete }: TransacaoTableProps) {
  const getCategoriaName = (id: string) => {
    return categorias.find((c) => c.id === id)?.nome || id || 'Desconhecida';
  };

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (transacoes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow text-center py-8 text-gray-600">
        Nenhuma transação para exibir
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descrição</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Valor</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Tipo</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Método</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Situação</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transacoes.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {new Date(tx.dataTransacao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="font-medium">{tx.descricao}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {tx.tipo === 'receita' ? (
                        [tx.cidade, tx.candidato].filter(Boolean).join(' · ') || getCategoriaName(tx.categoriaId)
                      ) : (
                        <>
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {getCategoriaName(tx.categoriaId)}
                          </span>
                          {tx.quem && <span className="ml-1.5">{tx.quem}</span>}
                          {tx.parcela && tx.parcela !== 'À vista' && (
                            <span className="ml-1.5">Parcela {tx.parcela}</span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium whitespace-nowrap">
                    <span className={tx.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                      {tx.tipo === 'receita' ? '+' : '-'} R$ {fmt(tx.valor)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.tipo === 'receita'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tx.tipo === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    <span className="text-xs whitespace-nowrap">{tx.metodoPagamento || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {tx.tipo === 'receita' && tx.situacao ? (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          tx.situacao === 'Recebido'
                            ? 'bg-green-100 text-green-800'
                            : tx.situacao === 'Cancelado'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {tx.situacao}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(tx.id)}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded transition"
                        title="Deletar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {transacoes.map((tx) => (
          <div key={tx.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0 mr-3">
                <div className="font-medium text-sm truncate">{tx.descricao}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {new Date(tx.dataTransacao).toLocaleDateString('pt-BR')}
                  {tx.tipo === 'despesa' && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 rounded">
                      {getCategoriaName(tx.categoriaId)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-semibold text-sm ${tx.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.tipo === 'receita' ? '+' : '-'} R$ {fmt(tx.valor)}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <div className="flex gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    tx.tipo === 'receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tx.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </span>
                {tx.tipo === 'receita' && tx.situacao && (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      tx.situacao === 'Recebido'
                        ? 'bg-green-100 text-green-800'
                        : tx.situacao === 'Cancelado'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {tx.situacao}
                  </span>
                )}
                {tx.metodoPagamento && (
                  <span className="text-xs text-gray-500">{tx.metodoPagamento}</span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(tx)}
                  className="p-2 hover:bg-blue-100 text-blue-600 rounded transition"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(tx.id)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                  title="Deletar"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
