import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { apiService } from '@services/api';
export function OrcamentoScreen() {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [novoLimite, setNovoLimite] = useState('');
    const [novaCategoria, setNovaCategoria] = useState('');
    const [novoNome, setNovoNome] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    useEffect(() => {
        loadCategorias();
    }, []);
    const loadCategorias = async () => {
        try {
            setLoading(true);
            setError('');
            const cats = await apiService.getCategorias();
            setCategorias(cats || mockCategorias());
        }
        catch (err) {
            setError('Erro ao carregar categorias');
            console.error(err);
            setCategorias(mockCategorias());
        }
        finally {
            setLoading(false);
        }
    };
    const handleUpdateLimit = async (id, novoLimiteVal) => {
        if (!novoLimiteVal)
            return;
        const valor = parseFloat(novoLimiteVal);
        if (isNaN(valor) || valor <= 0) {
            setError('Valor deve ser um número positivo');
            return;
        }
        try {
            setError('');
            await apiService.updateCategoria(id, { limiteMensal: valor });
            await loadCategorias();
            setEditingId(null);
            setNovoLimite('');
        }
        catch (err) {
            setError('Erro ao atualizar categoria');
            console.error(err);
        }
    };
    const handleAddCategoria = async () => {
        if (!novoNome || !novaCategoria) {
            setError('Preencha todos os campos');
            return;
        }
        const valor = parseFloat(novaCategoria);
        if (isNaN(valor) || valor <= 0) {
            setError('Limite deve ser um número positivo');
            return;
        }
        try {
            setError('');
            await apiService.createCategoria({
                nome: novoNome,
                limiteMensal: valor,
                corGrafico: '#' + Math.floor(Math.random() * 16777215).toString(16),
            });
            await loadCategorias();
            setNovoNome('');
            setNovaCategoria('');
            setShowAddForm(false);
        }
        catch (err) {
            setError('Erro ao criar categoria');
            console.error(err);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("p", { className: "text-gray-600", children: "Carregando or\u00E7amento..." }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Controle de Or\u00E7amento" }), _jsx("button", { onClick: () => setShowAddForm(!showAddForm), className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition", children: showAddForm ? 'Cancelar' : '+ Nova Categoria' })] }), error && (_jsx("div", { className: "bg-red-100 border border-red-400 text-red-700 p-4 rounded", children: error })), showAddForm && (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "Nova Categoria" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nome da Categoria *" }), _jsx("input", { type: "text", value: novoNome, onChange: (e) => setNovoNome(e.target.value), placeholder: "Ex: Alimenta\u00E7\u00E3o", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Limite Mensal (R$) *" }), _jsx("input", { type: "number", value: novaCategoria, onChange: (e) => setNovaCategoria(e.target.value), step: "0.01", min: "0", placeholder: "0.00", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsx("button", { onClick: handleAddCategoria, className: "w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition", children: "Criar Categoria" })] })] })), _jsx("div", { className: "grid grid-cols-1 gap-4", children: categorias.map((cat) => (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: cat.nome }), _jsx("div", { className: "space-y-2", children: _jsx("div", { children: _jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "text-gray-600", children: "Limite mensal" }), _jsxs("span", { className: "font-medium", children: ["R$ ", cat.limiteMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })] })] }) }) })] }), _jsx("button", { onClick: () => {
                                        setEditingId(cat.id);
                                        setNovoLimite(cat.limiteMensal.toString());
                                    }, className: "px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition", children: "\u270F\uFE0F Editar" })] }), editingId === cat.id && (_jsxs("div", { className: "mt-4 pt-4 border-t space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Novo Limite (R$)" }), _jsx("input", { type: "number", value: novoLimite, onChange: (e) => setNovoLimite(e.target.value), step: "0.01", min: "0", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => handleUpdateLimit(cat.id, novoLimite), className: "flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition", children: "Salvar" }), _jsx("button", { onClick: () => {
                                                setEditingId(null);
                                                setNovoLimite('');
                                            }, className: "flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition", children: "Cancelar" })] })] }))] }, cat.id))) }), categorias.length === 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow p-8 text-center", children: [_jsx("p", { className: "text-gray-600 text-lg", children: "Nenhuma categoria criada" }), _jsx("button", { onClick: () => setShowAddForm(true), className: "mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition", children: "Criar primeira categoria" })] }))] }));
}
function mockCategorias() {
    return [
        { id: '1', nome: 'Combustível', limiteMensal: 600, corGrafico: '#3b82f6', criadoEm: '' },
        { id: '2', nome: 'Comida', limiteMensal: 800, corGrafico: '#ef4444', criadoEm: '' },
        { id: '3', nome: 'Energia', limiteMensal: 300, corGrafico: '#10b981', criadoEm: '' },
        { id: '4', nome: 'Internet', limiteMensal: 150, corGrafico: '#f59e0b', criadoEm: '' },
        { id: '5', nome: 'Academia', limiteMensal: 200, corGrafico: '#8b5cf6', criadoEm: '' },
    ];
}
