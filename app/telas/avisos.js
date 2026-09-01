// avisos.js — tela de avisos operacionais do dia. Chave: 'avisos'.
//
// ESTA E A TELA DE REFERENCIA. As telas da ONDA 3 replicam a estrutura daqui:
//
//   1. importar `registrar` de ../telas.js, os dados de ../dados.js,
//      o dia de ../estado.js e os formatadores de ../formato.js;
//   2. escrever funcoes puras que MONTAM nós de DOM (nada de innerHTML com
//      dado vindo do JSON — o texto entra sempre por textContent);
//   3. no `render(elemento, params)`, ler o estado, montar e dar `elemento.append(...)`;
//   4. chamar `registrar` com a propria chave, `{ titulo, render }`, no fim
//      do arquivo — uma chamada por arquivo, nunca duas.
//
// O `render` recebe o <main id="tela"> JA LIMPO — nao precisa limpar nada.
// Trocar o dia re-executa `render` sozinho (estado.js cuida disso): a tela nao
// observa nada, so le `diaSelecionado()` a cada renderizacao.

import { registrar } from '../telas.js';
import { avisosDoDia } from '../dados.js';
import { diaSelecionado } from '../estado.js';

/** Rotulo textual da severidade — a cor nunca e o unico indicador (RNF-06). */
const ROTULO_SEVERIDADE = {
  alta: 'Atenção',
  media: 'Importante',
  info: 'Informação',
};

/**
 * Formata 'AAAA-MM-DD' como 'sexta, 05/09'.
 * @param {string} diaISO
 * @returns {string}
 */
export function rotuloDia(diaISO) {
  const [ano, mes, dia] = diaISO.split('-').map(Number);
  const nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const semana = nomes[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  return semana + ', ' + String(dia).padStart(2, '0') + '/' + String(mes).padStart(2, '0');
}

/**
 * Descreve o alcance de um aviso em texto.
 * @param {object} aviso
 * @returns {string}
 */
function alcance(aviso) {
  if (aviso.linhas === 'todas') return 'Todas as linhas';
  const total = aviso.linhas.length;
  return total === 1 ? 'Linha ' + aviso.linhas[0] : total + ' linhas: ' + aviso.linhas.join(', ');
}

/**
 * Monta o cartao de um aviso.
 * @param {object} aviso
 * @returns {HTMLElement}
 */
function cartaoAviso(aviso) {
  const artigo = document.createElement('article');
  artigo.className = 'aviso aviso--' + aviso.severidade;

  const marca = document.createElement('span');
  marca.className = 'aviso__severidade';
  marca.textContent = ROTULO_SEVERIDADE[aviso.severidade] ?? aviso.severidade;
  artigo.append(marca);

  const texto = document.createElement('p');
  texto.className = 'aviso__texto';
  texto.textContent = aviso.texto;
  artigo.append(texto);

  const escopo = document.createElement('p');
  escopo.className = 'aviso__alcance';
  escopo.textContent = alcance(aviso);
  artigo.append(escopo);

  return artigo;
}

/**
 * Renderiza a lista de avisos do dia selecionado.
 * @param {HTMLElement} elemento <main id="tela">, ja limpo
 */
function render(elemento) {
  const dia = diaSelecionado();
  const avisos = avisosDoDia(dia);

  const secao = document.createElement('section');
  secao.className = 'tela-avisos';

  const titulo = document.createElement('h2');
  titulo.textContent = 'Avisos operacionais';
  secao.append(titulo);

  const subtitulo = document.createElement('p');
  subtitulo.className = 'tela-avisos__dia';
  subtitulo.textContent = rotuloDia(dia);
  secao.append(subtitulo);

  if (avisos.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'estado-vazio';
    vazio.textContent = 'Nenhum aviso para este dia.';
    secao.append(vazio);
    elemento.append(secao);
    return;
  }

  const lista = document.createElement('ul');
  lista.className = 'lista-avisos';
  for (const aviso of avisos) {
    const item = document.createElement('li');
    item.append(cartaoAviso(aviso));
    lista.append(item);
  }
  secao.append(lista);

  elemento.append(secao);
}

registrar('avisos', { titulo: 'Avisos', render });
