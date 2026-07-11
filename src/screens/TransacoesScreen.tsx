import React, { useEffect, useState } from 'react';
import { Transacao, Categoria } from '@types/index';
import { apiService } from '@services/api';
import { TransacaoForm } from '@components/TransacaoForm';
import { TransacaoTable } from '@components/TransacaoTable';

export function TransacoesScreen() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    categoria: '',
    tipo: '',
    dataInicio: '',
    dataFim: '',
  });
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [mes, ano]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Ensure data is from June 2026 onwards
      let queryMes = mes;
      let queryAno = ano;
      const now = new Date(ano, mes - 1);
      const june2026 = new Date(2026, 5);

      if (now < june2026) {
        queryMes = 6;
        queryAno = 2026;
      }

      const [txs, cats] = await Promise.all([
        apiService.getTransacoes(queryMes, queryAno),
        apiService.getCategorias(),
      ]);

      setTransacoes(txs || mockTransacoes());
      setCategorias(cats || mockCategorias());
    } catch (err) {
      setError('Erro ao carregar transações');
      console.error(err);
      setTransacoes(mockTransacoes());
      setCategorias(mockCategorias());
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Omit<Transacao, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    try {
      if (editingId) {
        await apiService.updateTransacao(editingId, data);
      } else {
        await apiService.createTransacao(data);
      }
      await loadData();
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setError('Erro ao salvar transação');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) return;

    try {
      await apiService.deleteTransacao(id);
      await loadData();
    } catch (err) {
      setError('Erro ao deletar transação');
      console.error(err);
    }
  };

  const handleEdit = (tx: Transacao) => {
    setEditingId(tx.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const filteredTransacoes = transacoes.filter((tx) => {
    if (filtros.categoria && tx.categoriaId !== filtros.categoria) return false;
    if (filtros.tipo && tx.tipo !== filtros.tipo) return false;
    if (filtros.dataInicio && tx.dataTransacao < filtros.dataInicio) return false;
    if (filtros.dataFim && tx.dataTransacao > filtros.dataFim) return false;
    return true;
  });

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(ano, mes - 1)
  );

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <button
          onClick={() => setMes(mes === 1 ? 12 : mes - 1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
        <button
          onClick={() => setMes(mes === 12 ? 1 : mes + 1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          →
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <TransacaoForm
          transacao={editingId ? transacoes.find((t) => t.id === editingId) : undefined}
          categorias={categorias}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={loading}
        />
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          {showForm ? 'Cancelar' : '+ Nova Transação'}
        </button>

        {/* Filters */}
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <select
            value={filtros.categoria}
            onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>

          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>

          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Data início"
          />

          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Data fim"
          />

          <button
            onClick={() => setFiltros({ categoria: '', tipo: '', dataInicio: '', dataFim: '' })}
            className="px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Carregando transações...</p>
        </div>
      ) : (
        <TransacaoTable
          transacoes={filteredTransacoes}
          categorias={categorias}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {filteredTransacoes.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 text-lg">Nenhuma transação encontrada</p>
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Adicionar primeira transação
          </button>
        </div>
      )}
    </div>
  );
}

function mockTransacoes(): Transacao[] {
  return [
    {
      id: '1',
      categoriaId: '1',
      categoriaNome: 'Combustível',
      descricao: 'Gasolina no posto',
      valor: 150,
      dataTransacao: '2026-06-20',
      tipo: 'despesa',
      metodoPagamento: 'cartao',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
  ];
}

function mockCategorias(): Categoria[] {
  return [
    { id: '1', nome: 'Combustível', limiteMensal: 600, corGrafico: '#3b82f6', criadoEm: '' },
    { id: '2', nome: 'Comida', limiteMensal: 800, corGrafico: '#ef4444', criadoEm: '' },
    { id: '3', nome: 'Energia', limiteMensal: 300, corGrafico: '#10b981', criadoEm: '' },
    { id: '4', nome: 'Internet', limiteMensal: 150, corGrafico: '#f59e0b', criadoEm: '' },
    { id: '5', nome: 'Academia', limiteMensal: 200, corGrafico: '#8b5cf6', criadoEm: '' },
  ];
}
