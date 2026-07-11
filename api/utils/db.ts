// Mock database for demo purposes
// In production, this should use Supabase, Firebase, or your preferred database

export interface DbTransaction {
  id: string;
  categoriaId: string;
  descricao: string;
  valor: number;
  dataTransacao: string;
  tipo: 'receita' | 'despesa';
  metodoPagamento: string;
  notas?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface DbCategoria {
  id: string;
  nome: string;
  limiteMensal: number;
  corGrafico: string;
  criadoEm: string;
}

// In-memory storage (use real database in production)
let transacoes: DbTransaction[] = [
  {
    id: '1',
    categoriaId: '1',
    descricao: 'Gasolina no posto',
    valor: 150,
    dataTransacao: '2026-06-20',
    tipo: 'despesa',
    metodoPagamento: 'cartao',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
];

let categorias: DbCategoria[] = [
  { id: '1', nome: 'Combustível', limiteMensal: 600, corGrafico: '#3b82f6', criadoEm: '' },
  { id: '2', nome: 'Comida', limiteMensal: 800, corGrafico: '#ef4444', criadoEm: '' },
  { id: '3', nome: 'Energia', limiteMensal: 300, corGrafico: '#10b981', criadoEm: '' },
  { id: '4', nome: 'Internet', limiteMensal: 150, corGrafico: '#f59e0b', criadoEm: '' },
  { id: '5', nome: 'Academia', limiteMensal: 200, corGrafico: '#8b5cf6', criadoEm: '' },
];

export const db = {
  // Transacoes
  getTransacoes: (mes: number, ano: number) => {
    return transacoes.filter((t) => {
      const date = new Date(t.dataTransacao);
      return date.getMonth() === mes - 1 && date.getFullYear() === ano;
    });
  },

  createTransacao: (data: Omit<DbTransaction, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const tx: DbTransaction = {
      ...data,
      id,
      criadoEm: now,
      atualizadoEm: now,
    };
    transacoes.push(tx);
    return tx;
  },

  updateTransacao: (id: string, data: Partial<DbTransaction>) => {
    const idx = transacoes.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const updated = {
      ...transacoes[idx],
      ...data,
      id: transacoes[idx].id,
      criadoEm: transacoes[idx].criadoEm,
      atualizadoEm: new Date().toISOString(),
    };
    transacoes[idx] = updated;
    return updated;
  },

  deleteTransacao: (id: string) => {
    transacoes = transacoes.filter((t) => t.id !== id);
  },

  // Categorias
  getCategorias: () => categorias,

  createCategoria: (data: Omit<DbCategoria, 'id' | 'criadoEm'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const cat: DbCategoria = {
      ...data,
      id,
      criadoEm: new Date().toISOString(),
    };
    categorias.push(cat);
    return cat;
  },

  updateCategoria: (id: string, data: Partial<DbCategoria>) => {
    const idx = categorias.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated = { ...categorias[idx], ...data, id };
    categorias[idx] = updated;
    return updated;
  },

  // Dashboard
  getDashboard: (mes: number, ano: number) => {
    const monthTransacoes = transacoes.filter((t) => {
      const date = new Date(t.dataTransacao);
      return date.getMonth() === mes - 1 && date.getFullYear() === ano;
    });

    const receitas = monthTransacoes
      .filter((t) => t.tipo === 'receita')
      .reduce((sum, t) => sum + t.valor, 0);

    const despesas = monthTransacoes
      .filter((t) => t.tipo === 'despesa')
      .reduce((sum, t) => sum + t.valor, 0);

    const porCategoria = categorias.map((cat) => {
      const gasto = monthTransacoes
        .filter((t) => t.categoriaId === cat.id && t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);

      return {
        categoria: cat,
        gasto,
        percentualDoLimite: (gasto / cat.limiteMensal) * 100,
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

    return {
      mes,
      ano,
      totalReceitas: receitas,
      totalDespesas: despesas,
      saldo: receitas - despesas,
      porCategoria,
      alertas,
      ultimasTransacoes: monthTransacoes.sort((a, b) =>
        new Date(b.dataTransacao).getTime() - new Date(a.dataTransacao).getTime()
      ).slice(0, 5),
    };
  },
};
