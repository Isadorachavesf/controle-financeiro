import { ReactNode } from 'react';
interface LayoutProps {
    children: ReactNode;
    currentScreen: 'dashboard' | 'transacoes' | 'orcamento' | 'sincronizacao';
    onNavigate: (screen: string) => void;
    onLogout: () => void;
    syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
}
export declare function Layout({ children, currentScreen, onNavigate, onLogout, syncStatus, }: LayoutProps): any;
export {};
//# sourceMappingURL=Layout.d.ts.map