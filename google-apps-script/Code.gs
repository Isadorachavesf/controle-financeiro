/**
 * Controle Financeiro — Backend (Google Apps Script)  •  versão 2
 * =================================================================
 * Lê e grava nas SUAS abas mensais existentes (ex.: "Julho 2026",
 * "Junho 2026"...) com as suas colunas:
 *
 *   Código | Data | Compra | Categoria | Forma de pagamento |
 *   Parcela | Valor | Compra feita por | Data de lançamento
 *
 * Os limites de orçamento por categoria ficam numa aba própria do app
 * ("_Orcamentos"), sem mexer nas suas abas de dados.
 *
 * IMPORTANTE ao atualizar este código:
 *   Depois de colar e salvar, publique uma NOVA VERSÃO:
 *   Implantar > Gerenciar implantações > (lápis) Editar >
 *   Versão: "Nova versão" > Implantar.
 * =================================================================
 */

var ABA_ORCAMENTOS = '_Orcamentos';
var COLUNAS_ORCAMENTOS = ['nome', 'limiteMensal', 'corGrafico'];

// Cabeçalho padrão usado ao criar uma aba de mês que ainda não existe.
var HEADER_PADRAO = [
  'Código', 'Data', 'Compra', 'Categoria', 'Forma de pagamento',
  'Parcela', 'Valor', 'Compra feita por', 'Data de lançamento'
];

var MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

var PALETA = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
              '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

// ---------------------------------------------------------------------------
// Roteamento HTTP
// ---------------------------------------------------------------------------

function doGet(e) { return handle(e, 'GET'); }
function doPost(e) { return handle(e, 'POST'); }

