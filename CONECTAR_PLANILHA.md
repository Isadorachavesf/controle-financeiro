# 🔗 Como conectar o app à sua planilha do Google

Siga estes passos **uma única vez**. Depois disso, tudo que você registrar no app
é salvo automaticamente na sua planilha (e o que estiver na planilha aparece no app).

⏱️ Tempo: ~5 minutos • 💰 Gratuito

---

## Passo 1 — Abra o editor de scripts da planilha

1. Abra a sua planilha:
   https://docs.google.com/spreadsheets/d/1LS3gF5SSzB6xJisoo6GFUG7Lvy93oePlNkfud_Q7ed4
2. No menu de cima, clique em **Extensões → Apps Script**
3. Vai abrir uma nova aba com um editor de código

---

## Passo 2 — Cole o código

1. No editor, apague tudo que estiver escrito (se houver algo)
2. Abra o arquivo **`google-apps-script/Code.gs`** (está na pasta do projeto)
3. **Copie todo o conteúdo** dele e **cole** no editor
4. Clique no ícone de **disquete** (Salvar) 💾

---

## Passo 3 — Publique como "App da Web"

1. No canto superior direito, clique em **Implantar → Nova implantação**
2. Clique na engrenagem ⚙️ ao lado de "Selecionar tipo" e escolha **App da Web**
3. Preencha:
   - **Descrição:** Controle Financeiro
   - **Executar como:** **Eu** (seu e-mail)
   - **Quem pode acessar:** **Qualquer pessoa**
4. Clique em **Implantar**
5. Na primeira vez, o Google vai pedir para **Autorizar acesso**:
   - Clique em **Autorizar acesso**
   - Escolha sua conta Google
   - Se aparecer "Google não verificou este app", clique em **Avançado → Acessar
     Controle Financeiro (não seguro)** — pode confiar, o app é seu
   - Clique em **Permitir**
6. No final, o Google mostra uma **URL do app da Web** que termina em **`/exec`**
7. **Copie essa URL** (botão "Copiar")

---

## Passo 4 — Conecte no aplicativo

1. Abra o seu aplicativo (link do Vercel)
2. Vá na aba **🔄 Sincronizar** (embaixo)
3. **Cole a URL** no campo indicado
4. Clique em **Conectar planilha**
5. Deve aparecer: **✓ Conectado!**

✅ **Pronto!** Agora é só usar. Cada lançamento vai direto para a planilha.

---

## ❓ Dúvidas comuns

**A URL está certa?** Ela precisa terminar em `/exec` (não em `/dev`).

**Deu erro ao conectar?** Confira no Passo 3 se "Quem pode acessar" ficou como
**Qualquer pessoa**. Se você mudou o código depois, precisa fazer
**Implantar → Gerenciar implantações → editar (lápis) → Nova versão → Implantar**.

**Mudei algo na planilha e não apareceu no app?** Clique em **🔄 Sincronizar agora**
na aba Sincronizar.

**As abas "Transacoes" e "Categorias" apareceram sozinhas na planilha.** É normal —
o app cria essas abas automaticamente na primeira vez. Pode deixar como estão.
