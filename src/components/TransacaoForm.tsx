import React, { useState, useEffect } from 'react';
import { Transacao, Categoria } from '@types/index';

interface TransacaoFormProps {
  transacao?: Transacao;
  categorias: Categoria[];
  onSave: (data: Omit<Transacao, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TransacaoForm({ transacao, categorias, onSave, onCancel, isLoading }: TransacaoFormProps) {
  const [formData, setFormData] = useState({
    categoriaId: transacao?.categoriaId || '',
    descricao: transacao?.descricao || '',
    valor: transacao?.valor.toString() || '',
    dataTransacao: transacao?.dataTransacao || new Date().toISOString().split('T')[0],
    tipo: transacao?.tipo || 'despesa',
    metodoPagamento: transacao?.metodoPagamento || 'cartao',
    notas: transacao?.notas || '',
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoriaId || !formData.descricao || !formData.valor || !formData.dataTransacao) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    const valor = parseFloat(formData.valor);
    if (isNaN(valor) || valor <= 0) {
      setError('Valor deve ser um número positivo');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        categoriaId: formData.categoriaId,
        descricao: formData.descricao,
        valor,
        dataTransacao: formData.dataTransacao,
        tipo: formData.tipo as 'receita' | 'despesa',
        metodoPagamento: formData.metodoPagamento as any,
        notas: formData.notas || undefined,
      });
    } catch (err) {
      setError('Erro ao salvar transação');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        {transacao ? 'Editar Transação' : 'Nova Transação'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
            <input
              type="date"
              name="dataTransacao"
              value={formData.dataTransacao}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              name="categoriaId"
              value={formData.categoriaId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <input
              type="text"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Ex: Gasolina no posto"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>

          {/* Método de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
            <select
              name="metodoPagamento"
              value={formData.metodoPagamento}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="transferencia">Transferência</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              placeholder="Notas adicionais (opcional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Buttons */}
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