function handle(e, metodo) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
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
      case 'getTransacoes': resultado = lerTransacoes(); break;
      case 'getCategorias': resultado = lerCategorias(); break;
      case 'createTransacao': resultado = criarTransacao(payload); break;
      case 'updateTransacao': resultado = atualizarTransacao(payload.id, payload); break;
      case 'deleteTransacao': deletarTransacao(payload.id); resultado = { ok: true }; break;
      case 'createCategoria': resultado = upsertCategoria(payload); break;
      case 'updateCategoria': resultado = upsertCategoria(payload); break;
      default: resultado = { error: 'Ação desconhecida: ' + acao };
    }
    return json({ success: true, data: resultado });
  } catch (erro) {
    return json({ success: false, error: String(erro) });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// Detecção das abas de dados e mapeamento de colunas
// ---------------------------------------------------------------------------

function normalizar(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Descobre quais colunas correspondem a cada campo lógico, pelo cabeçalho.
function mapearColunas(cabecalho) {
  var map = {};
  cabecalho.forEach(function (titulo, i) {
    var n = normalizar(titulo);
    if (map.codigo === undefined && n.indexOf('codigo') === 0) map.codigo = i;
    else if (map.datalanc === undefined && n.indexOf('data de lanc') === 0) map.datalanc = i;
    else if (map.data === undefined && n === 'data') map.data = i;
    else if (map.quem === undefined && n.indexOf('feita') >= 0) map.quem = i;
    else if (map.compra === undefined && n.indexOf('compra') >= 0) map.compra = i;
    else if (map.categoria === undefined && n.indexOf('categoria') >= 0) map.categoria = i;
    else if (map.forma === undefined && (n.indexOf('forma') >= 0 || n.indexOf('pagam') >= 0)) map.forma = i;
    else if (map.parcela === undefined && n.indexOf('parcela') >= 0) map.parcela = i;
    else if (map.valor === undefined && n.indexOf('valor') >= 0) map.valor = i;
  });
  return map;
}

// Uma aba é "de dados" se o cabeçalho tiver Categoria + Valor + Compra.
function ehAbaDeDados(map) {
  return map.categoria !== undefined && map.valor !== undefined && map.compra !== undefined;
}

function abasDeDados() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets().filter(function (sheet) {
    var nome = sheet.getName();
    if (nome.charAt(0) === '_' || sheet.getLastColumn() < 3 || sheet.getLastRow() < 1) return false;
    // Apenas abas de MÊS (ex.: "Junho 2026"). Ignora "Base de dados",
    // "A receber 2026", "CNPJs clientes" e afins, que duplicam/consolidam dados.
    if (!competenciaDaAba(nome)) return false;
    var cab = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    return ehAbaDeDados(mapearColunas(cab));
  });
}

// ---------------------------------------------------------------------------
// Leitura de transações (de todas as abas mensais)
// ---------------------------------------------------------------------------

// Extrai a competência (YYYY-MM) a partir do nome da aba, ex.: "Julho 2026".
function competenciaDaAba(nomeAba) {
  var n = normalizar(nomeAba);
  for (var i = 0; i < MESES_PT.length; i++) {
    if (n.indexOf(normalizar(MESES_PT[i])) >= 0) {
      var ano = (nomeAba.match(/(20\d{2})/) || [])[1];
      if (ano) return ano + '-' + pad2(i + 1);
    }
  }
  return '';
}

function lerTransacoes() {
  var out = [];
  abasDeDados().forEach(function (sheet) {
    if (sheet.getLastRow() < 2) return;
    var nome = sheet.getName();
    var competencia = competenciaDaAba(nome);
    var cab = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var map = mapearColunas(cab);
    var linhas = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

    linhas.forEach(function (linha) {
      var valorBruto = linha[map.valor];
      var descricao = map.compra !== undefined ? String(linha[map.compra] || '').trim() : '';
      if ((valorBruto === '' || valorBruto === null) && descricao === '') return; // linha vazia

      var valorNum = parseValor(valorBruto);
      if (!valorNum && descricao === '') return;

      var tipo = valorNum < 0 ? 'receita' : 'despesa';
      var categoria = map.categoria !== undefined ? String(linha[map.categoria] || '').trim() : '';
      if (!categoria) categoria = 'Sem categoria';

      var codigo = map.codigo !== undefined ? String(linha[map.codigo] || '').trim() : '';
      var notasPartes = [];
      if (map.parcela !== undefined && String(linha[map.parcela] || '').trim())
        notasPartes.push('Parcela ' + String(linha[map.parcela]).trim());
      if (map.quem !== undefined && String(linha[map.quem] || '').trim())
        notasPartes.push(String(linha[map.quem]).trim());

      out.push({
        id: nome + '||' + codigo,
        categoriaId: categoria,
        categoriaNome: categoria,
        descricao: descricao,
        valor: Math.abs(valorNum),
        dataTransacao: parseData(map.data !== undefined ? linha[map.data] : ''),
        competencia: competencia,
        tipo: tipo,
        metodoPagamento: map.forma !== undefined ? String(linha[map.forma] || '').trim() : '',
        notas: notasPartes.join(' · '),
        criadoEm: '',
        atualizadoEm: ''
      });
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Categorias = nomes distintos dos dados + limites salvos em _Orcamentos
// ---------------------------------------------------------------------------

function lerCategorias() {
  // limites salvos
  var limites = {};
  var orc = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_ORCAMENTOS);
  if (orc && orc.getLastRow() > 1) {
    orc.getRange(2, 1, orc.getLastRow() - 1, COLUNAS_ORCAMENTOS.length).getValues().forEach(function (l) {
      var nome = String(l[0] || '').trim();
      if (nome) limites[nome] = { limiteMensal: Number(l[1]) || 0, corGrafico: l[2] || '' };
    });
  }

  // nomes distintos vindos das transações
  var vistos = {};
  var nomes = [];
  lerTransacoes().forEach(function (t) {
    if (!vistos[t.categoriaId]) { vistos[t.categoriaId] = true; nomes.push(t.categoriaId); }
  });
  // inclui categorias que só existem em _Orcamentos
  Object.keys(limites).forEach(function (nome) {
    if (!vistos[nome]) { vistos[nome] = true; nomes.push(nome); }
  });

  return nomes.map(function (nome, i) {
    var extra = limites[nome] || {};
    return {
      id: nome,
      nome: nome,
      limiteMensal: extra.limiteMensal || 0,
      corGrafico: extra.corGrafico || PALETA[i % PALETA.length],
      criadoEm: ''
    };
  });
}

function upsertCategoria(p) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_ORCAMENTOS);
  if (!sheet) {
    sheet = ss.insertSheet(ABA_ORCAMENTOS);
    sheet.getRange(1, 1, 1, COLUNAS_ORCAMENTOS.length).setValues([COLUNAS_ORCAMENTOS]);
    sheet.setFrozenRows(1);
  }
  var nome = String(p.nome || p.id || '').trim();
  if (!nome) throw 'Categoria sem nome';

  var linha = -1;
  if (sheet.getLastRow() > 1) {
    var nomesCol = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < nomesCol.length; i++) {
      if (String(nomesCol[i][0]).trim() === nome) { linha = i + 2; break; }
    }
  }
  var cor = p.corGrafico || PALETA[(sheet.getLastRow()) % PALETA.length];
  var limite = Number(p.limiteMensal) || 0;
  if (linha === -1) {
    sheet.appendRow([nome, limite, cor]);
  } else {
    var atualCor = sheet.getRange(linha, 3).getValue() || cor;
    sheet.getRange(linha, 1, 1, 3).setValues([[nome, limite, p.corGrafico || atualCor]]);
  }
  return { id: nome, nome: nome, limiteMensal: limite, corGrafico: cor, criadoEm: '' };
}

// ---------------------------------------------------------------------------
// Escrita de transações nas abas mensais
// ---------------------------------------------------------------------------

function nomeAbaDoMes(dataISO) {
  var d = new Date(dataISO + 'T00:00:00');
  if (isNaN(d.getTime())) d = new Date();
  return MESES_PT[d.getMonth()] + ' ' + d.getFullYear();
}

function acharOuCriarAbaMes(dataISO) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var alvo = normalizar(nomeAbaDoMes(dataISO));
  var abas = abasDeDados();
  for (var i = 0; i < abas.length; i++) {
    if (normalizar(abas[i].getName()) === alvo) return abas[i];
  }
  // não existe: cria com o cabeçalho de uma aba existente (ou o padrão)
  var header = abas.length ? abas[0].getRange(1, 1, 1, abas[0].getLastColumn()).getValues()[0] : HEADER_PADRAO;
  var nova = ss.insertSheet(nomeAbaDoMes(dataISO));
  nova.getRange(1, 1, 1, header.length).setValues([header]);
  nova.setFrozenRows(1);
  return nova;
}

function proximoCodigo(sheet, map) {
  if (map.codigo === undefined || sheet.getLastRow() < 2) return 1;
  var col = sheet.getRange(2, map.codigo + 1, sheet.getLastRow() - 1, 1).getValues();
  var max = 0;
  col.forEach(function (l) { var n = parseInt(l[0], 10); if (!isNaN(n) && n > max) max = n; });
  return max + 1;
}

function criarTransacao(p) {
  var sheet = acharOuCriarAbaMes(p.dataTransacao);
  var cab = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = mapearColunas(cab);
  var codigo = proximoCodigo(sheet, map);

  var linha = new Array(cab.length).fill('');
  var valorAssinado = (p.tipo === 'receita' ? -1 : 1) * (Number(p.valor) || 0);
  if (map.codigo !== undefined) linha[map.codigo] = codigo;
  if (map.data !== undefined) linha[map.data] = formatarDataBR(p.dataTransacao);
  if (map.compra !== undefined) linha[map.compra] = p.descricao || '';
  if (map.categoria !== undefined) linha[map.categoria] = p.categoriaId || '';
  if (map.forma !== undefined) linha[map.forma] = p.metodoPagamento || '';
  if (map.valor !== undefined) linha[map.valor] = valorAssinado;
  if (map.quem !== undefined) linha[map.quem] = p.quem || 'Isadora';
  if (map.datalanc !== undefined) linha[map.datalanc] = formatarDataBR(new Date());

  sheet.appendRow(linha);
  return montarRetorno(sheet.getName(), codigo, p);
}

function localizarLinha(id) {
  var partes = String(id).split('||');
  var nomeAba = partes[0];
  var codigo = partes[1];
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomeAba);
  if (!sheet || sheet.getLastRow() < 2) return null;
  var cab = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = mapearColunas(cab);
  if (map.codigo === undefined) return null;
  var col = sheet.getRange(2, map.codigo + 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) {
    if (String(col[i][0]).trim() === String(codigo).trim()) {
      return { sheet: sheet, map: map, row: i + 2, cab: cab };
    }
  }
  return null;
}

