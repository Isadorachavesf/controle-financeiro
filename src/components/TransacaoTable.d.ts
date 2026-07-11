import { Transacao, Categoria } from '@types/index';
interface TransacaoTableProps {
    transacoes: Transacao[];
    categorias: Categoria[];
    onEdit: (tx: Transacao) => void;
    onDelete: (id: string) => void;
}
export declare function TransacaoTable({ transacoes, categorias, onEdit, onDelete }: TransacaoTableProps): any;
export {};
//# sourceMappingURL=TransacaoTable.d.ts.map