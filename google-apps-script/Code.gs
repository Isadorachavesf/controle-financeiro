/**
 * Controle Financeiro — Backend (Google Apps Script)
 * =================================================================
 * Este script transforma a sua planilha do Google no banco de dados
 * do aplicativo. Ele cria/usa duas abas: "Transacoes" e "Categorias".
 *
 * Como publicar:
 *   1. Na planilha: Extensões > Apps Script
 *   2. Apague o conteúdo e cole ESTE arquivo inteiro
 *   3. Salve (ícone de disquete)
 *   4. Implantar > Nova implantação > Tipo: "App da Web"
 *   5. Executar como: "Eu"  |  Quem tem acesso: "Qualquer pessoa"
 *   6. Implantar > copie a URL do App da Web (termina em /exec)
 *   7. Cole essa URL na tela "Sincronizar" do aplicativo
 * =================================================================
 */

var ABA_TRANSACOES = 'Transacoes';
var ABA_CATEGORIAS = 'Categorias';

var COLUNAS_TRANSACOES = [
  'id', 'categoriaId', 'descricao', 'valor', 'dataTransacao',
  'tipo', 'metodoPagamento', 'notas', 'criadoEm', 'atualizadoEm'
];
var COLUNAS_CATEGORIAS = ['id', 'nome', 'limiteMensal', 'corGrafico', 'criadoEm'];

var CATEGORIAS_PADRAO = [
  { nome: 'Combustível', limiteMensal: 600, corGrafico: '#3b82f6' },
  { nome: 'Comida', limiteMensal: 800, corGrafico: '#ef4444' },
  { nome: 'Energia', limiteMensal: 300, corGrafico: '#10b981' },
  { nome: 'Internet', limiteMensal: 150, corGrafico: '#f59e0b' },
  { nome: 'Academia', limiteMensal: 200, corGrafico: '#8b5cf6' }
];

// ---------------------------------------------------------------------------
// Roteamento HTTP
// ---------------------------------------------------------------------------

function doGet(e) {
  return handle(e, 'GET');
}

function doPost(e) {
  return handle(e, 'POST');
}

function handle(e, metodo) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    inicializar();

    var params = (e && e.parameter) || {};
    var corpo = {};
    if (metodo === 'POST' && e && e.postData && e.postData.contents) {
      try { corpo = JSON.parse(e.postData.contents); } catch (err) { corpo = {}; }
    }

    var acao = corpo.action || params.action || 'bootstrap';
    var payload = corpo.payload || {};

    var resultado;
    switch (acao) {
      case 'bootstrap':
        resultado = { categorias: lerCategorias(), transacoes: lerTransacoes() };
        break;
      case 'getTransacoes':
        resultado = lerTransacoes();
        break;
      case 'getCategorias':
        resultado = lerCategorias();
        break;
      case 'createTransacao':
        resultado = criarTransacao(payload);
        break;
      case 'updateTransacao':
        resultado = atualizarTransacao(payload.id, payload);
        break;
      case 'deleteTransacao':
        deletarTransacao(payload.id);
        resultado = { ok: true };
        break;
      case 'createCategoria':
        resultado = criarCategoria(payload);
        break;
      case 'updateCategoria':
        resultado = atualizarCategoria(payload.id, payload);
        break;
      default:
        resultado = { error: 'Ação desconhecida: ' + acao };
    }

    return json({ success: true, data: resultado });
  } catch (erro) {
    return json({ success: false, error: String(erro) });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// Inicialização (cria abas e cabeçalhos se não existirem)
// ---------------------------------------------------------------------------

function inicializar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  garantirAba(ss, ABA_TRANSACOES, COLUNAS_TRANSACOES);
  var catSheet = garantirAba(ss, ABA_CATEGORIAS, COLUNAS_CATEGORIAS);

  // Semeia categorias padrão apenas se a aba estiver vazia
  if (catSheet.getLastRow() < 2) {
    CATEGORIAS_PADRAO.forEach(function (c) {
      catSheet.appendRow([gerarId(), c.nome, c.limiteMensal, c.corGrafico, new Date().toISOString()]);
    });
  }
}

function garantirAba(ss, nome, colunas) {
  var sheet = ss.getSheetByName(nome);
  if (!sheet) {
    sheet = ss.insertSheet(nome);
  }
  if (sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, colunas.length).setValues([colunas]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

function lerAba(nome, colunas) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nome);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var valores = sheet.getRange(2, 1, sheet.getLastRow() - 1, colunas.length).getValues();
  return valores
    .filter(function (linha) { return linha[0] !== '' && linha[0] !== null; })
    .map(function (linha) {
      var obj = {};
      colunas.forEach(function (col, i) { obj[col] = linha[i]; });
      return obj;
    });
}

