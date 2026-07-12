import React, { useState } from 'react';
import { Transacao, Categoria, FORMAS_PAGAMENTO, QUEM_OPCOES } from '@/types/index';

interface TransacaoFormProps {
  transacao?: Transacao;
  categorias: Categoria[];
  onSave: (data: Omit<Transacao, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Deriva "Parcela" (ex.: "À vista" ou "1/3") a partir dos campos do formulário.
function montarParcela(parcelado: boolean, numParcelas: string, parcelaExistente?: string): string {
  if (!parcelado) return 'À vista';
  const n = parseInt(numParcelas, 10);
  if (!n || n < 2) return 'À vista';
  // Se estiver editando e já houver "x/y", preserva a parcela atual (x).
  const atual = parcelaExistente && /^(\d+)\/(\d+)$/.exec(parcelaExistente);
  const x = atual ? atual[1] : '1';
  return `${x}/${n}`;
}

export function TransacaoForm({ transacao, categorias, onSave, onCancel, isLoading }: TransacaoFormProps) {
  const parcelaInicial = transacao?.parcela || '';
  const ehParcelado = /^(\d+)\/(\d+)$/.test(parcelaInicial);

  const [formData, setFormData] = useState({
    dataTransacao: transacao?.dataTransacao || new Date().toISOString().split('T')[0],
    valor: transacao?.valor?.toString() || '',
    metodoPagamento: transacao?.metodoPagamento || FORMAS_PAGAMENTO[0],
    parcelado: ehParcelado,
    numParcelas: ehParcelado ? (parcelaInicial.split('/')[1] || '') : '',
    descricao: transacao?.descricao || '',
    categoriaId: transacao?.categoriaId || '',
    quem: transacao?.quem || QUEM_OPCOES[0],
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (campo: string, valor: any) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoriaId || !formData.descricao || !formData.valor || !formData.dataTransacao) {
      setError('Preencha data, compra, valor e categoria.');
      return;
    }
    const valor = parseFloat(formData.valor.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      setError('O valor deve ser um número positivo.');
      return;
    }
    if (formData.parcelado && (!parseInt(formData.numParcelas, 10) || parseInt(formData.numParcelas, 10) < 2)) {
      setError('Informe o número de parcelas (2 ou mais).');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        dataTransacao: formData.dataTransacao,
        descricao: formData.descricao,
        valor,
        categoriaId: formData.categoriaId,
        tipo: 'despesa',
        metodoPagamento: formData.metodoPagamento,
        parcela: montarParcela(formData.parcelado, formData.numParcelas, transacao?.parcela),
        quem: formData.quem,
      });
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{transacao ? 'Editar lançamento' : 'Novo lançamento'}</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data da compra (única) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data da compra *</label>
            <input
              type="date"
              value={formData.dataTransacao}
              onChange={(e) => set('dataTransacao', e.target.value)}
              className={inputCls}
              required
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">R$</span>
              <input
                type="number"
                value={formData.valor}
                onChange={(e) => set('valor', e.target.value)}
                step="0.01"
                min="0"
                placeholder="0,00"
                className={`${inputCls} pl-9`}
                required
              />
            </div>
          </div>

          {/* Compra (nome) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Compra *</label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Ex: Supermercado, Gasolina..."
              className={inputCls}
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              value={formData.categoriaId}
              onChange={(e) => set('categoriaId', e.target.value)}
              className={inputCls}
              required
            >
              <option value="">Selecione...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Compra feita por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compra feita por</label>
            <select value={formData.quem} onChange={(e) => set('quem', e.target.value)} className={inputCls}>
              {QUEM_OPCOES.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {/* Forma de pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento</label>
            <select
              value={formData.metodoPagamento}
              onChange={(e) => set('metodoPagamento', e.target.value)}
              className={inputCls}
            >
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Parcelado? */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parcelado?</label>
            <div className="flex gap-2">
              <select
                value={formData.parcelado ? 'sim' : 'nao'}
                onChange={(e) => set('parcelado', e.target.value === 'sim')}
                className={inputCls}
              >
                <option value="nao">Não (à vista)</option>
                <option value="sim">Sim</option>
              </select>
              {formData.parcelado && (
                <input
                  type="number"
                  value={formData.numParcelas}
                  onChange={(e) => set('numParcelas', e.target.value)}
                  min="2"
                  placeholder="Nº parcelas"
                  className={`${inputCls} w-32`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
