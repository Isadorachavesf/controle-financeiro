import React, { useEffect, useState } from 'react';
import { Categoria } from '@/types/index';
import { apiService } from '@services/api';

export function OrcamentoScreen() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novoLimite, setNovoLimite] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      setError('');
      const cats = await apiService.getCategorias();
      setCategorias(cats || mockCategorias());
    } catch (err) {
      setError('Erro ao carregar categorias');
      console.error(err);
      setCategorias(mockCategorias());
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async (id: string, novoLimiteVal: string) => {
    if (!novoLimiteVal) return;

    const valor = parseFloat(novoLimiteVal);
    if (isNaN(valor) || valor <= 0) {
      setError('Valor deve ser um número positivo');
      return;
    }

    try {
      setError('');
      await apiService.updateCategoria(id, { limiteMensal: valor } as any);
      await loadCategorias();
      setEditingId(null);
      setNovoLimite('');
    } catch (err) {
      setError('Erro ao atualizar categoria');
      console.error(err);
    }
  };

  const handleAddCategoria = async () => {
    if (!novoNome || !novaCategoria) {
      setError('Preencha todos os campos');
      return;
    }

    const valor = parseFloat(novaCategoria);
    if (isNaN(valor) || valor <= 0) {
      setError('Limite deve ser um número positivo');
      return;
    }

    try {
      setError('');
      await apiService.createCategoria({
        nome: novoNome,
        limiteMensal: valor,
        corGrafico: '#' + Math.floor(Math.random() * 16777215).toString(16),
      });
      await loadCategorias();
      setNovoNome('');
      setNovaCategoria('');
      setShowAddForm(false);
    } catch (err) {
      setError('Erro ao criar categoria');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Carregando orçamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Controle de Orçamento</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          {showAddForm ? 'Cancelar' : '+ Nova Categoria'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Nova Categoria</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria *</label>
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Alimentação"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite Mensal (R$) *</label>
              <input
                type="number"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAddCategoria}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Criar Categoria
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 gap-4">
        {categorias.map((cat) => (
          <div key={cat.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{cat.nome}</h3>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Limite mensal</span>
                      <span className="font-medium">
                        R$ {cat.limiteMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingId(cat.id);
                  setNovoLimite(cat.limiteMensal.toString());
                }}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition"
              >
                ✏️ Editar
              </button>
            </div>

            {/* Edit Form */}
            {editingId === cat.id && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Novo Limite (R$)</label>
                  <input
                    type="number"
                    value={novoLimite}
                    onChange={(e) => setNovoLimite(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpdateLimit(cat.id, novoLimite)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setNovoLimite('');
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {categorias.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 text-lg">Nenhuma categoria criada</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Criar primeira categoria
          </button>
        </div>
      )}
    </div>
  );
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
