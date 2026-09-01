// principal.js — ponto de entrada. Carrega os dados, liga os controles do
// cabecalho (dias, abas, busca) e renderiza a primeira tela.
//
// Os imports de app/telas/*.js sao por efeito colateral: cada modulo se
// registra em telas.js ao ser importado. Tela nova = import novo aqui.

import { carregar } from './dados.js';
import { diaVigente } from './formato.js';
import { diaSelecionado, selecionarDia, irPara, telaAtual, aoMudar } from './estado.js';
import { montarRodape } from './rodape.js';

import './telas/mapa.js';
import './telas/busca.js';
import './telas/ponto.js';
import './telas/linha.js';
import './telas/quadro.js';
import './telas/avisos.js';
import './telas/circulacao.js';

const TELA_INICIAL = 'mapa';

/** Liga os tres botoes de dia e mantem o aria-pressed em dia com o estado. */
function ligarBotoesDeDia() {
  const botoes = [...document.querySelectorAll('#dias .botao-dia')];

  for (const botao of botoes) {
    botao.addEventListener('click', () => selecionarDia(botao.dataset.dia));
  }

  const sincronizar = () => {
    for (const botao of botoes) {
      botao.setAttribute('aria-pressed', String(botao.dataset.dia === diaSelecionado()));
    }
  };
  aoMudar(sincronizar);
  sincronizar();
}

/** Liga as abas Mapa / Circulacao / Avisos e mantem o aria-selected em dia. */
function ligarAbas() {
  const abas = [...document.querySelectorAll('#abas .aba')];

  for (const aba of abas) {
    aba.addEventListener('click', () => irPara(aba.dataset.tela));
  }

  aoMudar(() => {
    const chave = telaAtual().chave;
    for (const aba of abas) {
      aba.setAttribute('aria-selected', String(aba.dataset.tela === chave));
    }
  });
}

/**
 * Liga o campo de busca do cabecalho.
 *
 * CONTRATO com a TASK-04: cada digitacao chama `irPara('busca', { termo })`.
 * Termo vazio volta para a tela 'mapa'. O input vive no <header>, fora do
 * <main id="tela">, entao a re-renderizacao nao tira o foco nem o cursor.
 */
function ligarBusca() {
  const campo = document.getElementById('busca');
  if (!campo) return;

  campo.addEventListener('input', () => {
    const termo = campo.value.trim();
    if (termo === '') {
      if (telaAtual().chave === 'busca') irPara(TELA_INICIAL);
      return;
    }
    irPara('busca', { termo });
  });
}

/** Aviso persistente de que hoje esta fora dos tres dias do evento. */
function avisarForaDoEvento() {
  const alvo = document.querySelector('#cabecalho .envolve');
  if (!alvo) return;

  const faixa = document.createElement('p');
  faixa.className = 'fora-do-evento';
  faixa.setAttribute('role', 'status');
  faixa.textContent = 'Fora dos dias do evento (05 a 07/09/2026). Mostrando a programação de 05/09.';
  alvo.append(faixa);
}

/** Tela de erro quando os dados nao carregam — nunca uma pagina em branco. */
function mostrarFalhaDeCarga(erro) {
  console.error(erro);
  const elemento = document.getElementById('tela');
  if (!elemento) return;

  const bloco = document.createElement('div');
  bloco.className = 'estado-erro';
  bloco.setAttribute('role', 'alert');

  const titulo = document.createElement('h2');
  titulo.textContent = 'Não foi possível carregar a programação';
  bloco.append(titulo);

  const texto = document.createElement('p');
  texto.textContent = 'Verifique a conexão e recarregue a página.';
  bloco.append(texto);

  elemento.replaceChildren(bloco);
}

async function iniciar() {
  ligarBotoesDeDia();
  ligarAbas();
  ligarBusca();

  try {
    await carregar();
  } catch (erro) {
    mostrarFalhaDeCarga(erro);
    return;
  }

  const { dia, foraDoEvento } = diaVigente();
  selecionarDia(dia);
  if (foraDoEvento) avisarForaDoEvento();

  montarRodape();
  irPara(TELA_INICIAL);
}

iniciar();
