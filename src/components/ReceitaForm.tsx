import React, { useState } from 'react';
import { Transacao, OQUE_OPCOES, SITUACAO_OPCOES, CATEGORIA_RECEITA_PREFIXO } from '@/types/index';

interface ReceitaFormProps {
  transacao?: Transacao;
  onSave: (data: Omit<Transacao, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ReceitaForm({ transacao, onSave, onCancel, isLoading }: ReceitaFormProps) {
  const oqueInicial = transacao?.categoriaId?.replace(CATEGORIA_RECEITA_PREFIXO, '') || OQUE_OPCOES[0];

  const [formData, setFormData] = useState({
    dataTransacao: transacao?.dataTransacao || new Date().toISOString().split('T')[0],
    descricao: transacao?.descricao || '', // Cliente
    cidade: transacao?.cidade || '',
    oque: oqueInicial,
    candidato: transacao?.candidato || '',
    valor: transacao?.valor?.toString() || '',
    metodoPagamento: transacao?.metodoPagamento || '', // Via
    situacao: transacao?.situacao || SITUACAO_OPCOES[0],
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (campo: string, valor: any) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao || !formData.valor || !formData.dataTransacao) {
      setError('Preencha data, cliente e valor.');
      return;
    }
    const valor = parseFloat(formData.valor.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      setError('O valor deve ser um número positivo.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        dataTransacao: formData.dataTransacao,
        descricao: formData.descricao,
        cidade: formData.cidade || undefined,
        categoriaId: CATEGORIA_RECEITA_PREFIXO + formData.oque,
        candidato: formData.oque === 'Testes' ? formData.candidato : undefined,
        valor,
        tipo: 'receita',
        metodoPagamento: formData.metodoPagamento,
        situacao: formData.situacao,
      });
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        {transacao ? 'Editar recebimento' : 'Novo recebimento'} <span className="text-sm font-normal text-gray-500">(negócio)</span>
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
            <input
              type="date"
              value={formData.dataTransacao}
              onChange={(e) => set('dataTransacao', e.target.value)}
              className={inputCls}
              required
            />
          </div>

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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Ex: O Boticário, RR Contas..."
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input
              type="text"
              value={formData.cidade}
              onChange={(e) => set('cidade', e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">O que</label>
            <select value={formData.oque} onChange={(e) => set('oque', e.target.value)} className={inputCls}>
              {OQUE_OPCOES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {formData.oque === 'Testes' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Candidato</label>
              <input
                type="text"
                value={formData.candidato}
                onChange={(e) => set('candidato', e.target.value)}
                placeholder="Nome do candidato avaliado"
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Via (forma de recebimento)</label>
            <input
              type="text"
              value={formData.metodoPagamento}
              onChange={(e) => set('metodoPagamento', e.target.value)}
              placeholder="Ex: Pix, Boleto Nu..."
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Situação</label>
            <select value={formData.situacao} onChange={(e) => set('situacao', e.target.value)} className={inputCls}>
              {SITUACAO_OPCOES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || isLoading}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
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
