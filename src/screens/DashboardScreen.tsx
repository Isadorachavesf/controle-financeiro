import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardData, Transacao } from '@/types/index';
import { apiService, competenciaDe } from '@services/api';

export function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [todasTransacoes, setTodasTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  useEffect(() => {
    loadDashboard();
  }, [mes, ano]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashboard, todas] = await Promise.all([
        apiService.getDashboard(mes, ano),
        apiService.getTransacoes(),
      ]);
      setData(dashboard);
      setTodasTransacoes(todas);
    } catch (err) {
      setError('Erro ao carregar dashboard');
      console.error(err);
      setData(emptyDashboard(mes, ano));
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (mes === 1) {
      setMes(12);
      setAno(ano - 1);
    } else {
      setMes(mes - 1);
    }
  };

  const handleNextMonth = () => {
    if (mes === 12) {
      setMes(1);
      setAno(ano + 1);
    } else {
      setMes(mes + 1);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
        {error || 'Erro ao carregar dados'}
      </div>
    );
  }

  const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4',
  ];

  const chartData = data.porCategoria.map((item, idx) => ({
    name: item.categoria.nome,
    value: item.gasto,
    color: COLORS[idx % COLORS.length],
  }));

  const trendData = generateTrendData(mes, ano, todasTransacoes);

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(ano, mes - 1)
  );

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          →
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Receitas</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            R$ {data.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Despesas</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            R$ {data.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className={`bg-gradient-to-br rounded-lg shadow p-6 border-l-4 ${
          data.saldo >= 0
            ? 'from-blue-50 to-blue-100 border-blue-500'
            : 'from-orange-50 to-orange-100 border-orange-500'
        }`}>
          <p className="text-gray-600 text-sm font-medium">Saldo</p>
          <p className={`text-3xl font-bold mt-2 ${data.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            R$ {data.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Budget Alerts */}
      {data.alertas.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Alertas de Orçamento</h3>
          <div className="space-y-2">
            {data.alertas.map((alerta) => (
              <div key={alerta.categoriaId} className="text-sm text-yellow-800">
                <p className="font-medium">{alerta.categoriaNome}</p>
                <p>
                  {alerta.percentual.toFixed(1)}% do limite (R$ {alerta.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Despesas por Categoria</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `R$ ${parseFloat(value.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Sem dados para este período</p>
          )}
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Tendência (6 meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip
                formatter={(value) => `R$ ${parseFloat(value.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Legend />
              <Line type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={2} name="Receitas" />
              <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2} name="Despesas" />
              <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4">Resumo por Categoria</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Categoria</th>
                <th className="px-4 py-2 text-right font-semibold">Gasto</th>
                <th className="px-4 py-2 text-right font-semibold">Limite</th>
                <th className="px-4 py-2 text-right font-semibold">% do Limite</th>
              </tr>
            </thead>
            <tbody>
              {data.porCategoria.map((item) => (
                <tr key={item.categoria.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{item.categoria.nome}</td>
                  <td className="px-4 py-2 text-right">
                    R$ {item.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-right">
                    R$ {item.categoria.limiteMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.percentualDoLimite >= 80
                          ? 'bg-red-100 text-red-800'
                          : item.percentualDoLimite >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.percentualDoLimite.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      {data.ultimasTransacoes && data.ultimasTransacoes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Últimas Transações</h3>
          <div className="space-y-2">
            {data.ultimasTransacoes.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{tx.categoriaNome || tx.descricao}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.dataTransacao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <p className={`font-semibold ${tx.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.tipo === 'receita' ? '+' : '-'} R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Dashboard vazio (usado só se houver erro de carregamento).
function emptyDashboard(mes: number, ano: number): DashboardData {
  return {
    mes,
    ano,
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    porCategoria: [],
    alertas: [],
    ultimasTransacoes: [],
  };
}

// Tendência dos últimos 6 meses calculada a partir das transações reais,
// agrupando pela competência (mês da aba) para bater com a planilha.
function generateTrendData(mes: number, ano: number, transacoes: Transacao[]) {
  const data = [];
  for (let i = 5; i >= 0; i--) {
    let m = mes - i;
    let y = ano;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const chave = `${y}-${String(m).padStart(2, '0')}`;
    const doMes = transacoes.filter((t) => competenciaDe(t) === chave);
    const receitas = doMes.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
    const despesas = doMes.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
    data.push({
      mes: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(y, m - 1)),
      receitas,
      despesas,
      saldo: receitas - despesas,
    });
  }
  return data;
}