function atualizarTransacao(id, p) {
  var loc = localizarLinha(id);
  if (!loc) throw 'Transação não encontrada';
  var range = loc.sheet.getRange(loc.row, 1, 1, loc.cab.length);
  var linha = range.getValues()[0];
  var map = loc.map;

  if (p.descricao !== undefined && map.compra !== undefined) linha[map.compra] = p.descricao;
  if (p.categoriaId !== undefined && map.categoria !== undefined) linha[map.categoria] = p.categoriaId;
  if (p.metodoPagamento !== undefined && map.forma !== undefined) linha[map.forma] = p.metodoPagamento;
  if (p.dataTransacao !== undefined && map.data !== undefined) linha[map.data] = formatarDataBR(p.dataTransacao);
  if (p.valor !== undefined && map.valor !== undefined) {
    var tipo = p.tipo || (parseValor(linha[map.valor]) < 0 ? 'receita' : 'despesa');
    linha[map.valor] = (tipo === 'receita' ? -1 : 1) * (Number(p.valor) || 0);
  }
  range.setValues([linha]);

  var codigo = String(id).split('||')[1];
  return montarRetorno(loc.sheet.getName(), codigo, p);
}

function deletarTransacao(id) {
  var loc = localizarLinha(id);
  if (loc) loc.sheet.deleteRow(loc.row);
}

