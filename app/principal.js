// principal.js — ponto de entrada. Carrega os dados, liga os controles do
// cabecalho (dias, abas, busca) e renderiza a primeira tela.
//
// Os imports de app/telas/*.js sao por efeito colateral: cada modulo se
// registra em telas.js ao ser importado. Tela nova = import novo aqui.

import { carregar } from './dados.js';
import { diaVigente } from './formato.js';
import {
  diaSelecionado,
  selecionarDia,
  irPara,
  telaAtual,
  aoMudar,
  voltar,
  destinoDeVolta,
} from './estado.js';
import { ponto, linha } from './dados.js';
import { montarRodape } from './rodape.js';

import './telas/mapa.js';
import './telas/busca.js';
import './telas/ponto.js';
import './telas/linha.js';
import './telas/quadro.js';
import './telas/avisos.js';

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

/** Liga as abas Mapa / Avisos e mantem o aria-selected em dia. */
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
 * Texto do botao de voltar, a partir do destino guardado na pilha.
 * Nomear o destino ("Voltar para o Ponto 02") evita a duvida de para onde o
 * botao leva quando o operador chegou na linha pela busca e nao pelo mapa.
 *
 * @param {{chave: string, params: object}} destino
 * @returns {string}
 */
function rotuloDeVolta(destino) {
  if (destino.chave === 'ponto') {
    const p = ponto(destino.params.id);
    if (p) return '← Voltar para o Ponto ' + String(p.numero).padStart(2, '0');
    return '← Voltar para o ponto';
  }
  if (destino.chave === 'linha') {
    const l = linha(destino.params.numero);
    return '← Voltar para a linha ' + (l?.numero ?? destino.params.numero);
  }
  if (destino.chave === 'mapa') return '← Voltar para o mapa';
  if (destino.chave === 'busca') return '← Voltar para a busca';
  if (destino.chave === 'avisos') return '← Voltar para os avisos';
  if (destino.chave === 'quadro') return '← Voltar para o quadro';
  return '← Voltar';
}

/** Liga o botao de voltar do cabecalho ao historico de app/estado.js. */
function ligarVoltar() {
  const botao = document.getElementById('voltar');
  if (!botao) return;

  botao.addEventListener('click', () => {
    voltar();
    // Devolve o foco ao conteudo: sem isto o leitor de tela continua anunciando
    // o botao, que acabou de sumir.
    //
    // `preventScroll` importa: focar um elemento o traz para a viewport, e o
    // topo do <main> fica ATRAS da barra fixa. Sem isto o foco desfaria o
    // scrollTo(0,0) que voltar() acabou de fazer e a tela abriria com as
    // primeiras linhas escondidas sob os controles.
    document.getElementById('tela')?.focus({ preventScroll: true });
  });

  const sincronizar = () => {
    const destino = destinoDeVolta();
    botao.hidden = destino === null;
    if (destino) botao.textContent = rotuloDeVolta(destino);
  };
  aoMudar(sincronizar);
  sincronizar();
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
    // Digitar "608" sao tres eventos de input. Sem `substituir`, cada tecla
    // empilharia uma entrada e o operador precisaria voltar tres vezes.
    irPara('busca', { termo }, { substituir: telaAtual().chave === 'busca' });
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
  ligarVoltar();

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
