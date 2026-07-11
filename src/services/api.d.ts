import { Transacao, Categoria, DashboardData, SincronizacaoStatus } from '@types/index';
declare class ApiService {
    private api;
    constructor();
    verifyPin(pin: string): Promise<{
        success: boolean;
        token?: string;
        expiresIn?: number;
    }>;
    logout(): void;
    isTokenValid(): boolean;
    getTransacoes(mes?: number, ano?: number, categoriaId?: string): Promise<Transacao[]>;
    createTransacao(data: Omit<Transacao, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Transacao>;
    updateTransacao(id: string, data: Partial<Transacao>): Promise<Transacao>;
    deleteTransacao(id: string): Promise<void>;
    getCategorias(): Promise<Categoria[]>;
    createCategoria(data: Omit<Categoria, 'id' | 'criadoEm'>): Promise<Categoria>;
    updateCategoria(id: string, data: Partial<Categoria>): Promise<Categoria>;
    getDashboard(mes: number, ano: number): Promise<DashboardData>;
    triggerSync(): Promise<SincronizacaoStatus>;
    getSyncStatus(): Promise<SincronizacaoStatus>;
}
export declare const apiService: ApiService;
export {};
//# sourceMappingURL=api.d.ts.map