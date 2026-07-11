import axios from 'axios';
const API_BASE_URL = process.env.VITE_API_URL || '/api';
class ApiService {
    constructor() {
        Object.defineProperty(this, "api", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
    async verifyPin(pin) {
        const response = await this.api.post('/verify-pin', { pin });
        if (response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('token_expires_at', String(Date.now() + (response.data.expiresIn || 900000)));
        }
        return response.data;
    }
    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_expires_at');
    }
    isTokenValid() {
        const expiresAt = localStorage.getItem('token_expires_at');
        if (!expiresAt)
            return false;
        return Date.now() < parseInt(expiresAt, 10);
    }
    // Transacoes
    async getTransacoes(mes, ano, categoriaId) {
        const params = new URLSearchParams();
        if (mes !== undefined)
            params.append('mes', String(mes));
        if (ano !== undefined)
            params.append('ano', String(ano));
        if (categoriaId)
            params.append('categoria_id', categoriaId);
        const response = await this.api.get('/transacoes', { params });
        return response.data;
    }
    async createTransacao(data) {
        const response = await this.api.post('/transacoes', data);
        return response.data;
    }
    async updateTransacao(id, data) {
        const response = await this.api.put(`/transacoes/${id}`, data);
        return response.data;
    }
    async deleteTransacao(id) {
        await this.api.delete(`/transacoes/${id}`);
    }
    // Categorias
    async getCategorias() {
        const response = await this.api.get('/categorias');
        return response.data;
    }
    async createCategoria(data) {
        const response = await this.api.post('/categorias', data);
        return response.data;
    }
    async updateCategoria(id, data) {
        const response = await this.api.put(`/categorias/${id}`, data);
        return response.data;
    }
    // Dashboard
    async getDashboard(mes, ano) {
        const response = await this.api.get('/dashboard', {
            params: { mes, ano },
        });
        return response.data;
    }
    // Sincronizacao
    async triggerSync() {
        const response = await this.api.post('/sync-sheets');
        return response.data;
    }
    async getSyncStatus() {
        const response = await this.api.get('/sync-status');
        return response.data;
    }
}
export const apiService = new ApiService();
