export type TipoTransacao = 'receita' | 'despesa';
export type StatusSincronizacao = 'pendente' | 'sucesso' | 'erro';
export type MetodoPagamento = 'cartao' | 'dinheiro' | 'transferencia' | 'outro';

export interface Categoria {
  id: string;
  nome: string;
  limiteMensal: number;
  corGrafico: string;
  criadoEm: string;
}

export interface Transacao {
  id: string;
  categoriaId: string;
  categoriaNome?: string;
  descricao: string;
  valor: number;
  dataTransacao: string; // ISO date (YYYY-MM-DD)
  competencia?: string; // mês de referência YYYY-MM (aba da planilha)
  tipo: TipoTransacao;
  metodoPagamento: string; // "Crédito PF" | "Débito / PIX / Boleto" | ...
  parcela?: string; // "À vista" ou "1/3"
  quem?: string; // Compra feita por: Isadora | Maria | Outros
  notas?: string;
  googleSheetsId?: string;
  criadoEm: string;
  atualizadoEm: string;
}

// Opções que espelham a aba "Lançamento" da planilha.
export const FORMAS_PAGAMENTO = ['Crédito PF', 'Débito / PIX / Boleto'];
export const QUEM_OPCOES = ['Isadora', 'Maria', 'Outros'];

export interface DashboardData {
  mes: number;
  ano: number;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  porCategoria: {
    categoria: Categoria;
    gasto: number;
    percentualDoLimite: number;
  }[];
  alertas: {
    categoriaId: string;
    categoriaNome: string;
    percentual: number;
    limite: number;
    gasto: number;
  }[];
  ultimasTransacoes: Transacao[];
}

export interface SincronizacaoStatus {
  status: StatusSincronizacao;
  ultimaSincronizacao?: string;
  proximaSincronizacaoAgendada?: string;
  motivoErro?: string;
  transacoesSincronizadas?: number;
}

export interface AuthSession {
  isAuthenticated: boolean;
  expiresAt: number;
}
