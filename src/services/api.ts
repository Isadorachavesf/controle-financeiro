import { Transacao, Categoria, DashboardData, SincronizacaoStatus } from '@/types/index';

// ---------------------------------------------------------------------------
// Camada de dados do aplicativo.
//
// Dois modos, com a MESMA interface para as telas:
//
//  • Conectado à planilha: quando a URL do Google Apps Script está configurada,
//    a planilha do Google é a fonte de verdade. Leituras buscam da planilha;
//    escritas vão para a planilha. Um cache em localStorage mantém o app
//    utilizável mesmo sem internet.
//
//  • Local (sem conexão): se a URL não estiver configurada, os dados ficam
//    apenas no navegador (localStorage). O app funciona na hora e a conexão
//    com a planilha pode ser feita depois, na tela "Sincronizar".
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  transacoes: 'cf_transacoes',
  categorias: 'cf_categorias',
  appsScriptUrl: 'cf_apps_script_url',
};

const CATEGORIAS_PADRAO: Categoria[] = [
  { id: '1', nome: 'Combustível', limiteMensal: 600, corGrafico: '#3b82f6', criadoEm: new Date().toISOString() },
  { id: '2', nome: 'Comida', limiteMensal: 800, corGrafico: '#ef4444', criadoEm: new Date().toISOString() },
  { id: '3', nome: 'Energia', limiteMensal: 300, corGrafico: '#10b981', criadoEm: new Date().toISOString() },
  { id: '4', nome: 'Internet', limiteMensal: 150, corGrafico: '#f59e0b', criadoEm: new Date().toISOString() },
  { id: '5', nome: 'Academia', limiteMensal: 200, corGrafico: '#8b5cf6', criadoEm: new Date().toISOString() },
];

const CACHE_TTL_MS = 8000;

// URL padrão do App da Web (Google Apps Script) da planilha da Isadora.
// Deixamos embutida para o app já vir CONECTADO em qualquer aparelho/endereço,
// sem precisar colar a URL manualmente. Pode ser sobrescrita na tela Sincronizar
// (o valor colado fica salvo no aparelho e tem prioridade).
const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxrrvY_hiJif6oC8EvX2lwSbTWML0bqpdDmms318C7141TzXX4szQkV4nKhwsUeAUnzyA/exec';

function gerarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- Configuração da conexão com a planilha ---
export function getAppsScriptUrl(): string {
  const salva = localStorage.getItem(STORAGE_KEYS.appsScriptUrl);
  if (salva === '__desconectado__') return '';
  return salva || DEFAULT_APPS_SCRIPT_URL;
}
export function setAppsScriptUrl(url: string): void {
  const limpa = url.trim();
  if (limpa) localStorage.setItem(STORAGE_KEYS.appsScriptUrl, limpa);
  // string vazia = desconectar de propósito (mesmo havendo URL embutida)
  else localStorage.setItem(STORAGE_KEYS.appsScriptUrl, '__desconectado__');
  cache.loadedAt = 0; // invalida cache ao (des)conectar
}
export function isConectado(): boolean {
  return !!getAppsScriptUrl();
}

// --- Cache local ---
interface Cache {
  categorias: Categoria[];
  transacoes: Transacao[];
  loadedAt: number;
}
const cache: Cache = { categorias: [], transacoes: [], loadedAt: 0 };

function lerCacheLocal(): { categorias: Categoria[]; transacoes: Transacao[] } {
  let categorias: Categoria[];
  try {
    categorias = JSON.parse(localStorage.getItem(STORAGE_KEYS.categorias) || '');
    if (!Array.isArray(categorias) || categorias.length === 0) categorias = [...CATEGORIAS_PADRAO];
  } catch {
    categorias = [...CATEGORIAS_PADRAO];
  }
  let transacoes: Transacao[];
  try {
    transacoes = JSON.parse(localStorage.getItem(STORAGE_KEYS.transacoes) || '[]');
    if (!Array.isArray(transacoes)) transacoes = [];
  } catch {
    transacoes = [];
  }
  return { categorias, transacoes };
}

