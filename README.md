# 💰 Sistema de Controle Financeiro

Controle financeiro pessoal com dashboard, gráficos por categoria, orçamentos e
**sincronização direta com a sua planilha do Google**. Funciona no computador e no
celular (iOS/Android), online.

## ✨ Funcionalidades

- 📊 **Dashboard** com receitas, despesas, saldo e gráficos por categoria
- 💳 **Transações**: criar, editar e excluir lançamentos
- 💰 **Orçamento** por categoria, com alertas ao passar de 80% do limite
- 🔄 **Sincronização com Google Sheets** — a planilha é o banco de dados
- 📱 **Responsivo** e utilizável offline (cópia local no aparelho)
- 🔓 **Sem senha** — acesso direto (uso pessoal)

## 🏗️ Como funciona

- **Frontend** (React + TypeScript + Vite + Tailwind), hospedado no Vercel como
  site estático.
- **Dados** ficam na **sua planilha do Google**, acessada por um **Google Apps
  Script** publicado como "App da Web" (roda na sua conta, acesso nativo à
  planilha). Não há servidor próprio, banco separado nem login.
- Enquanto a planilha não está conectada, o app funciona em **modo local**
  (dados no navegador) e pode ser conectado depois.

```
controle-financeiro/
├── src/
│   ├── components/     # Componentes React (Layout, formulários, tabela)
│   ├── screens/        # Telas: Dashboard, Transações, Orçamento, Sincronizar
│   ├── services/api.ts # Camada de dados (planilha via Apps Script + cache local)
│   ├── types/          # Tipos TypeScript
│   ├── App.tsx         # Componente raiz
│   └── main.tsx        # Entrada
├── google-apps-script/
│   └── Code.gs         # Backend que roda dentro da planilha do Google
├── public/             # Assets
├── CONECTAR_PLANILHA.md # Passo a passo para conectar a planilha
├── vite.config.ts
└── package.json
```

## 🚀 Rodar localmente

```bash
npm install
npm run dev      # desenvolvimento (http://localhost:5173)
npm run build    # build de produção (pasta dist/)
npm run preview  # pré-visualiza o build
```

## 🔗 Conectar à planilha

Veja o guia passo a passo em **[CONECTAR_PLANILHA.md](./CONECTAR_PLANILHA.md)**.
Resumo: cole o conteúdo de `google-apps-script/Code.gs` no editor de Apps Script
da planilha, publique como App da Web ("Qualquer pessoa"), copie a URL `/exec` e
cole na aba **Sincronizar** do app.

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS
- **Gráficos:** Recharts
- **Backend/Dados:** Google Apps Script + Google Sheets
- **Deploy:** Vercel (site estático)

## 📞 Contato

Desenvolvido para Isadora Chaves — isadorachavesf@gmail.com

## 📄 Licença

Uso pessoal