function montarRetorno(nomeAba, codigo, p) {
  return {
    id: nomeAba + '||' + codigo,
    categoriaId: p.categoriaId || '',
    categoriaNome: p.categoriaId || '',
    descricao: p.descricao || '',
    valor: Math.abs(Number(p.valor) || 0),
    dataTransacao: p.dataTransacao || '',
    competencia: competenciaDaAba(nomeAba) || (p.dataTransacao ? String(p.dataTransacao).substring(0, 7) : ''),
    tipo: p.tipo || 'despesa',
    metodoPagamento: p.metodoPagamento || '',
    notas: p.notas || '',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
}

// ---------------------------------------------------------------------------
// Conversões de valor e data (formato brasileiro)
// ---------------------------------------------------------------------------

function parseValor(v) {
  if (typeof v === 'number') return v;
  var s = String(v || '').replace(/r\$/i, '').replace(/\s/g, '');
  if (!s) return 0;
  var negativo = s.indexOf('-') >= 0 || (s.indexOf('(') >= 0 && s.indexOf(')') >= 0);
  s = s.replace(/[()\-]/g, '');
  // remove separador de milhar (.) e troca vírgula decimal por ponto
  if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  var n = parseFloat(s);
  if (isNaN(n)) return 0;
  return negativo ? -n : n;
}

function parseData(v) {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  var s = String(v || '').trim();
  // dd/mm/yyyy  ou  dd/mm/yy
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    var ano = m[3].length === 2 ? '20' + m[3] : m[3];
    return ano + '-' + pad2(m[2]) + '-' + pad2(m[1]);
  }
  // yyyy-mm-dd (já ok)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return s;
}

function formatarDataBR(v) {
  var iso = parseData(v);
  var m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  return iso;
}

function pad2(n) { n = String(n); return n.length < 2 ? '0' + n : n; }
