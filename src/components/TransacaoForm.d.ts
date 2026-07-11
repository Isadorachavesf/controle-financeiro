import { Transacao, Categoria } from '@types/index';
interface TransacaoFormProps {
    transacao?: Transacao;
    categorias: Categoria[];
    onSave: (data: Omit<Transacao, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}
export declare function TransacaoForm({ transacao, categorias, onSave, onCancel, isLoading }: TransacaoFormProps): any;
export {};
//# sourceMappingURL=TransacaoForm.d.ts.map