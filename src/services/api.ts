import axios, { AxiosInstance } from 'axios';
import { Transacao, Categoria, DashboardData, SincronizacaoStatus } from '@types/index';

const API_BASE_URL = process.env.VITE_API_URL || '/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth
  async verifyPin(pin: string): Promise<{ success: boolean; token?: string; expiresIn?: number }> {
    const response = await this.api.post('/verify-pin', { pin });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('token_expires_at', String(Date.now() + (response.data.expiresIn || 900000)));
    }
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expires_at');
  }

  isTokenValid(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return false;
    return Date.now() < parseInt(expiresAt, 10);
  }

  // Transacoes
  async getTransacoes(mes?: number, ano?: number, categoriaId?: string): Promise<Transacao[]> {
    const params = new URLSearchParams();
    if (mes !== undefined) params.append('mes', String(mes));
    if (ano !== undefined) params.append('ano', String(ano));
    if (categoriaId) params.append('categoria_id', categoriaId);

    const response = await this.api.get('/transacoes', { params });
    return response.data;
  }

  async createTransacao(data: Omit<Transacao, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Transacao> {
    const response = await this.api.post('/transacoes', data);
    return response.data;
  }

  async updateTransacao(id: string, data: Partial<Transacao>): Promise<Transacao> {
    const response = await this.api.put(`/transacoes/${id}`, data);
    return response.data;
  }

  async deleteTransacao(id: string): Promise<void> {
    await this.api.delete(`/transacoes/${id}`);
  }

  // Categorias
  async getCategorias(): Promise<Categoria[]> {
    const response = await this.api.get('/categorias');
    return response.data;
  }

  async createCategoria(data: Omit<Categoria, 'id' | 'criadoEm'>): Promise<Categoria> {
    const response = await this.api.post('/categorias', data);
    return response.data;
  }

  async updateCategoria(id: string, data: Partial<Categoria>): Promise<Categoria> {
    const response = await this.api.put(`/categorias/${id}`, data);
    return response.data;
  }

  // Dashboard
  async getDashboard(mes: number, ano: number): Promise<DashboardData> {
    const response = await this.api.get('/dashboard', {
      params: { mes, ano },
    });
    return response.data;
  }

  // Sincronizacao
  async triggerSync(): Promise<SincronizacaoStatus> {
    const response = await this.api.post('/sync-sheets');
    return response.data;
  }

  async getSyncStatus(): Promise<SincronizacaoStatus> {
    const response = await this.api.get('/sync-status');
    return response.data;
  }
}

export const apiService = new ApiService();
