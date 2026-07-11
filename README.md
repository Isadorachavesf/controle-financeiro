# 💰 Sistema de Controle Financeiro

Sistema completo de controle financeiro com sincronização automática com Google Sheets, dashboard interativo e gráficos de categorias.

## ✨ Funcionalidades

- 🔐 **Autenticação por PIN** (0804)
- 📊 **Dashboard completo** com resumo financeiro
- 📈 **Gráficos interativos** de categorias e tendências
- 💳 **Gerenciamento de transações** (criar, editar, deletar)
- 💰 **Controle de orçamento** por categoria
- 🔄 **Sincronização automática** com Google Sheets
- 📱 **Interface responsiva** e mobile-friendly

## 🏗️ Arquitetura

### Estrutura do Projeto

```
controle-financeiro/
├── src/
│   ├── components/        # Componentes React reutilizáveis
│   ├── screens/           # Telas/páginas da aplicação
│   ├── types/             # Definições TypeScript
│   ├── hooks/             # React hooks customizados
│   ├── services/          # Serviços de API e Google Sheets
│   ├── utils/             # Funções utilitárias
│   ├── App.tsx            # Componente raiz
│   └── main.tsx           # Entrada principal
├── api/                   # Backend serverless (Vercel)
│   ├── verify-pin.ts
│   ├── transacoes.ts
│   ├── categorias.ts
│   ├── dashboard.ts
│   └── sync-sheets.ts
├── supabase/              # Migrations do Supabase
│   ├── migrations/
│   │   └── 0001_init.sql
│   └── schema.sql
├── public/                # Assets estáticos
├── .env.example           # Variáveis de ambiente
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Google com acesso a Google Sheets API
- Supabase project (opcional, pode usar Firebase)

### Instalação

```bash
# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# Preencher variáveis de ambiente
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
# GOOGLE_SHEETS_ID=
# PIN_HASH=bcrypt_hash_of_0804

# Executar desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📋 Plano de Implementação

### Phase 1: Foundation
- [ ] Configurar Supabase com tabelas
- [ ] Implementar autenticação por PIN
- [ ] Criar layout base da aplicação

### Phase 2: Core Features
- [ ] CRUD de transações
- [ ] Gerenciamento de categorias
- [ ] Filtros e busca

### Phase 3: Dashboard & Analytics
- [ ] Cards de resumo
- [ ] Gráficos de categorias
- [ ] Gráfico de tendências

### Phase 4: Budget Management
- [ ] Interface de orçamento
- [ ] Alertas de limite

### Phase 5: Google Sheets Sync
- [ ] Configurar API Google Sheets
- [ ] Implementar sincronização bidirecional
- [ ] Página de status de sincronização

### Phase 6: Polish
- [ ] Testes
- [ ] Otimizações
- [ ] Deploy

## 🔐 Segurança

- PIN armazenado com hash bcrypt
- Tokens JWT com expiração
- Rate limiting em endpoints
- RLS policies no Supabase
- Credenciais Google armazenadas seguramente

## 📊 Dados

### Categorias (Do Google Sheets Original)
- Academia
- Assinatura de trabalho
- Combustível
- Comida
- Energia
- Farmácia
- E mais...

### Estrutura de Transações
```typescript
{
  id: string;
  categoria: string;
  descricao: string;
  valor: number;
  data: Date;
  tipo: 'receita' | 'despesa';
  metodo: 'cartao' | 'dinheiro' | 'transferencia';
}
```

## 🔄 Sincronização Google Sheets

A sincronização ocorre automaticamente a cada 30 minutos (configurável):

1. **App → Sheets**: Novas transações são enviadas para a planilha
2. **Sheets → App**: Alterações na planilha são refletidas no app
3. **Conflitos**: Usa timestamp para resolução (last-write-wins)

## 📈 Métricas

- Dashboard mostra data de junho 2026 em diante
- Gráficos por categoria (mês/período)
- Tendências mensais
- Alertas de orçamento

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI**: Tailwind CSS
- **Gráficos**: Recharts
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **API Google**: googleapis + google-auth-library
- **Deploy**: Vercel (frontend + serverless functions)

## 📞 Contato

Desenvolvido para Isadora Chaves
Email: isadorachavesf@gmail.com

## 📄 Licença

Proprietary - Uso pessoal
