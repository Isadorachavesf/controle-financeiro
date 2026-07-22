import React, { useEffect, useState } from 'react';
import { Categoria } from '@/types/index';
import { apiService } from '@services/api';

const MIN_MES = 6;
const MIN_ANO = 2026;
const antesDoMinimo = (m: number, a: number) => a < MIN_ANO || (a === MIN_ANO && m < MIN_MES);

interface LinhaOrcamento {
  categoria: Categoria;
  gasto: number;
  percentual: number;
}

export function OrcamentoScreen() {
  const inicial = (() => {
    const hoje = new Date();
    let m = hoje.getMonth() + 1;
    let a = hoje.getFullYear();
    if (antesDoMinimo(m, a)) { m = MIN_MES; a = MIN_ANO; }
    return { m, a };
  })();

  const [mes, setMes] = useState(inicial.m);
  const [ano, setAno] = useState(inicial.a);
  const [linhas, setLinhas] = useState<LinhaOrcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novoLimite, setNovoLimite] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadDados();
    const cancelar = apiService.onDadosAtualizados(() => loadDados());
    return cancelar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, ano]);

  const loadDados = async () => {
    try {
      setError('');
      const dashboard = await apiService.getDashboard(mes, ano);
      const novasLinhas = dashboard.porCategoria
        .map((item) => ({
          categoria: item.categoria,
          gasto: item.gasto,
          percentual: item.percentualDoLimite,
        }))
        .sort((a, b) => {
          // categorias com limite definido primeiro (as que fazem sentido monitorar), depois por gasto
          const aTem = a.categoria.limiteMensal > 0 ? 1 : 0;
          const bTem = b.categoria.limiteMensal > 0 ? 1 : 0;
          if (aTem !== bTem) return bTem - aTem;
          return b.gasto - a.gasto;
        });
      setLinhas(novasLinhas);
    } catch (err) {
      setError('Erro ao carregar orçamento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const noMinimo = mes === MIN_MES && ano === MIN_ANO;
  const handlePrevMonth = () => {
    if (noMinimo) return;
    if (mes === 1) { setMes(12); setAno(ano - 1); } else setMes(mes - 1);
  };
  const handleNextMonth = () => {
    if (mes === 12) { setMes(1); setAno(ano + 1); } else setMes(mes + 1);
  };
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(ano, mes - 1)
  );

  const handleUpdateLimit = async (id: string, novoLimiteVal: string) => {
    if (!novoLimiteVal) return;
    const valor = parseFloat(novoLimiteVal.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      setError('O limite deve ser um número positivo.');
      return;
    }
    try {
      setError('');
      await apiService.updateCategoria(id, { limiteMensal: valor } as any);
      await loadDados();
      setEditingId(null);
      setNovoLimite('');
    } catch (err) {
      setError('Erro ao atualizar categoria');
      console.error(err);
    }
  };

  const handleAddCategoria = async () => {
    if (!novoNome || !novaCategoria) {
      setError('Preencha nome e limite.');
      return;
    }
    const valor = parseFloat(novaCategoria.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      setError('O limite deve ser um número positivo.');
      return;
    }
    try {
      setError('');
      await apiService.createCategoria({
        nome: novoNome,
        limiteMensal: valor,
        corGrafico: '#' + Math.floor(Math.random() * 16777215).toString(16),
      });
      await loadDados();
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

  const comLimite = linhas.filter((l) => l.categoria.limiteMensal > 0);
  const totalLimite = comLimite.reduce((s, l) => s + l.categoria.limiteMensal, 0);
  const totalGastoComLimite = comLimite.reduce((s, l) => s + l.gasto, 0);
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Orçamento por categoria</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          {showAddForm ? 'Cancelar' : '+ Nova Categoria'}
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <button
          onClick={handlePrevMonth}
          disabled={noMinimo}
          className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
          →
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">{error}</div>}

      {/* Resumo geral do orçamento */}
      {comLimite.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Total orçado vs. gasto no mês</span>
            <span className="font-semibold">
              {fmt(totalGastoComLimite)} / {fmt(totalLimite)}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                totalGastoComLimite > totalLimite ? 'bg-red-500' : totalGastoComLimite / totalLimite >= 0.8 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, (totalGastoComLimite / (totalLimite || 1)) * 100)}%` }}
            />
          </div>
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
                placeholder="0,00"
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
        {linhas.map(({ categoria: cat, gasto, percentual }) => {
          const temLimite = cat.limiteMensal > 0;
          const estourou = temLimite && percentual >= 100;
          const atencao = temLimite && percentual >= 80 && percentual < 100;
          const barColor = estourou ? 'bg-red-500' : atencao ? 'bg-yellow-500' : 'bg-green-500';

          return (
            <div key={cat.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.corGrafico }} />
                    <h3 className="text-lg font-semibold truncate">{cat.nome}</h3>
                    {estourou && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">estourou</span>}
                    {atencao && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">atenção</span>}
                  </div>

                  {temLimite ? (
                    <>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{fmt(gasto)} de {fmt(cat.limiteMensal)}</span>
                        <span className={`font-medium ${estourou ? 'text-red-600' : atencao ? 'text-yellow-700' : 'text-gray-700'}`}>
                          {percentual.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${Math.min(100, percentual)}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Gasto no mês: <span className="font-medium text-gray-700">{fmt(gasto)}</span> — sem limite definido
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingId(cat.id);
                    setNovoLimite(cat.limiteMensal ? cat.limiteMensal.toString() : '');
                  }}
                  className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition text-sm whitespace-nowrap"
                >
                  ✏️ {temLimite ? 'Editar' : 'Definir limite'}
                </button>
              </div>

              {editingId === cat.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Limite mensal (R$)</label>
                    <input
                      type="number"
                      value={novoLimite}
                      onChange={(e) => setNovoLimite(e.target.value)}
                      step="0.01"
                      min="0"
                      autoFocus
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
                      onClick={() => { setEditingId(null); setNovoLimite(''); }}
                      className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {linhas.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 text-lg">Nenhuma categoria encontrada</p>
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
