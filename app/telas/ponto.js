// ponto.js — lista de linhas de um ponto de embarque. Chave: 'ponto'.
//
// Implementacao da TASK-05 (ONDA 3).
// Padrao de tela: replicado de app/telas/avisos.js.
//
// Params: { id } — 'P1'..'P4'.
// Fonte: `ponto(id)` de ../dados.js; as linhas do ponto estao em `linhas[]`.
// Clique -> irPara('linha', { numero }).

import { registrar } from '../telas.js';
import { ponto, linha, temViagemExtra } from '../dados.js';
import { irPara, diaSelecionado } from '../estado.js';

/**
 * Formata 'AAAA-MM-DD' como 'sexta, 05/09'.
 * @param {string} diaISO
 * @returns {string}
 */
function rotuloDia(diaISO) {
  const [ano, mes, dia] = diaISO.split('-').map(Number);
  const nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const semana = nomes[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  return semana + ', ' + String(dia).padStart(2, '0') + '/' + String(mes).padStart(2, '0');
}

/**
 * Monta o cartao de uma linha.
 * @param {object} lin objeto da linha
 * @param {string} dia 'AAAA-MM-DD' — decide o selo de viagem extra
 * @returns {HTMLElement}
 */
function cartaoLinha(lin, dia) {
  const artigo = document.createElement('article');
  artigo.className = 'linha';
  artigo.role = 'button';
  artigo.tabIndex = 0;
  artigo.addEventListener('click', () => {
    irPara('linha', { numero: lin.numero });
  });
  artigo.addEventListener('keydown', (evt) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      irPara('linha', { numero: lin.numero });
    }
  });

  const numero = document.createElement('span');
  numero.className = 'linha__numero numero-linha';
  numero.textContent = lin.numero;
  artigo.append(numero);

  const nome = document.createElement('span');
  nome.className = 'linha__nome';
  if (lin.nome) {
    nome.textContent = lin.nome;
  }
  artigo.append(nome);

  const marcadores = document.createElement('span');
  marcadores.className = 'linha__marcadores';

  if (!lin.temProgramacaoEvento) {
    const marcador = document.createElement('span');
    marcador.className = 'linha__marcador';
    marcador.textContent = 'sem alteração';
    marcadores.append(marcador);
  }

  // Linhas que rodam viagem extra depois da meia-noite sao as que o operador
  // mais precisa achar na lista — o selo vem com texto, nunca so cor (RNF-06).
  if (temViagemExtra(lin.numero, dia)) {
    const extra = document.createElement('span');
    extra.className = 'linha__marcador linha__marcador--extra';
    extra.textContent = 'viagem extra após 00h';
    marcadores.append(extra);
  }

  if (marcadores.childElementCount > 0) artigo.append(marcadores);

  return artigo;
}

/**
 * Renderiza a lista de linhas do ponto selecionado.
 * @param {HTMLElement} elemento <main id="tela">, ja limpo
 * @param {object} params { id }
 */
function render(elemento, params) {
  const p = ponto(params.id);
  if (!p) {
    const erro = document.createElement('div');
    erro.className = 'estado-erro';
    const titulo = document.createElement('h2');
    titulo.textContent = 'Ponto nao encontrado';
    erro.append(titulo);
    elemento.append(erro);
    return;
  }

  const dia = diaSelecionado();
  const secao = document.createElement('section');
  secao.className = 'tela-ponto ponto-' + p.id.toLowerCase();

  const titulo = document.createElement('h2');
  titulo.textContent = 'Ponto ' + p.numero;
  secao.append(titulo);

  const cabecalho = document.createElement('div');
  cabecalho.className = 'tela-ponto__cabecalho';

  const zonas = document.createElement('p');
  zonas.className = 'tela-ponto__zonas';
  zonas.textContent = p.zonas;
  cabecalho.append(zonas);

  const subtitulo = document.createElement('p');
  subtitulo.className = 'tela-ponto__dia';
  subtitulo.textContent = rotuloDia(dia);
  cabecalho.append(subtitulo);

  secao.append(cabecalho);

  const lista = document.createElement('ul');
  lista.className = 'lista-linhas';

  const linhasOrdenadas = p.linhas
    .map((num) => linha(num))
    .filter((lin) => lin !== undefined)
    .sort((a, b) => String(a.numero).localeCompare(String(b.numero), undefined, { numeric: true }));

  for (const lin of linhasOrdenadas) {
    const item = document.createElement('li');
    item.append(cartaoLinha(lin, dia));
    lista.append(item);
  }

  secao.append(lista);
  elemento.append(secao);
}

registrar('ponto', { titulo: 'Linhas do ponto', render });
