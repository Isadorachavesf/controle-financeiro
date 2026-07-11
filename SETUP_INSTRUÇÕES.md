# 🚀 Instruções de Setup - Controle Financeiro

## ⚡ Resumo: O que você precisa fazer

Você vai passar por **5 passos principais**. Cada passo tem um site ou aplicação para configurar. Tudo é **gratuito**.

---

## PASSO 1: Crie uma conta GitHub (5 minutos)

### O que fazer:
1. Acesse: https://github.com/signup
2. Preencha com seu email (você já está registrada como `isadorachavesf`)
3. Crie uma senha segura
4. Confirme seu email
5. **Pronto!** Você tem GitHub

---

## PASSO 2: Crie o repositório no GitHub (3 minutos)

### O que fazer:
1. Abra: https://github.com/new
2. Preencha assim:
   - **Repository name**: `controle-financeiro`
   - **Description**: `Sistema de Controle Financeiro com Sincronização Google Sheets`
   - **Visibility**: `Public` (ou Private se preferir)
   - Deixe outras opções padrão
3. Clique em "Create repository"
4. **Pronto!** Você criou o repositório

### Próximo passo (faça depois que eu avisar):
Você vai copiar a URL do repositório. Vai parecer: `https://github.com/isadorachavesf/controle-financeiro.git`

---

## PASSO 3: Configure Google Sheets API (10 minutos)

**⚠️ Mais complexo, mas vou guiar passo a passo**

### A. Crie um projeto no Google Cloud:

1. Acesse: https://console.cloud.google.com
2. Faça login com sua conta Google
3. Clique em "Novo projeto" (topo da página, perto do logo Google Cloud)
4. Preencha:
   - **Nome do projeto**: `controle-financeiro`
   - Clique "Criar"
5. Aguarde 30 segundos (vai mostrar "Projeto criado")

### B. Ative a Google Sheets API:

1. Na barra de busca (topo), procure por: `Google Sheets API`
2. Clique no resultado "Google Sheets API"
3. Clique no botão azul "ATIVAR"
4. Aguarde carregar (2-3 segundos)

### C. Crie uma "Service Account" (credenciais):

1. Na barra lateral esquerda, clique em: "Credenciais"
2. Clique no botão azul "+ CRIAR CREDENCIAIS"
3. Selecione: "Conta de Serviço"
4. Preencha:
   - **Nome da conta de serviço**: `controle-financeiro-sync`
   - Clique "Criar e continuar"
5. Na próxima tela, deixe em branco e clique "Continuar"
6. Na próxima tela, clique "Concluído"

### D. Baixe a chave JSON:

1. Volte para "Credenciais"
2. Procure por "controle-financeiro-sync" na seção de "Contas de Serviço"
3. Clique no email da conta
4. Vá para a aba "Chaves"
5. Clique "Adicionar chave" → "Criar nova chave"
6. Selecione "JSON"
7. Clique "Criar"
8. Um arquivo `controle-financeiro-XXXX.json` vai baixar no seu computador
9. **Renomeie o arquivo para**: `credentials.json`
10. **Copie esse arquivo** para a pasta do projeto: `/home/user/controle-financeiro/credentials.json`

### E. Compartilhe a planilha com a Service Account:

1. Abra a planilha: https://docs.google.com/spreadsheets/d/1LS3gF5SSzB6xJisoo6GFUG7Lvy93oePlNkfud_Q7ed4
2. Clique em "Compartilhar" (topo direito)
3. Na primeira aba, procure pelo email da Service Account
   - Procure no Google Cloud em: Credenciais → sua Service Account → coluna "Email"
   - Formato: `algo@controle-financeiro.iam.gserviceaccount.com`
4. Cola esse email na caixa de compartilhamento
5. Selecione "Editor" (permissão)
6. Clique "Compartilhar"

**✅ Pronto! Google Sheets API configurada**

---

## PASSO 4: Configure Vercel (Deploy - 5 minutos)

Vercel é onde seu app vai ficar hospedado e rodar online.

### A. Crie conta no Vercel:

1. Acesse: https://vercel.com/signup
2. Clique "Continuar com GitHub"
3. Autorize Vercel a acessar sua conta GitHub
4. **Pronto!** Você tem Vercel

### B. Crie um novo projeto:

