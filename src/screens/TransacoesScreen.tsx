import React, { useEffect, useRef, useState } from 'react';
import { Transacao, Categoria } from '@/types/index';
import { apiService } from '@services/api';
import { TransacaoForm } from '@components/TransacaoForm';
import { ReceitaForm } from '@components/ReceitaForm';
import { TransacaoTable } from '@components/TransacaoTable';

const MIN_MES = 6;
const MIN_ANO = 2026;
const antesDoMinimo = (m: number, a: number) => a < MIN_ANO || (a === MIN_ANO && m < MIN_MES);

type AbaAtiva = 'todas' | 'despesas' | 'receitas';

export function TransacoesScreen() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [clientes, setClientes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [novoTipo, setNovoTipo] = useState<'despesa' | 'receita'>('despesa');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('todas');
  const [filtros, setFiltros] = useState({
    categoria: '',
    dataInicio: '',
    dataFim: '',
  });

  const formRef = useRef<HTMLDivElement>(null);

  const inicial = (() => {
    const hoje = new Date();
    let m = hoje.getMonth() + 1;
    let a = hoje.getFullYear();
    if (antesDoMinimo(m, a)) { m = MIN_MES; a = MIN_ANO; }
    return { m, a };
  })();
  const [mes, setMes] = useState(inicial.m);
  const [ano, setAno] = useState(inicial.a);
  const noMinimo = mes === MIN_MES && ano === MIN_ANO;

  useEffect(() => {
    loadData();
    const cancelar = apiService.onDadosAtualizados(() => loadData());
    return cancelar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, ano]);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm, editingId]);

  const loadData = async () => {
    try {
      setError('');
      const [txsMes, txsTodas, cats, cls] = await Promise.all([
        apiService.getTransacoes(mes, ano),
        apiService.getTransacoes(),
        apiService.getCategorias(),
        apiService.getClientes(),
      ]);
      const receitas = txsTodas.filter((t) => t.tipo === 'receita');
      const despesasMes = txsMes.filter((t) => t.tipo === 'despesa');
      const receitasMes = txsMes.filter((t) => t.tipo === 'receita');
      const dedupIds = new Set(receitasMes.map((t) => t.id));
      const receitasExtras = receitas.filter((t) => !dedupIds.has(t.id));
      const combinadas = [...despesasMes, ...receitasMes, ...receitasExtras]
        .sort((a, b) => new Date(b.dataTransacao).getTime() - new Date(a.dataTransacao).getTime());
      setTransacoes(combinadas);
      setCategorias(cats || []);
      setClientes(cls || []);
    } catch (err) {
      setError('Erro ao carregar transações');
      console.error(err);
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
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
    try {
      await apiService.deleteTransacao(id);
      await loadData();
    } catch (err) {
      setError('Erro ao excluir lançamento');
      console.error(err);
    }
  };

  const editingTx = editingId ? transacoes.find((t) => t.id === editingId) : undefined;
  const formularioEhReceita = editingTx ? editingTx.tipo === 'receita' : novoTipo === 'receita';

  const handleEdit = (tx: Transacao) => {
    setEditingId(tx.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handlePrevMonth = () => {
    if (noMinimo) return;
    if (mes === 1) { setMes(12); setAno(ano - 1); } else setMes(mes - 1);
  };
  const handleNextMonth = () => {
    if (mes === 12) { setMes(1); setAno(ano + 1); } else setMes(mes + 1);
  };

  const filteredTransacoes = transacoes.filter((tx) => {
    if (abaAtiva === 'despesas' && tx.tipo !== 'despesa') return false;
    if (abaAtiva === 'receitas' && tx.tipo !== 'receita') return false;
    if (filtros.categoria && tx.categoriaId !== filtros.categoria) return false;
    if (filtros.dataInicio && tx.dataTransacao < filtros.dataInicio) return false;
    if (filtros.dataFim && tx.dataTransacao > filtros.dataFim) return false;
    return true;
  });

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(ano, mes - 1)
  );

  const totalDespesas = filteredTransacoes
    .filter((t) => t.tipo === 'despesa')
    .reduce((s, t) => s + t.valor, 0);
  const totalReceitas = filteredTransacoes
    .filter((t) => t.tipo === 'receita')
    .reduce((s, t) => s + t.valor, 0);
  const fmt = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const abas: { id: AbaAtiva; label: string; count: number }[] = [
    { id: 'todas', label: 'Todas', count: transacoes.length },
    { id: 'despesas', label: 'Despesas', count: transacoes.filter((t) => t.tipo === 'despesa').length },
    { id: 'receitas', label: 'Receitas', count: transacoes.filter((t) => t.tipo === 'receita').length },
  ];

  return (
    <div className="space-y-4">
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {/* Tabs: Todas / Despesas / Receitas */}
      <div className="flex gap-1 bg-white rounded-lg shadow p-1">
        {abas.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-md transition ${
              abaAtiva === aba.id
                ? aba.id === 'despesas'
                  ? 'bg-red-100 text-red-700'
                  : aba.id === 'receitas'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {aba.label}
            <span className="ml-1.5 text-xs opacity-70">({aba.count})</span>
          </button>
        ))}
      </div>

      {/* Resumo do filtro ativo */}
      {!loading && filteredTransacoes.length > 0 && (
        <div className="flex gap-3 text-sm">
          {(abaAtiva === 'todas' || abaAtiva === 'despesas') && totalDespesas > 0 && (
            <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium">
              Despesas: {fmt(totalDespesas)}
            </div>
          )}
          {(abaAtiva === 'todas' || abaAtiva === 'receitas') && totalReceitas > 0 && (
            <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">
              Receitas: {fmt(totalReceitas)}
            </div>
          )}
        </div>
      )}

      {/* Form (with ref for auto-scroll) */}
      <div ref={formRef}>
        {showForm && (
          <div className="space-y-3">
            {!editingId && (
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setNovoTipo('despesa')}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    novoTipo === 'despesa' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setNovoTipo('receita')}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    novoTipo === 'receita' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Recebimento (negócio)
                </button>
              </div>
            )}

            {formularioEhReceita ? (
              <ReceitaForm
                transacao={editingTx}
                clientes={clientes}
                onSave={handleSave}
                onCancel={handleCancel}
                isLoading={loading}
              />
            ) : (
              <TransacaoForm
                transacao={editingTx}
                categorias={categorias}
                onSave={handleSave}
                onCancel={handleCancel}
                isLoading={loading}
              />
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition whitespace-nowrap"
        >
          {showForm ? 'Cancelar' : '+ Novo Lançamento'}
        </button>

        {/* Filters */}
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          {abaAtiva !== 'receitas' && (
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
          )}

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

          {(filtros.categoria || filtros.dataInicio || filtros.dataFim) && (
            <button
              onClick={() => setFiltros({ categoria: '', dataInicio: '', dataFim: '' })}
              className="px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition"
            >
              Limpar filtros
            </button>
          )}
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
    </div>
  );
}
