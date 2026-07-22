import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Transacao, receitaRealizada } from '@/types/index';
import { apiService, competenciaDe } from '@services/api';

const STORAGE_RESERVA = 'cf_reserva_atual';
const MIN_MES = 6;
const MIN_ANO = 2026;

// Presets de taxa anual — são ESTIMATIVAS ILUSTRATIVAS para você comparar
// cenários, não dados de mercado ao vivo. Ajuste para a taxa real do dia.
const PRESETS_TAXA = [
  { label: 'Poupança (conservador)', taxa: 6 },
  { label: 'CDI / Tesouro (referência)', taxa: 11 },
  { label: 'Renda variável (agressivo)', taxa: 15 },
];

function fmt(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtCompacto(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}mi`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1000).toFixed(1)}mil`;
  return fmt(v);
}

// Meses (YYYY-MM) do início do controle (junho/2026) até o mês atual de dados.
function ultimosMesesComDados(txs: Transacao[]): string[] {
  const chaves = new Set<string>();
  txs.forEach((t) => chaves.add(competenciaDe(t)));
  return Array.from(chaves).filter(Boolean).sort();
}

// Projeção de juros compostos com aporte mensal.
// FV = P*(1+i)^n + PMT*[((1+i)^n - 1)/i], i = taxa mensal equivalente.
function projetar(inicial: number, aporteMensal: number, taxaAnualPct: number, meses: number) {
  const i = Math.pow(1 + taxaAnualPct / 100, 1 / 12) - 1;
  const pontos: { mes: number; total: number; aportado: number }[] = [];
  let saldo = inicial;
  let aportado = inicial;
  pontos.push({ mes: 0, total: saldo, aportado });
  for (let m = 1; m <= meses; m++) {
    saldo = saldo * (1 + i) + aporteMensal;
    aportado += aporteMensal;
    pontos.push({ mes: m, total: saldo, aportado });
  }
  return pontos;
}