function salvarCacheLocal(): void {
  localStorage.setItem(STORAGE_KEYS.categorias, JSON.stringify(cache.categorias));
  localStorage.setItem(STORAGE_KEYS.transacoes, JSON.stringify(cache.transacoes));
}

// --- Comunicação com o Apps Script ---
const TIMEOUT_MS = 20000;

async function chamarRemoto(action: string, payload?: any): Promise<any> {
  const url = getAppsScriptUrl();
  if (!url) throw new Error('Planilha não conectada');

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);
  try {
    const isLeitura = action === 'bootstrap' || action.startsWith('get');
    let resp: Response;
    if (isLeitura) {
      resp = await fetch(`${url}?action=${encodeURIComponent(action)}&t=${Date.now()}`, {
        method: 'GET',
        redirect: 'follow',
        signal: controle.signal,
      });
    } else {
      // text/plain evita a verificação CORS (preflight), que o Apps Script não trata.
      resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload }),
        redirect: 'follow',
        signal: controle.signal,
      });
    }
    if (!resp.ok) throw new Error(`Erro de rede (${resp.status})`);
    const data = await resp.json();
    if (!data.success) throw new Error(data.error || 'Erro no servidor da planilha');
    return data.data;
  } finally {
    clearTimeout(timer);
  }
}

// --- Assinantes para atualizações em segundo plano ---
const ouvintes: Array<() => void> = [];
export function onDadosAtualizados(cb: () => void): () => void {
  ouvintes.push(cb);
  return () => {
    const i = ouvintes.indexOf(cb);
    if (i >= 0) ouvintes.splice(i, 1);
  };
}
function notificar(): void {
  ouvintes.forEach((cb) => {
    try { cb(); } catch { /* ignora */ }
  });
}

// Carrega o cache local (rápido, síncrono) na primeira vez.
function garantirCacheLocalSync(): void {
  if (cache.loadedAt === 0 && cache.transacoes.length === 0 && cache.categorias.length === 0) {
    const local = lerCacheLocal();
    cache.categorias = local.categorias;
    cache.transacoes = local.transacoes;
  }
}

// Uma única busca da planilha compartilhada entre chamadas simultâneas.
let cargaEmAndamento: Promise<void> | null = null;
function buscarDaRede(): Promise<void> {
  if (!cargaEmAndamento) {
    cargaEmAndamento = (async () => {
      const remoto = await chamarRemoto('bootstrap');
      cache.categorias = remoto.categorias || [];
      cache.transacoes = (remoto.transacoes || []).filter(ehDeAbaMensal);
      cache.loadedAt = Date.now();
      salvarCacheLocal();
    })().finally(() => { cargaEmAndamento = null; });
  }
  return cargaEmAndamento;
}
function atualizarEmBackground(): void {
  if (!isConectado()) return;
  buscarDaRede().then(notificar).catch(() => { /* mantém cache */ });
}

// Estratégia "mostra o cache na hora, atualiza em segundo plano".
// Só espera a rede na primeira carga (quando não há nada em cache) ou se forçado.
async function carregarSeguro(forcar = false): Promise<void> {
  garantirCacheLocalSync();
  if (!isConectado()) return;

  const temCache = cache.loadedAt > 0 || cache.transacoes.length > 0 || cache.categorias.length > 0;
  const fresco = cache.loadedAt > 0 && Date.now() - cache.loadedAt < CACHE_TTL_MS;

  if (forcar || !temCache) {
    try { await buscarDaRede(); } catch { /* usa cache local */ }
  } else if (!fresco) {
    atualizarEmBackground();
  }
}

function comNomeCategoria(tx: Transacao): Transacao {
  const cat = cache.categorias.find((c) => c.id === tx.categoriaId);
  return { ...tx, categoriaNome: cat?.nome };
}

