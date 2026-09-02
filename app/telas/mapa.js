// mapa.js — mapa dos 4 pontos de embarque. Chave: 'mapa'.
//
// Padrao de tela: replica app/telas/avisos.js.
//
// Renderiza assets/img/mapa-pontos.png com 4 hotspots clicaveis (posicionados
// em % via `ponto.hotspot`) e, abaixo, um cartao por ponto. Hotspot ou cartao
// levam a `irPara('ponto', { id })`.
//
// RNF-06: a cor nunca e o unico indicador — todo hotspot e cartao mostra o
// numero do ponto e a zona em texto (nao so pela cor de fundo).
//
// Edge case: P1 (y:28.4) e P2 (y:43.3) tem hotspots proximos no eixo vertical
// (assim como P3/y:63.2 e P4/y:72.5, mais proximos ainda em % da imagem).
// Para nao deixar os alvos se sobreporem, o tamanho de cada hotspot e
// recalculado em runtime a partir da altura real da imagem renderizada: por
// padrao usa --alvo-toque (44px), mas encolhe (nunca abaixo de um minimo)
// quando o vizinho mais proximo, em pixels, nao comporta dois alvos de 44px.
//
// Por que o piso e 24 e nao 44: em 360px de largura a arte renderiza com ~420px
// e os pins de P3 e P4 ficam a ~34px de distancia entre centros. Dois alvos de
// 44px ali se sobrepoem — nao ha codigo que resolva isso, e sobrepor seria pior
// (o operador tocaria o ponto errado). Acima de ~720px de conteudo todos os
// quatro voltam aos 44px cheios. Os cartoes abaixo do mapa oferecem, em qualquer
// largura, o alvo de 44px para os mesmos quatro destinos.
// sem sobrepor.

import { registrar } from '../telas.js';
import { pontos } from '../dados.js';
import { irPara } from '../estado.js';

const URL_IMAGEM = new URL('../../assets/img/mapa-pontos.png', import.meta.url);
const URL_IMAGEM_WEBP = new URL('../../assets/img/mapa-pontos.webp', import.meta.url);

const TAMANHO_ALVO_PADRAO = 44; // == --alvo-toque
const TAMANHO_ALVO_MINIMO = 24; // piso WCAG 2.2 AA (2.5.8 Target Size Minimum)

/**
 * Texto acessivel de um ponto: numero + zona (RNF-06 — nunca so a cor).
 * @param {object} p
 * @returns {string}
 */
function descricaoPonto(p) {
  return 'Ponto ' + p.numero + ' — ' + p.zonas;
}

/**
 * Monta o hotspot (botao) posicionado sobre a imagem, em %.
 * @param {object} p
 * @returns {HTMLButtonElement}
 */
function criarHotspot(p) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'mapa-hotspot ponto-p' + p.numero;
  botao.style.left = p.hotspot.x + '%';
  botao.style.top = p.hotspot.y + '%';
  botao.style.setProperty('--tamanho-hotspot', TAMANHO_ALVO_PADRAO + 'px');
  botao.textContent = String(p.numero);
  botao.setAttribute('aria-label', descricaoPonto(p) + '. Ver linhas do ponto.');
  botao.addEventListener('click', () => irPara('ponto', { id: p.id }));
  return botao;
}

/**
 * Monta o cartao de um ponto: numero, cor, zonas e contagem de linhas.
 * @param {object} p
 * @returns {HTMLButtonElement}
 */
function criarCartao(p) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'cartao-ponto ponto-p' + p.numero;

  const numero = document.createElement('span');
  numero.className = 'cartao-ponto__numero';
  numero.textContent = String(p.numero);
  botao.append(numero);

  const corpo = document.createElement('span');
  corpo.className = 'cartao-ponto__corpo';

  const zonas = document.createElement('span');
  zonas.className = 'cartao-ponto__zonas';
  zonas.textContent = 'Ponto ' + p.numero + ' — ' + p.zonas;
  corpo.append(zonas);

  const totalLinhas = p.linhas.length;
  const linhas = document.createElement('span');
  linhas.className = 'cartao-ponto__linhas';
  linhas.textContent = totalLinhas + (totalLinhas === 1 ? ' linha atendida' : ' linhas atendidas');
  corpo.append(linhas);

  botao.append(corpo);
  botao.addEventListener('click', () => irPara('ponto', { id: p.id }));
  return botao;
}

