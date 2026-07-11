import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '@services/api';
export function DashboardScreen() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(new Date().getFullYear());
    useEffect(() => {
        loadDashboard();
    }, [mes, ano]);
    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError('');
            // Use June 2026 as default if before that date
            let queryMes = mes;
            let queryAno = ano;
            const now = new Date(ano, mes - 1);
            const june2026 = new Date(2026, 5); // June 2026
            if (now < june2026) {
                queryMes = 6;
                queryAno = 2026;
            }
            const dashboard = await apiService.getDashboard(queryMes, queryAno);
            setData(dashboard);
        }
        catch (err) {
            setError('Erro ao carregar dashboard');
            console.error(err);
            // Mock data for demo
            setData(mockDashboardData());
        }
        finally {
            setLoading(false);
        }
    };
    const handlePrevMonth = () => {
        if (mes === 1) {
            setMes(12);
            setAno(ano - 1);
        }
        else {
            setMes(mes - 1);
        }
    };
    const handleNextMonth = () => {
        if (mes === 12) {
            setMes(1);
            setAno(ano + 1);
        }
        else {
            setMes(mes + 1);
        }
    };
    if (loading && !data) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl mb-4", children: "\u23F3" }), _jsx("p", { className: "text-gray-600", children: "Carregando dashboard..." })] }) }));
    }
    if (!data) {
        return (_jsx("div", { className: "bg-red-100 border border-red-400 text-red-700 p-4 rounded", children: error || 'Erro ao carregar dados' }));
    }
    const COLORS = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4',
    ];
    const chartData = data.porCategoria.map((item, idx) => ({
        name: item.categoria.nome,
        value: item.gasto,
        color: COLORS[idx % COLORS.length],
    }));
    const trendData = generateTrendData(mes, ano);
    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(ano, mes - 1));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between bg-white rounded-lg shadow p-4", children: [_jsx("button", { onClick: handlePrevMonth, className: "p-2 hover:bg-gray-100 rounded-lg transition", children: "\u2190" }), _jsx("h2", { className: "text-lg font-semibold capitalize", children: monthName }), _jsx("button", { onClick: handleNextMonth, className: "p-2 hover:bg-gray-100 rounded-lg transition", children: "\u2192" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-l-4 border-green-500", children: [_jsx("p", { className: "text-gray-600 text-sm font-medium", children: "Receitas" }), _jsxs("p", { className: "text-3xl font-bold text-green-600 mt-2", children: ["R$ ", data.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6 border-l-4 border-red-500", children: [_jsx("p", { className: "text-gray-600 text-sm font-medium", children: "Despesas" }), _jsxs("p", { className: "text-3xl font-bold text-red-600 mt-2", children: ["R$ ", data.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })] })] }), _jsxs("div", { className: `bg-gradient-to-br rounded-lg shadow p-6 border-l-4 ${data.saldo >= 0
                            ? 'from-blue-50 to-blue-100 border-blue-500'
                            : 'from-orange-50 to-orange-100 border-orange-500'}`, children: [_jsx("p", { className: "text-gray-600 text-sm font-medium", children: "Saldo" }), _jsxs("p", { className: `text-3xl font-bold mt-2 ${data.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`, children: ["R$ ", data.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })] })] })] }), data.alertas.length > 0 && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-yellow-900 mb-3", children: "\u26A0\uFE0F Alertas de Or\u00E7amento" }), _jsx("div", { className: "space-y-2", children: data.alertas.map((alerta) => (_jsxs("div", { className: "text-sm text-yellow-800", children: [_jsx("p", { className: "font-medium", children: alerta.categoriaNome }), _jsxs("p", { children: [alerta.percentual.toFixed(1), "% do limite (R$ ", alerta.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), ")"] })] }, alerta.categoriaId))) })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "font-semibold mb-4", children: "Despesas por Categoria" }), chartData.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: chartData, cx: "50%", cy: "50%", labelLine: false, label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`, outerRadius: 80, fill: "#8884d8", dataKey: "value", children: chartData.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value) => `R$ ${parseFloat(value.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` })] }) })) : (_jsx("p", { className: "text-gray-500 text-center py-8", children: "Sem dados para este per\u00EDodo" }))] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "font-semibold mb-4", children: "Tend\u00EAncia (6 meses)" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: trendData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "mes" }), _jsx(YAxis, {}), _jsx(Tooltip, { formatter: (value) => `R$ ${parseFloat(value.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "receitas", stroke: "#10b981", strokeWidth: 2, name: "Receitas" }), _jsx(Line, { type: "monotone", dataKey: "despesas", stroke: "#ef4444", strokeWidth: 2, name: "Despesas" }), _jsx(Line, { type: "monotone", dataKey: "saldo", stroke: "#3b82f6", strokeWidth: 2, name: "Saldo" })] }) })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "font-semibold mb-4", children: "Resumo por Categoria" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50 border-b", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left font-semibold", children: "Categoria" }), _jsx("th", { className: "px-4 py-2 text-right font-semibold", children: "Gasto" }), _jsx("th", { className: "px-4 py-2 text-right font-semibold", children: "Limite" }), _jsx("th", { className: "px-4 py-2 text-right font-semibold", children: "% do Limite" })] }) }), _jsx("tbody", { children: data.porCategoria.map((item) => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2", children: item.categoria.nome }), _jsxs("td", { className: "px-4 py-2 text-right", children: ["R$ ", item.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })] }), _jsxs("td", { className: "px-4 py-2 text-right", children: ["R$ ", item.categoria.limiteMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })] }), _jsx("td", { className: "px-4 py-2 text-right", children: _jsxs("span", { className: `px-2 py-1 rounded text-xs font-semibold ${item.percentualDoLimite >= 80
                                                        ? 'bg-red-100 text-red-800'
                                                        : item.percentualDoLimite >= 50
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-green-100 text-green-800'}`, children: [item.percentualDoLimite.toFixed(1), "%"] }) })] }, item.categoria.id))) })] }) })] }), data.ultimasTransacoes && data.ultimasTransacoes.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "font-semibold mb-4", children: "\u00DAltimas Transa\u00E7\u00F5es" }), _jsx("div", { className: "space-y-2", children: data.ultimasTransacoes.slice(0, 5).map((tx) => (_jsxs("div", { className: "flex justify-between items-center py-2 border-b last:border-b-0", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: tx.categoriaNome || tx.descricao }), _jsx("p", { className: "text-xs text-gray-500", children: new Date(tx.dataTransacao).toLocaleDateString('pt-BR') })] }), _jsxs("p", { className: `font-semibold ${tx.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`, children: [tx.tipo === 'receita' ? '+' : '-', " R$ ", tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })] })] }, tx.id))) })] }))] }));
}
// Mock data for development
function mockDashboardData() {
    return {
        mes: 6,
        ano: 2026,
        totalReceitas: 5000,
        totalDespesas: 3200,
        saldo: 1800,
        porCategoria: [
            {
                categoria: { id: '1', nome: 'Combustível', limiteMensal: 600, corGrafico: '#3b82f6', criadoEm: '' },
                gasto: 450,
                percentualDoLimite: 75,
            },
            {
                categoria: { id: '2', nome: 'Comida', limiteMensal: 800, corGrafico: '#ef4444', criadoEm: '' },
                gasto: 650,
                percentualDoLimite: 81.25,
            },
            {
                categoria: { id: '3', nome: 'Energia', limiteMensal: 300, corGrafico: '#10b981', criadoEm: '' },
                gasto: 250,
                percentualDoLimite: 83.33,
            },
            {
                categoria: { id: '4', nome: 'Internet', limiteMensal: 150, corGrafico: '#f59e0b', criadoEm: '' },
                gasto: 150,
                percentualDoLimite: 100,
            },
            {
                categoria: { id: '5', nome: 'Academia', limiteMensal: 200, corGrafico: '#8b5cf6', criadoEm: '' },
                gasto: 200,
                percentualDoLimite: 100,
            },
        ],
        alertas: [
            { categoriaId: '2', categoriaNome: 'Comida', percentual: 81.25, limite: 800, gasto: 650 },
            { categoriaId: '3', categoriaNome: 'Energia', percentual: 83.33, limite: 300, gasto: 250 },
        ],
        ultimasTransacoes: [
            {
                id: '1',
                categoriaId: '1',
                categoriaNome: 'Combustível',
                descricao: 'Gasolina no posto',
                valor: 150,
                dataTransacao: '2026-06-20',
                tipo: 'despesa',
                metodoPagamento: 'cartao',
                criadoEm: '',
                atualizadoEm: '',
            },
            {
                id: '2',
                categoriaId: '2',
                categoriaNome: 'Comida',
                descricao: 'Supermercado',
                valor: 200,
                dataTransacao: '2026-06-19',
                tipo: 'despesa',
                metodoPagamento: 'cartao',
                criadoEm: '',
                atualizadoEm: '',
            },
            {
                id: '3',
                categoriaId: '3',
                categoriaNome: 'Energia',
                descricao: 'Conta de luz',
                valor: 250,
                dataTransacao: '2026-06-15',
                tipo: 'despesa',
                metodoPagamento: 'transferencia',
                criadoEm: '',
                atualizadoEm: '',
            },
        ],
    };
}
function generateTrendData(mes, ano) {
    const data = [];
    for (let i = 5; i >= 0; i--) {
        let m = mes - i;
        let y = ano;
        if (m <= 0) {
            m += 12;
            y -= 1;
        }
        data.push({
            mes: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(y, m - 1)),
            receitas: Math.random() * 5000 + 2000,
            despesas: Math.random() * 3000 + 1500,
            saldo: Math.random() * 2000 + 1000,
        });
    }
    return data;
}
