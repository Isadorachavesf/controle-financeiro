import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
export function TransacaoForm({ transacao, categorias, onSave, onCancel, isLoading }) {
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
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };
    const handleSubmit = async (e) => {
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
                tipo: formData.tipo,
                metodoPagamento: formData.metodoPagamento,
                notas: formData.notas || undefined,
            });
        }
        catch (err) {
            setError('Erro ao salvar transação');
            console.error(err);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: transacao ? 'Editar Transação' : 'Nova Transação' }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Data *" }), _jsx("input", { type: "date", name: "dataTransacao", value: formData.dataTransacao, onChange: handleChange, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Categoria *" }), _jsxs("select", { name: "categoriaId", value: formData.categoriaId, onChange: handleChange, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", required: true, children: [_jsx("option", { value: "", children: "Selecione uma categoria" }), categorias.map((cat) => (_jsx("option", { value: cat.id, children: cat.nome }, cat.id)))] })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Descri\u00E7\u00E3o *" }), _jsx("input", { type: "text", name: "descricao", value: formData.descricao, onChange: handleChange, placeholder: "Ex: Gasolina no posto", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Valor *" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-3 top-2 text-gray-500", children: "R$" }), _jsx("input", { type: "number", name: "valor", value: formData.valor, onChange: handleChange, step: "0.01", min: "0", placeholder: "0.00", className: "w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", required: true })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Tipo *" }), _jsxs("select", { name: "tipo", value: formData.tipo, onChange: handleChange, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", required: true, children: [_jsx("option", { value: "despesa", children: "Despesa" }), _jsx("option", { value: "receita", children: "Receita" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "M\u00E9todo de Pagamento" }), _jsxs("select", { name: "metodoPagamento", value: formData.metodoPagamento, onChange: handleChange, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "cartao", children: "Cart\u00E3o" }), _jsx("option", { value: "dinheiro", children: "Dinheiro" }), _jsx("option", { value: "transferencia", children: "Transfer\u00EAncia" }), _jsx("option", { value: "outro", children: "Outro" })] })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Notas" }), _jsx("textarea", { name: "notas", value: formData.notas, onChange: handleChange, placeholder: "Notas adicionais (opcional)", rows: 2, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "submit", disabled: saving || isLoading, className: "px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50", children: saving ? 'Salvando...' : 'Salvar' }), _jsx("button", { type: "button", onClick: onCancel, className: "px-6 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition", children: "Cancelar" })] })] })] }));
}
