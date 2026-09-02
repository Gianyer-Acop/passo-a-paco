// busca.js — resultado da busca de linhas. Chave: 'busca'.
//
// Implementacao da TASK-04. Padrao de tela: replica app/telas/avisos.js.
//
// Params: { termo } — vem do campo #busca do index.html, que principal.js liga
// a `irPara('busca', { termo })` a cada digitacao. O input fica no <header>,
// FORA do <main>, entao re-renderizar nao tira o foco nem o cursor do campo.
// Termo vazio nao chega aqui: principal.js volta para a tela 'mapa'.
//
// Fonte: `linhas()` de ../dados.js (77 linhas, ordem numerica).
// `nome` e null em 50 das 77 linhas — exibir so o numero, nunca a string 'null'.

import { registrar } from '../telas.js';
import { linhas, ponto, temViagemExtra } from '../dados.js';
import { irPara, diaSelecionado } from '../estado.js';

/**
 * Remove acentos e normaliza para minusculas, para comparacao sem acento e
 * sem diferenciar maiusculas/minusculas.
 * @param {string} texto
 * @returns {string}
 */
export function normalizar(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Filtra as linhas por numero (substring) ou por trecho do nome, sem acento
 * e sem diferenciar maiusculas/minusculas. Linhas com `nome: null` so
 * respondem por numero.
 *
 * @param {object[]} listaLinhas
 * @param {string} termo
 * @returns {object[]}
 */
export function filtrarLinhas(listaLinhas, termo) {
  const alvo = normalizar(termo);
  if (!alvo) return [];
  return listaLinhas.filter((linha) => {
    if (String(linha.numero).includes(alvo)) return true;
    if (typeof linha.nome === 'string' && normalizar(linha.nome).includes(alvo)) return true;
    return false;
  });
}

/**
 * Monta o item de resultado de uma linha.
 * @param {object} linha
 * @returns {HTMLElement}
 */
function itemLinha(linha) {
  const item = document.createElement('li');

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'resultado-busca';

  // O ponto de embarque e a primeira coisa que o operador procura ao digitar
  // um numero. Antes era so um circulo colorido de 14px: ilegivel no sol e
  // inutil para quem nao decorou o codigo de cores. Agora vem com o texto.
  const p = ponto(linha.pontoId);
  if (p) {
    const marcador = document.createElement('span');
    marcador.className = 'resultado-busca__ponto ponto-' + p.id.toLowerCase();
    marcador.textContent = 'Ponto ' + String(p.numero).padStart(2, '0');
    botao.append(marcador);
  }

  const textos = document.createElement('span');
  textos.className = 'resultado-busca__textos';

  const numero = document.createElement('span');
  numero.className = 'numero-linha resultado-busca__numero';
  numero.textContent = linha.numero;
  textos.append(numero);

  if (typeof linha.nome === 'string' && linha.nome.length > 0) {
    const nome = document.createElement('span');
    nome.className = 'resultado-busca__nome';
    nome.textContent = linha.nome;
    textos.append(nome);
  }

  botao.append(textos);

  const marcas = document.createElement('span');
  marcas.className = 'resultado-busca__marcas';

  if (linha.temProgramacaoEvento === false) {
    const marca = document.createElement('span');
    marca.className = 'resultado-busca__sem-alteracao';
    marca.textContent = 'sem alteração';
    marcas.append(marca);
  }

  if (temViagemExtra(linha.numero, diaSelecionado())) {
    const extra = document.createElement('span');
    extra.className = 'resultado-busca__extra';
    extra.textContent = 'extra 00h';
    marcas.append(extra);
  }

  if (marcas.childElementCount > 0) botao.append(marcas);

  botao.addEventListener('click', () => irPara('linha', { numero: linha.numero }));

  item.append(botao);
  return item;
}

/**
 * Renderiza o resultado da busca para o termo digitado.
 * @param {HTMLElement} elemento <main id="tela">, ja limpo
 * @param {{termo: string}} params
 */
function render(elemento, { termo }) {
  const secao = document.createElement('section');
  secao.className = 'tela-busca';

  const titulo = document.createElement('h2');
  titulo.textContent = 'Resultado da busca';
  secao.append(titulo);

  const resultados = filtrarLinhas(linhas(), termo);

  if (resultados.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'estado-vazio';
    vazio.textContent = 'Nenhuma linha encontrada para "' + termo + '". Consulte a escala regular.';
    secao.append(vazio);
    elemento.append(secao);
    return;
  }

  const lista = document.createElement('ul');
  lista.className = 'lista-busca';
  for (const linha of resultados) {
    lista.append(itemLinha(linha));
  }
  secao.append(lista);

  elemento.append(secao);
}

registrar('busca', { titulo: 'Busca de linhas', render });