export function InvestimentosScreen() {
  const [loading, setLoading] = useState(true);
  const [todasTransacoes, setTodasTransacoes] = useState<Transacao[]>([]);

  // Simulador
  const [inicial, setInicial] = useState('1000');
  const [aporteMensal, setAporteMensal] = useState('300');
  const [taxaAnual, setTaxaAnual] = useState(11);
  const [prazoAnos, setPrazoAnos] = useState(10);

  // Reserva de emergência (o quanto já existe hoje é informado pelo usuário,
  // já que o app não rastreia saldo investido — só entradas/saídas do dia a dia).
  const [reservaAtual, setReservaAtual] = useState<string>(() => localStorage.getItem(STORAGE_RESERVA) || '0');

  useEffect(() => {
    load();
    const cancelar = apiService.onDadosAtualizados(() => load());
    return cancelar;
  }, []);

  const load = async () => {
    try {
      const todas = await apiService.getTransacoes();
      setTodasTransacoes(todas);
    } finally {
      setLoading(false);
    }
  };

  const salvarReserva = (v: string) => {
    setReservaAtual(v);
    localStorage.setItem(STORAGE_RESERVA, v);
  };

  // --- Análise dos últimos meses reais ---
  const analise = useMemo(() => {
    const meses = ultimosMesesComDados(todasTransacoes).slice(-6); // até 6 últimos meses com dados
    const porMes = meses.map((chave) => {
      const doMes = todasTransacoes.filter((t) => competenciaDe(t) === chave);
      const receitas = doMes.filter(receitaRealizada).reduce((s, t) => s + t.valor, 0);
      const despesas = doMes.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
      return { chave, receitas, despesas, sobra: receitas - despesas };
    });

    const totalDespesas = porMes.reduce((s, m) => s + m.despesas, 0);
    const totalReceitas = porMes.reduce((s, m) => s + m.receitas, 0);
    const mediaDespesas = porMes.length ? totalDespesas / porMes.length : 0;
    const mediaReceitas = porMes.length ? totalReceitas / porMes.length : 0;
    const mediaSobra = mediaReceitas - mediaDespesas;
    const taxaPoupanca = mediaReceitas > 0 ? (mediaSobra / mediaReceitas) * 100 : null;

    // Maior categoria de gasto no total do período analisado
    const porCategoria = new Map<string, number>();
    todasTransacoes
      .filter((t) => t.tipo === 'despesa' && meses.includes(competenciaDe(t)))
      .forEach((t) => porCategoria.set(t.categoriaId, (porCategoria.get(t.categoriaId) || 0) + t.valor));
    let maiorCategoria: { nome: string; valor: number } | null = null;
    porCategoria.forEach((valor, nome) => {
      if (!maiorCategoria || valor > maiorCategoria.valor) maiorCategoria = { nome, valor };
    });

    return { porMes, mediaDespesas, mediaReceitas, mediaSobra, taxaPoupanca, maiorCategoria, mesesAnalisados: meses.length };
  }, [todasTransacoes]);

  // --- Receita do negócio (aba "A receber 2026"): recebido x pendente ---
  const negocio = useMemo(() => {
    const receitas = todasTransacoes.filter((t) => t.tipo === 'receita');
    const recebido = receitas.filter(receitaRealizada);
    const pendente = receitas.filter((t) => !receitaRealizada(t) && t.situacao !== 'Cancelado');

    const porServico = new Map<string, number>();
    recebido.forEach((t) => porServico.set(t.categoriaId, (porServico.get(t.categoriaId) || 0) + t.valor));

    return {
      totalRecebido: recebido.reduce((s, t) => s + t.valor, 0),
      totalPendente: pendente.reduce((s, t) => s + t.valor, 0),
      qtdPendente: pendente.length,
      porServico: Array.from(porServico.entries())
        .map(([nome, valor]) => ({ nome, valor }))
        .sort((a, b) => b.valor - a.valor),
    };
  }, [todasTransacoes]);

  // --- Reserva de emergência: alvo = 6x a média de despesas mensais ---
  const metaMeses = 6;
  const metaReserva = analise.mediaDespesas * metaMeses;
  const reservaNum = parseFloat(reservaAtual.replace(',', '.')) || 0;
  const pctReserva = metaReserva > 0 ? Math.min(100, (reservaNum / metaReserva) * 100) : 0;
  const faltaReserva = Math.max(0, metaReserva - reservaNum);
  const mesesParaCompletarReserva =
    analise.mediaSobra > 0 && faltaReserva > 0 ? Math.ceil(faltaReserva / analise.mediaSobra) : null;

  // --- Sugestão de aporte mensal para o simulador = 80% da sobra média (mantém folga) ---
  const aporteSugerido = analise.mediaSobra > 0 ? Math.round(analise.mediaSobra * 0.8) : 0;

  const dadosProjecao = useMemo(() => {
    const ini = parseFloat(inicial.replace(',', '.')) || 0;
    const aporte = parseFloat(aporteMensal.replace(',', '.')) || 0;
    return projetar(ini, aporte, taxaAnual, prazoAnos * 12);
  }, [inicial, aporteMensal, taxaAnual, prazoAnos]);

  const dadosGrafico = useMemo(() => {
    // Amostra por trimestre para não poluir o gráfico em prazos longos.
    const passo = prazoAnos <= 5 ? 1 : 3;
    return dadosProjecao
      .filter((p) => p.mes % passo === 0 || p.mes === dadosProjecao.length - 1)
      .map((p) => ({
        periodo: p.mes === 0 ? 'Hoje' : `${Math.floor(p.mes / 12)}a ${p.mes % 12}m`,
        Total: Math.round(p.total),
        Aportado: Math.round(p.aportado),
      }));
  }, [dadosProjecao, prazoAnos]);

  const final = dadosProjecao[dadosProjecao.length - 1];
  const rendimentoTotal = final ? final.total - final.aportado : 0;

  const insights: { texto: string; tipo: 'ok' | 'alerta' | 'info' }[] = [];
  if (analise.mesesAnalisados === 0) {
    insights.push({ texto: 'Ainda não há lançamentos suficientes para calcular sua saúde financeira.', tipo: 'info' });
  } else {
    if (analise.taxaPoupanca !== null) {
      if (analise.taxaPoupanca >= 20) {
        insights.push({ texto: `Você está guardando ${analise.taxaPoupanca.toFixed(0)}% do que recebe — excelente disciplina! 👏`, tipo: 'ok' });
      } else if (analise.taxaPoupanca >= 0) {
        insights.push({ texto: `Sua taxa de poupança está em ${analise.taxaPoupanca.toFixed(0)}%. O recomendado é buscar ao menos 20%.`, tipo: 'alerta' });
      } else {
        insights.push({ texto: 'Nos últimos meses suas despesas superaram as receitas registradas. Vale revisar os gastos antes de investir.', tipo: 'alerta' });
      }
    }
    if (analise.maiorCategoria) {
      insights.push({
        texto: `Sua maior categoria de gasto no período foi "${analise.maiorCategoria.nome}" (${fmt(analise.maiorCategoria.valor)}). Um corte de 10% ali liberaria ${fmt(analise.maiorCategoria.valor * 0.1)}/mês para investir.`,
        tipo: 'info',
      });
    }
    if (pctReserva >= 100) {
      insights.push({ texto: 'Sua reserva de emergência está completa! Hora de focar em investimentos de maior rendimento.', tipo: 'ok' });
    } else if (mesesParaCompletarReserva !== null) {
      insights.push({
        texto: `Mantendo a sobra média atual, você completa sua reserva de emergência em ~${mesesParaCompletarReserva} meses.`,
        tipo: 'info',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Carregando análise financeira...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Investir &amp; Planejar</h1>

      {/* Saúde financeira */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-gray-500 text-xs font-medium">Receita média/mês</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmtCompacto(analise.mediaReceitas)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-gray-500 text-xs font-medium">Despesa média/mês</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{fmtCompacto(analise.mediaDespesas)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-gray-500 text-xs font-medium">Sobra média/mês</p>
          <p className={`text-2xl font-bold mt-1 ${analise.mediaSobra >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {fmtCompacto(analise.mediaSobra)}
          </p>
          {analise.taxaPoupanca !== null && (
            <p className="text-xs text-gray-500 mt-1">{analise.taxaPoupanca.toFixed(0)}% da receita</p>
          )}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
          <h3 className="font-semibold text-indigo-900 mb-3">💡 Diagnóstico</h3>
          <ul className="space-y-2 text-sm">
            {insights.map((ins, i) => (
              <li
                key={i}
                className={
                  ins.tipo === 'ok' ? 'text-green-800' : ins.tipo === 'alerta' ? 'text-orange-800' : 'text-indigo-900'
                }
              >
                • {ins.texto}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Receita do negócio (A receber 2026) */}
      {(negocio.totalRecebido > 0 || negocio.totalPendente > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-1">💼 Receita do negócio</h3>
          <p className="text-sm text-gray-500 mb-4">Da aba "A receber 2026" — consultoria, testes e parcerias.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-green-700 font-medium">Já recebido</p>
              <p className="text-xl font-bold text-green-800">{fmt(negocio.totalRecebido)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-xs text-yellow-700 font-medium">
                A receber ({negocio.qtdPendente} cobrança{negocio.qtdPendente === 1 ? '' : 's'} em aberto)
              </p>
              <p className="text-xl font-bold text-yellow-800">{fmt(negocio.totalPendente)}</p>
            </div>
          </div>

          {negocio.porServico.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Recebido por tipo de serviço</p>
              {negocio.porServico.map((s) => (
                <div key={s.nome} className="flex justify-between text-sm border-b last:border-b-0 py-1.5">
                  <span className="text-gray-700">{s.nome.replace('Receita: ', '')}</span>
                  <span className="font-medium">{fmt(s.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reserva de emergência */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-1">🛟 Reserva de emergência</h3>
        <p className="text-sm text-gray-500 mb-4">
          Recomendação clássica: {metaMeses}x sua despesa mensal média, guardada em algo líquido e seguro.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quanto você já tem guardado hoje?</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">R$</span>
              <input
                type="number"
                value={reservaAtual}
                onChange={(e) => salvarReserva(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 sm:text-right">
            Meta ({metaMeses}x despesas): <span className="font-semibold text-gray-800">{fmt(metaReserva)}</span>
          </div>
        </div>

        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{fmt(reservaNum)} de {fmt(metaReserva)}</span>
          <span className="font-medium">{pctReserva.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${pctReserva >= 100 ? 'bg-green-500' : pctReserva >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
            style={{ width: `${pctReserva}%` }}
          />
        </div>
      </div>

      {/* Simulador de investimento */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-1">📈 Simulador de investimento</h3>
        <p className="text-sm text-gray-500 mb-4">
          Projeção com juros compostos a partir dos valores abaixo. As taxas são{' '}
          <strong>estimativas ajustáveis</strong>, não cotações em tempo real — atualize para a taxa vigente antes de decidir.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor inicial (R$)</label>
            <input
              type="number"
              value={inicial}
              onChange={(e) => setInicial(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aporte mensal (R$)
              {aporteSugerido > 0 && (
                <button
                  type="button"
                  onClick={() => setAporteMensal(String(aporteSugerido))}
                  className="ml-2 text-xs text-blue-600 hover:underline"
                >
                  usar sugestão: {fmt(aporteSugerido)}
                </button>
              )}
            </label>
            <input
              type="number"
              value={aporteMensal}
              onChange={(e) => setAporteMensal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taxa anual estimada (%)</label>
            <input
              type="number"
              value={taxaAnual}
              onChange={(e) => setTaxaAnual(parseFloat(e.target.value) || 0)}
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {PRESETS_TAXA.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setTaxaAnual(p.taxa)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition ${
                    taxaAnual === p.taxa ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p.label} ({p.taxa}%)
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (anos)</label>
            <input
              type="number"
              value={prazoAnos}
              onChange={(e) => setPrazoAnos(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min="1"
              max="40"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Resultado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-700 font-medium">Total projetado</p>
            <p className="text-xl font-bold text-blue-900">{final ? fmt(final.total) : '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-medium">Total aportado</p>
            <p className="text-xl font-bold text-gray-800">{final ? fmt(final.aportado) : '—'}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-green-700 font-medium">Rendimento estimado</p>
            <p className="text-xl font-bold text-green-700">{fmt(rendimentoTotal)}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => fmtCompacto(v)} width={70} />
            <Tooltip formatter={(v) => fmt(Number(v))} />
            <Legend />
            <Line type="monotone" dataKey="Total" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Aportado" stroke="#9ca3af" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
