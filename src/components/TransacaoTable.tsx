import React from 'react';
import { Transacao, Categoria } from '@types/index';

interface TransacaoTableProps {
  transacoes: Transacao[];
  categorias: Categoria[];
  onEdit: (tx: Transacao) => void;
  onDelete: (id: string) => void;
}

export function TransacaoTable({ transacoes, categorias, onEdit, onDelete }: TransacaoTableProps) {
  const getCategoriaName = (id: string) => {
    return categorias.find((c) => c.id === id)?.nome || 'Desconhecida';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoria</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descrição</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Valor</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Tipo</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Método</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transacoes.map((tx) => (
              <tr
                key={tx.id}
                className="hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3 text-sm">
                  {new Date(tx.dataTransacao).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {getCategoriaName(tx.categoriaId)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {tx.descricao}
                  {tx.notas && (
                    <div className="text-xs text-gray-500 mt-1">{tx.notas}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  <span className={tx.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                    {tx.tipo === 'receita' ? '+' : '-'} R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  <span className="text-xs">
                    {tx.metodoPagamento === 'cartao'
                      ? '💳'
                      : tx.metodoPagamento === 'dinheiro'
                      ? '💵'
                      : tx.metodoPagamento === 'transferencia'
                      ? '📱'
                      : '...'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-1 hover:bg-blue-100 text-blue-600 rounded transition"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded transition"
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

      {transacoes.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          Nenhuma transação para exibir
        </div>
      )}
    </div>
  );
}
