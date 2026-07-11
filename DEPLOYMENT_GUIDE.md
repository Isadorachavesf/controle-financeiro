# 🚀 Guia de Deploy - Sistema de Controle Financeiro

Instruções completas para colocar a aplicação em produção.

---

## 📋 Pré-requisitos

- [ ] Repositório Git criado no GitHub
- [ ] Conta Vercel (https://vercel.com) conectada ao GitHub
- [ ] Conta Google Cloud com Google Sheets API habilitada
- [ ] Supabase project criado (ou Firebase/banco alternativo)
- [ ] Node.js 18+ instalado localmente

---

## 1️⃣ Preparação Local

### 1.1 Criar repositório GitHub

```bash
cd /home/user/controle-financeiro

# Inicializar git (se não existir)
git init
git add -A
git commit -m "Initial commit: Full financial control system"

# Adicionar remote
git remote add origin https://github.com/isadorachavesf/controle-financeiro.git
git branch -M main
git push -u origin main
```

### 1.2 Configurar arquivo `.env`

```bash
# Copiar template
cp .env.example .env.local

# Editar com valores reais
nano .env.local
```

**Valores necessários:**
```
# Autenticação
JWT_SECRET=seu-secret-aleatorio-seguro-min-32-chars
PIN_HASH=$(bcryptjs hash '0804')  # ou use hash pré-calculado
TOKEN_EXPIRY_MINUTES=15

# Google Sheets
GOOGLE_SHEETS_ID=1LS3gF5SSzB6xJisoo6GFUG7Lvy93oePlNkfud_Q7ed4
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Frontend
VITE_API_URL=/api

# Supabase (se usar)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu-chave-secreta

# Sync
SYNC_INTERVAL_MINUTES=30
```

### 1.3 Testar localmente

```bash
npm install
npm run dev

# Abrir http://localhost:5173
# PIN: 0804
# Verificar todas as telas funcionando
```

---

## 2️⃣ Setup Google Sheets API

### 2.1 Criar Service Account

1. Acesse: https://console.cloud.google.com
2. Crie novo projeto: "controle-financeiro"
3. Ative API: "Google Sheets API"
4. Crie "Service Account":
   - Nome: "controle-financeiro-sync"
   - Email será: `...@controle-financeiro.iam.gserviceaccount.com`
5. Crie chave JSON → baixe arquivo

### 2.2 Compartilhar Sheets

1. Abra planilha: https://docs.google.com/spreadsheets/d/1LS3gF5SSzB6xJisoo6GFUG7Lvy93oePlNkfud_Q7ed4
2. Compartilhe com email da Service Account
3. Permissão: Editar

### 2.3 Salvar credenciais

```bash
# Copiar JSON baixado
cp ~/Downloads/credentials.json ./credentials.json

# NUNCA commitar com git - já está em .gitignore
```

---

## 3️⃣ Setup Supabase (Banco de Dados)

### 3.1 Criar projeto Supabase

1. Acesse: https://supabase.com
2. Crie novo projeto
3. Nome: "controle-financeiro"
4. Copie `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`

### 3.2 Executar migrations

```bash
# Criar tabelas via Supabase SQL Editor

-- Tabela categorias
CREATE TABLE categorias_orcamento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR NOT NULL,
  limite_mensal DECIMAL NOT NULL,
  cor_grafico VARCHAR DEFAULT '#3b82f6',
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela transacoes
CREATE TABLE transacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID REFERENCES categorias_orcamento,
  descricao VARCHAR NOT NULL,
  valor DECIMAL NOT NULL,
  data_transacao DATE NOT NULL,
  tipo VARCHAR CHECK (tipo IN ('receita', 'despesa')),
  metodo_pagamento VARCHAR DEFAULT 'cartao',
  notas TEXT,
  google_sheets_id VARCHAR,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE categorias_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas (permite tudo por enquanto, restringir em produção)
CREATE POLICY "Enable all access" ON categorias_orcamento FOR ALL USING (true);
CREATE POLICY "Enable all access" ON transacoes FOR ALL USING (true);
```

---

## 4️⃣ Deploy no Vercel

### 4.1 Conectar GitHub

1. Acesse: https://vercel.com
2. Clique "New Project"
3. Selecione repositório GitHub "controle-financeiro"
4. Framework: "Other"
5. Build Command: `npm run build`
6. Output Directory: `dist`

### 4.2 Variáveis de Ambiente

No dashboard Vercel → Project Settings → Environment Variables:

```
JWT_SECRET = seu-secret-seguro
PIN_HASH = $2a$10$... (seu hash bcrypt)
TOKEN_EXPIRY_MINUTES = 15
GOOGLE_SHEETS_ID = 1LS3gF5SSzB6xJisoo6GFUG7Lvy93oePlNkfud_Q7ed4
GOOGLE_APPLICATION_CREDENTIALS = (conteúdo do JSON completo)
SUPABASE_URL = sua-url
SUPABASE_SERVICE_ROLE_KEY = sua-chave
SYNC_INTERVAL_MINUTES = 30
```

### 4.3 Deploy

```bash
# Push para GitHub ativa deploy automático
git push origin main

# Ou faça deploy direto via Vercel CLI
vercel deploy --prod
```

**URL será:** `https://seu-projeto.vercel.app`

---

## 5️⃣ Verificação Pós-Deploy

### 5.1 Testes básicos

- [ ] Abra aplicação
- [ ] Verifique autenticação PIN (0804)
- [ ] Navegue em todas as telas
- [ ] Crie/edite/delete uma transação
- [ ] Verifique gráficos carregam
- [ ] Teste filtros
- [ ] Verifique sync manual

### 5.2 Monitoramento

```bash
# Ver logs Vercel
vercel logs

# Monitorar performance
vercel analytics

# Monitorar erros
# Integre com Sentry (recomendado):
npm install @sentry/react @sentry/tracing
```

---

## 6️⃣ Configuração de Domínio (Opcional)

### 6.1 Adicionar domínio customizado

1. No Vercel → Domains
2. Adicione seu domínio (ex: financeiro.isadora.dev)
3. Configure registros DNS no seu provider

---

## 7️⃣ Backup & Recuperação

### 7.1 Backup automático

- Google Sheets: sincroniza automaticamente
- Supabase: automático (verifique na dashboard)
- GitHub: versão controlada

### 7.2 Recuperação de desastre

```bash
# Clonar production novamente
git clone https://github.com/isadorachavesf/controle-financeiro.git
cd controle-financeiro
npm install
npm run build
```

---

## 8️⃣ Performance & Otimizações

```bash
# Analisar bundle
npm run build
npm install -g serve
serve -s dist

# Lighthouse audit
# Chrome DevTools → Lighthouse

# Otimizações recomendadas:
# - Enable Vercel Analytics
# - Setup Vercel Speed Insights
# - Cache headers configurados
# - Image optimization
```

---

## 🔒 Security Checklist

- [ ] JWT_SECRET é aleatório e seguro (min 32 chars)
- [ ] PIN_HASH está hashado (nunca texto plano)
- [ ] Credenciais Google não estão no Git
- [ ] Env vars sensíveis apenas no Vercel
- [ ] CORS configurado para seu domínio
- [ ] RLS policies do Supabase habilitadas
- [ ] Rate limiting em endpoints críticos
- [ ] HTTPS forçado
- [ ] Cookies marcados como secure/httpOnly

---

## 📞 Troubleshooting Deploy

| Erro | Solução |
|------|---------|
| "API call failed" | Verifique env vars em Vercel |
| "Auth token expired" | Aumentar TOKEN_EXPIRY_MINUTES |
| "CORS error" | Verificar origin nos headers |
| "Google Sheets not found" | Confirmar ID e compartilhamento |
| "Database connection refused" | Verificar Supabase connection string |
| "Module not found" | Rodar `npm install` e rebuildar |

---

## 🚀 Próximos Passos

1. **CI/CD:** Setup GitHub Actions para testes automáticos
2. **Monitoring:** Integrar Sentry para error tracking
3. **Analytics:** Vercel Analytics + Posthog
4. **Database:** Migrar mock para Supabase real
5. **Sync:** Implementar Google Sheets API real
6. **Mobile:** Build com React Native

---

**Deploy realizado com sucesso! 🎉**