// Mês de referência (competência) de uma transação. Prioridade:
//  1) campo competencia enviado pela planilha;
//  2) nome da aba embutido no id ("Julho 2026||13" → 2026-07);
//  3) mês da própria data.
// Assim os totais do app batem com as abas mensais da planilha.
const MESES_PT_NORM = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
function normalizarTexto(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function competenciaDeNomeAba(nome: string): string {
  const n = normalizarTexto(nome);
  for (let i = 0; i < MESES_PT_NORM.length; i++) {
    if (n.indexOf(MESES_PT_NORM[i]) >= 0) {
      const ano = (nome.match(/(20\d{2})/) || [])[1];
      if (ano) return `${ano}-${String(i + 1).padStart(2, '0')}`;
    }
  }
  return '';
}
export function competenciaDe(tx: Transacao): string {
  if (tx.competencia) return tx.competencia;
  if (tx.id && tx.id.indexOf('||') >= 0) {
    const c = competenciaDeNomeAba(tx.id.split('||')[0]);
    if (c) return c;
  }
  return tx.dataTransacao ? tx.dataTransacao.slice(0, 7) : '';
}

// Mantém apenas lançamentos das ABAS DE MÊS. Ignora linhas vindas de abas
// auxiliares da planilha ("Base de dados", "A receber 2026", "CNPJs clientes"…),
// que consolidam/duplicam dados e inflavam os totais. Lançamentos locais
// (id sem "||") são sempre mantidos.
function ehDeAbaMensal(tx: Transacao): boolean {
  if (!tx.id || tx.id.indexOf('||') < 0) return true;
  return competenciaDeNomeAba(tx.id.split('||')[0]) !== '';
}
function pertenceAo(tx: Transacao, mes: number, ano: number): boolean {
  return competenciaDe(tx) === `${ano}-${String(mes).padStart(2, '0')}`;
}

class ApiService {
  // Exponibiliza estado da conexão para as telas
  isConectado = isConectado;
  getAppsScriptUrl = getAppsScriptUrl;
  onDadosAtualizados = onDadosAtualizados;

  async conectarPlanilha(url: string): Promise<void> {
    setAppsScriptUrl(url);
    await buscarDaRede(); // valida a URL buscando dados
  }

  desconectarPlanilha(): void {
    setAppsScriptUrl('');
  }

  // --- Transacoes ---
  async getTransacoes(mes?: number, ano?: number, categoriaId?: string): Promise<Transacao[]> {
    await carregarSeguro();
    let txs = cache.transacoes;
    if (mes !== undefined && ano !== undefined) {
      txs = txs.filter((t) => pertenceAo(t, mes, ano));
    }
    if (categoriaId) txs = txs.filter((t) => t.categoriaId === categoriaId);
    return txs
      .slice()
      .sort((a, b) => new Date(b.dataTransacao).getTime() - new Date(a.dataTransacao).getTime())
      .map(comNomeCategoria);
  }

  async createTransacao(data: Omit<Transacao, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Transacao> {
    await carregarSeguro();
    let tx: Transacao;
    if (isConectado()) {
      tx = await chamarRemoto('createTransacao', data);
    } else {
      const now = new Date().toISOString();
      tx = { ...(data as any), id: gerarId(), criadoEm: now, atualizadoEm: now };
    }
    cache.transacoes.push(tx);
    salvarCacheLocal();
    return comNomeCategoria(tx);
  }

  async updateTransacao(id: string, data: Partial<Transacao>): Promise<Transacao> {
    await carregarSeguro();
    const idx = cache.transacoes.findIndex((t) => t.id === id);
    let tx: Transacao;
    if (isConectado()) {
      tx = await chamarRemoto('updateTransacao', { id, ...data });
    } else {
      if (idx === -1) throw new Error('Transação não encontrada');
      tx = { ...cache.transacoes[idx], ...data, id, atualizadoEm: new Date().toISOString() };
    }
    if (idx === -1) cache.transacoes.push(tx);
    else cache.transacoes[idx] = tx;
    salvarCacheLocal();
    return comNomeCategoria(tx);
  }

  async deleteTransacao(id: string): Promise<void> {
    await carregarSeguro();
    if (isConectado()) await chamarRemoto('deleteTransacao', { id });
    cache.transacoes = cache.transacoes.filter((t) => t.id !== id);
    salvarCacheLocal();
  }

  // --- Categorias ---
  async getCategorias(): Promise<Categoria[]> {
    await carregarSeguro();
    return cache.categorias.slice();
  }

  async createCategoria(data: Omit<Categoria, 'id' | 'criadoEm'>): Promise<Categoria> {
    await carregarSeguro();
    let cat: Categoria;
    if (isConectado()) {
      cat = await chamarRemoto('createCategoria', data);
    } else {
      cat = { ...(data as any), id: gerarId(), criadoEm: new Date().toISOString() };
    }
    cache.categorias.push(cat);
    salvarCacheLocal();
    return cat;
  }

  async updateCategoria(id: string, data: Partial<Categoria>): Promise<Categoria> {
    await carregarSeguro();
    const idx = cache.categorias.findIndex((c) => c.id === id);
    let cat: Categoria;
    if (isConectado()) {
      cat = await chamarRemoto('updateCategoria', { id, ...data });
    } else {
      if (idx === -1) throw new Error('Categoria não encontrada');
      cat = { ...cache.categorias[idx], ...data, id };
    }
    if (idx === -1) cache.categorias.push(cat);
    else cache.categorias[idx] = cat;
    salvarCacheLocal();
    return cat;
  }

  // --- Dashboard ---
  async getDashboard(mes: number, ano: number): Promise<DashboardData> {
    await carregarSeguro();
    const txsMes = cache.transacoes.filter((t) => pertenceAo(t, mes, ano));

    const totalReceitas = txsMes.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
    const totalDespesas = txsMes.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

    const porCategoria = cache.categorias.map((categoria) => {
      const gasto = txsMes
        .filter((t) => t.categoriaId === categoria.id && t.tipo === 'despesa')
        .reduce((s, t) => s + t.valor, 0);
      return {
        categoria,
        gasto,
        percentualDoLimite: categoria.limiteMensal > 0 ? (gasto / categoria.limiteMensal) * 100 : 0,
      };
    });

    const alertas = porCategoria
      .filter((item) => item.percentualDoLimite >= 80)
      .map((item) => ({
        categoriaId: item.categoria.id,
        categoriaNome: item.categoria.nome,
        percentual: item.percentualDoLimite,
        limite: item.categoria.limiteMensal,
        gasto: item.gasto,
      }));

    const ultimasTransacoes = txsMes
      .slice()
      .sort((a, b) => new Date(b.dataTransacao).getTime() - new Date(a.dataTransacao).getTime())
      .slice(0, 5)
      .map(comNomeCategoria);

    return {
      mes,
      ano,
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      porCategoria,
      alertas,
      ultimasTransacoes,
    };
  }

  // --- Sincronização ---
  async triggerSync(): Promise<SincronizacaoStatus> {
    try {
      await buscarDaRede(); // força buscar da planilha
      return {
        status: 'sucesso',
        ultimaSincronizacao: new Date().toISOString(),
        transacoesSincronizadas: cache.transacoes.length,
      };
    } catch (e: any) {
      return {
        status: 'erro',
        ultimaSincronizacao: new Date().toISOString(),
        motivoErro: e?.message || 'Falha ao sincronizar',
      };
    }
  }

  async getSyncStatus(): Promise<SincronizacaoStatus> {
    return {
      status: isConectado() ? 'sucesso' : 'pendente',
      ultimaSincronizacao: cache.loadedAt ? new Date(cache.loadedAt).toISOString() : undefined,
      transacoesSincronizadas: cache.transacoes.length,
    };
  }
}

export const apiService = new ApiService();