1. No painel Vercel, clique "Novo Projeto"
2. Selecione seu repositório `controle-financeiro`
3. Clique "Importar"
4. Em "Build and Output Settings", deixe tudo padrão
5. Clique "Deploy"
6. Aguarde 3-5 minutos (vai compilar)

### C. Configure as variáveis de ambiente:

1. No painel do projeto Vercel
2. Vá para: Configurações → Variables
3. Adicione cada uma (clique "+ Adicionar" para cada):

```
JWT_SECRET = gere-um-texto-aleatorio-de-32-caracteres
PIN_HASH = $2a$10$1Ye0bNvBLLQKGx/.XPPBbOvXLnMu9vx8N9e9N9e9N9e9N9e9N9e9N
TOKEN_EXPIRY_MINUTES = 15
GOOGLE_SHEETS_ID = 1LS3gF5SSzB6xJisoo6GFUG7Lvy93oePlNkfud_Q7ed4
SYNC_INTERVAL_MINUTES = 30
```

4. Para `GOOGLE_APPLICATION_CREDENTIALS`, clique em "Enviar arquivo" e selecione o `credentials.json`

### D. Implante novamente:

1. Vá para "Deployments"
2. Clique nos "..." do último deploy
3. Selecione "Redeploy"

**✅ Pronto! App vai estar online**

---

## PASSO 5: Configure Supabase (Banco de Dados - 10 minutos)

Supabase é onde os dados vão ficar armazenados (mais seguro que dados na memória).

### A. Crie conta no Supabase:

1. Acesse: https://supabase.com
2. Clique "Começar seu projeto"
3. Faça login com GitHub (mesma conta de antes)
4. Autorize

### B. Crie um novo projeto:

1. Clique "Novo projeto"
2. Preencha:
   - **Nome**: `controle-financeiro`
   - **Senha do banco de dados**: crie uma senha forte (copie em algum lugar)
   - **Região**: deixe padrão
3. Clique "Criar novo projeto"
4. Aguarde 5-10 minutos (está criando o banco)

### C. Configure o banco de dados:

1. Na sidebar esquerda, clique em "SQL Editor"
2. Clique "Nova consulta"
3. **Cole todo o código abaixo** (copie e cole tudo de uma vez):

```sql
-- Tabela de categorias
CREATE TABLE categorias_orcamento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR NOT NULL,
  limite_mensal DECIMAL NOT NULL,
  cor_grafico VARCHAR DEFAULT '#3b82f6',
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações
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

-- Habilitar Row Level Security
ALTER TABLE categorias_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas (permite acesso por enquanto)
CREATE POLICY "Enable all access" ON categorias_orcamento FOR ALL USING (true);
CREATE POLICY "Enable all access" ON transacoes FOR ALL USING (true);
```

4. Clique em "Executar"
5. **✅ Pronto!** Banco criado

### D. Copie as credenciais do Supabase:

1. Na barra lateral, clique em "Configurações"
2. Clique em "Chaves da API"
3. Copie:
   - `SUPABASE_URL` (tipo `https://seu-projeto.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Volte para Vercel → Configurações → Variables
5. Adicione:
   ```
   SUPABASE_URL = (cole o valor copiado)
   SUPABASE_SERVICE_ROLE_KEY = (cole o valor copiado)
   ```

---

## 🎉 RESUMO: O que você fez

✅ **GitHub** - Repositório criado e código enviado  
✅ **Google Cloud** - Credenciais para sincronizar com Google Sheets  
✅ **Vercel** - App online e hospedado  
✅ **Supabase** - Banco de dados criado e configurado  

---

## 🧪 TESTE AGORA

1. Abra sua aplicação: `https://seu-projeto.vercel.app`
2. Faça login com PIN: `0804`
3. Teste as telas:
   - Dashboard: vê dados
   - Nova transação: cria uma
   - Orçamento: vê categorias
   - Sincronizar: faz sync com Google Sheets

**Se algo não funcionar, me avisa o erro exato!**

---

## 📞 PRÓXIMOS PASSOS OPCIONAIS

- Adicionar domínio customizado (seu próprio domínio)
- Configurar CI/CD (testes automáticos)
- Integrar Sentry (monitoramento de erros)
- Backup automático

Deixa para depois! Por enquanto, você tem um sistema completo funcionando! 🚀