function lerTransacoes() {
  return lerAba(ABA_TRANSACOES, COLUNAS_TRANSACOES).map(function (t) {
    t.valor = Number(t.valor) || 0;
    t.dataTransacao = formatarData(t.dataTransacao);
    return t;
  });
}

function lerCategorias() {
  return lerAba(ABA_CATEGORIAS, COLUNAS_CATEGORIAS).map(function (c) {
    c.limiteMensal = Number(c.limiteMensal) || 0;
    return c;
  });
}

// ---------------------------------------------------------------------------
// Escrita — Transações
// ---------------------------------------------------------------------------

function criarTransacao(p) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_TRANSACOES);
  var agora = new Date().toISOString();
  var t = {
    id: gerarId(),
    categoriaId: p.categoriaId || '',
    descricao: p.descricao || '',
    valor: Number(p.valor) || 0,
    dataTransacao: formatarData(p.dataTransacao),
    tipo: p.tipo || 'despesa',
    metodoPagamento: p.metodoPagamento || 'cartao',
    notas: p.notas || '',
    criadoEm: agora,
    atualizadoEm: agora
  };
  sheet.appendRow(COLUNAS_TRANSACOES.map(function (c) { return t[c]; }));
  return t;
}

function atualizarTransacao(id, p) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_TRANSACOES);
  var linha = encontrarLinha(sheet, id);
  if (linha === -1) throw 'Transação não encontrada';

  var atual = {};
  var valores = sheet.getRange(linha, 1, 1, COLUNAS_TRANSACOES.length).getValues()[0];
  COLUNAS_TRANSACOES.forEach(function (c, i) { atual[c] = valores[i]; });

  ['categoriaId', 'descricao', 'valor', 'dataTransacao', 'tipo', 'metodoPagamento', 'notas'].forEach(function (campo) {
    if (p[campo] !== undefined) atual[campo] = p[campo];
  });
  atual.valor = Number(atual.valor) || 0;
  atual.dataTransacao = formatarData(atual.dataTransacao);
  atual.atualizadoEm = new Date().toISOString();

  sheet.getRange(linha, 1, 1, COLUNAS_TRANSACOES.length)
    .setValues([COLUNAS_TRANSACOES.map(function (c) { return atual[c]; })]);
  return atual;
}

function deletarTransacao(id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_TRANSACOES);
  var linha = encontrarLinha(sheet, id);
  if (linha !== -1) sheet.deleteRow(linha);
}

// ---------------------------------------------------------------------------
// Escrita — Categorias
// ---------------------------------------------------------------------------

function criarCategoria(p) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CATEGORIAS);
  var c = {
    id: gerarId(),
    nome: p.nome || '',
    limiteMensal: Number(p.limiteMensal) || 0,
    corGrafico: p.corGrafico || '#3b82f6',
    criadoEm: new Date().toISOString()
  };
  sheet.appendRow(COLUNAS_CATEGORIAS.map(function (col) { return c[col]; }));
  return c;
}

function atualizarCategoria(id, p) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CATEGORIAS);
  var linha = encontrarLinha(sheet, id);
  if (linha === -1) throw 'Categoria não encontrada';

  var atual = {};
  var valores = sheet.getRange(linha, 1, 1, COLUNAS_CATEGORIAS.length).getValues()[0];
  COLUNAS_CATEGORIAS.forEach(function (c, i) { atual[c] = valores[i]; });

  ['nome', 'limiteMensal', 'corGrafico'].forEach(function (campo) {
    if (p[campo] !== undefined) atual[campo] = p[campo];
  });
  atual.limiteMensal = Number(atual.limiteMensal) || 0;

  sheet.getRange(linha, 1, 1, COLUNAS_CATEGORIAS.length)
    .setValues([COLUNAS_CATEGORIAS.map(function (c) { return atual[c]; })]);
  return atual;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function encontrarLinha(sheet, id) {
  if (sheet.getLastRow() < 2) return -1;
  var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function gerarId() {
  return Utilities.getUuid();
}

function formatarData(valor) {
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  var s = String(valor || '');
  return s.length >= 10 ? s.substring(0, 10) : s;
}
