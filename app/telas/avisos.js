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
import { avisosDoDia, linha, ponto } from '../dados.js';
import { diaSelecionado, irPara } from '../estado.js';

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
 * Monta o alcance do aviso: "Todas as linhas", ou a lista das linhas afetadas
 * como chips clicaveis, cada um levando direto para a tela daquela linha.
 *
 * Esta e a face visivel dos avisos por linha: como a tela da linha nao mostra
 * mais aviso nenhum, e aqui que o operador ve QUEM sofreu a alteracao.
 *
 * Um numero que esta no aviso mas nao tem aba de escala (216, 705, ...) aparece
 * como chip apagado e sem clique — some-lo seria esconder da equipe uma linha
 * que a OS cita.
 *
 * @param {object} aviso
 * @returns {HTMLElement}
 */
function alcance(aviso) {
  const bloco = document.createElement('div');
  bloco.className = 'aviso__alcance';

  if (aviso.linhas === 'todas') {
    bloco.classList.add('aviso__alcance--todas');
    bloco.textContent = 'Todas as linhas';
    return bloco;
  }

  const rotulo = document.createElement('p');
  rotulo.className = 'aviso__alcance-rotulo';
  rotulo.textContent =
    aviso.linhas.length === 1 ? 'Linha afetada:' : aviso.linhas.length + ' linhas afetadas:';
  bloco.append(rotulo);

  const lista = document.createElement('ul');
  lista.className = 'aviso__linhas';

  for (const numero of aviso.linhas) {
    const item = document.createElement('li');
    const objetoLinha = linha(numero);

    if (!objetoLinha) {
      const inerte = document.createElement('span');
      inerte.className = 'chip-linha chip-linha--sem-quadro';
      inerte.textContent = numero;
      inerte.title = 'Linha citada na OS, sem quadro horário na base.';
      item.append(inerte);
      lista.append(item);
      continue;
    }

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip-linha';
    // A cor do ponto de embarque acompanha o chip, igual ao resto do site.
    const p = ponto(objetoLinha.pontoId);
    if (p) chip.classList.add('ponto-' + p.id.toLowerCase());
    chip.textContent = numero;
    chip.setAttribute(
      'aria-label',
      'Linha ' + numero + (p ? ', ponto ' + p.numero : '') + '. Ver a linha.',
    );
    chip.addEventListener('click', () => irPara('linha', { numero: objetoLinha.numero }));
    item.append(chip);
    lista.append(item);
  }

  bloco.append(lista);
  return bloco;
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

  artigo.append(alcance(aviso));

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