/**
 * Reduz o tamanho dos hotspots o minimo necessario para dois vizinhos
 * verticais nunca se sobreporem, a partir da altura real (em px) da imagem
 * ja renderizada. Sem vizinho apertado, o hotspot fica no padrao (44px).
 *
 * @param {HTMLImageElement} img
 * @param {object[]} listaPontos
 * @param {Map<string, HTMLElement>} botoesPorId
 */
function ajustarTamanhosHotspots(img, listaPontos, botoesPorId) {
  const alturaImg = img.clientHeight;
  if (!alturaImg) return;

  const ordenados = [...listaPontos].sort((a, b) => a.hotspot.y - b.hotspot.y);

  ordenados.forEach((p, i) => {
    let limite = TAMANHO_ALVO_PADRAO;
    if (i > 0) {
      const gapPx = ((p.hotspot.y - ordenados[i - 1].hotspot.y) / 100) * alturaImg;
      limite = Math.min(limite, gapPx - 2);
    }
    if (i < ordenados.length - 1) {
      const gapPx = ((ordenados[i + 1].hotspot.y - p.hotspot.y) / 100) * alturaImg;
      limite = Math.min(limite, gapPx - 2);
    }
    const tamanho = Math.max(TAMANHO_ALVO_MINIMO, Math.min(TAMANHO_ALVO_PADRAO, limite));
    const botao = botoesPorId.get(p.id);
    if (botao) botao.style.setProperty('--tamanho-hotspot', tamanho + 'px');
  });
}

/**
 * Renderiza a tela do mapa de pontos.
 * @param {HTMLElement} elemento <main id="tela">, ja limpo
 */
function render(elemento) {
  const listaPontos = pontos();

  const secao = document.createElement('section');
  secao.className = 'tela-mapa';

  const titulo = document.createElement('h2');
  titulo.textContent = 'Mapa de pontos de embarque';
  secao.append(titulo);

  const intro = document.createElement('p');
  intro.className = 'tela-mapa__intro';
  intro.textContent = 'Toque num ponto para ver as linhas atendidas.';
  secao.append(intro);

  const contentor = document.createElement('div');
  contentor.className = 'mapa-imagem';

  // <picture> serve o WebP (~97 KB) e cai no PNG em navegador sem suporte.
  // As duas versoes tem as MESMAS dimensoes: os hotspots abaixo sao
  // posicionados em % sobre a imagem renderizada e qualquer diferenca de
  // tamanho os deslocaria.
  const figura = document.createElement('picture');
  figura.className = 'mapa-imagem__figura';

  const fonteWebp = document.createElement('source');
  fonteWebp.type = 'image/webp';
  fonteWebp.srcset = URL_IMAGEM_WEBP.href;
  figura.append(fonteWebp);

  const img = document.createElement('img');
  img.className = 'mapa-imagem__img';
  img.src = URL_IMAGEM.href;
  img.alt = 'Mapa aereo da via de embarque, com os 4 pontos de onibus marcados ao longo dela: Ponto 01 (Zonas Sul, Centro-Sul e Centro-Oeste), Ponto 02 (Zona Oeste), Ponto 03 (Zona Leste) e Ponto 04 (Zona Norte), nesta ordem.';
  figura.append(img);

  contentor.append(figura);

  const botoesPorId = new Map();
  for (const p of listaPontos) {
    const botao = criarHotspot(p);
    botoesPorId.set(p.id, botao);
    contentor.append(botao);
  }

  secao.append(contentor);

  const lista = document.createElement('ul');
  lista.className = 'lista-pontos';
  for (const p of listaPontos) {
    const item = document.createElement('li');
    item.append(criarCartao(p));
    lista.append(item);
  }
  secao.append(lista);

  elemento.append(secao);

  const recalcular = () => ajustarTamanhosHotspots(img, listaPontos, botoesPorId);
  if (img.complete && img.naturalWidth > 0) {
    recalcular();
  } else {
    img.addEventListener('load', recalcular, { once: true });
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(recalcular).observe(img);
  } else {
    window.addEventListener('resize', recalcular);
  }
}

registrar('mapa', { titulo: 'Mapa de pontos', render });
