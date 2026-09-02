// estado.js — dia selecionado, tela corrente e navegacao.
//
// Regra que vale mais que o resto (RF-04): trocar de dia NAO recarrega a pagina
// e NAO tira o operador da tela em que ele esta. Ele so re-renderiza a mesma tela
// com o novo dia.
//
// Alem do dia e da tela corrente, este modulo guarda a PILHA de navegacao, que
// alimenta o botao "Voltar" do cabecalho. Tres regras a mantem util:
//
//   - as abas (mapa, avisos) sao raiz: `irPara` sem `substituir` a partir delas
//     comeca uma pilha nova, entao o botao nao aparece numa aba;
//   - a busca usa `substituir`, senao digitar "608" empilharia tres entradas;
//   - trocar de dia NAO mexe na pilha — re-renderiza a mesma tela (RF-04).
//
// Assinaturas CONGELADAS (TASK-02): `irPara` ganhou um terceiro parametro
// opcional, o que nao quebra nenhuma chamada existente.

import { renderizar } from './telas.js';
import { DIAS_EVENTO, diasLiberados } from './formato.js';

/** Telas que zeram a pilha: sao pontos de partida, nao destinos. */
const TELAS_RAIZ = ['mapa', 'avisos'];

let dia = DIAS_EVENTO[0];
let atual = { chave: null, params: {} };
/** Telas visitadas antes da atual, da mais antiga para a mais recente. */
let pilha = [];
const observadores = [];

function notificar() {
  for (const cb of observadores) {
    try {
      cb({ dia, tela: { ...atual } });
    } catch (erro) {
      console.error('Observador de estado falhou:', erro);
    }
  }
}

/**
 * Dia do evento selecionado, 'AAAA-MM-DD'.
 * @returns {string}
 */
export function diaSelecionado() {
  return dia;
}

/**
 * Troca o dia e re-renderiza a tela corrente com os mesmos params.
 * Ignora dias fora do evento e a troca para o dia ja selecionado.
 *
 * Antes da primeira renderizacao (principal.js define o dia inicial), apenas
 * atualiza o estado e avisa os observadores — nao ha tela para re-renderizar.
 *
 * @param {string} diaISO
 */
export function selecionarDia(diaISO) {
  // O bloqueio mora AQUI, e nao so no botao desabilitado do cabecalho: e a
  // unica porta de entrada da troca de dia, entao um dia fechado nao passa nem
  // por chamada direta nem por um botao que tenha escapado da sincronizacao.
  if (!diasLiberados().includes(diaISO) || diaISO === dia) return;
  dia = diaISO;
  notificar();
  if (atual.chave) renderizar(atual.chave, atual.params);
}

/**
 * Leva a rolagem para o topo depois de TROCAR de tela.
 *
 * So na navegacao: `selecionarDia` nao chama isto, porque trocar o dia nao muda
 * de tela e jogar o operador para o topo no meio da grade seria perda de lugar
 * (RF-04). Sem esta funcao, sair de uma linha longa para a aba Avisos abria a
 * tela nova ja rolada para baixo, mostrando o meio dela.
 *
 * `behavior: 'instant'` de proposito: a tela nova ja esta montada, e uma
 * animacao so atrasaria o operador.
 */
function irParaOTopo() {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

/**
 * Navega para uma tela.
 *
 *   irPara('linha', { numero: '608' })
 *   irPara('ponto', { id: 'P1' })
 *   irPara('busca', { termo: 'petropolis' }, { substituir: true })
 *
 * @param {string} chaveTela
 * @param {object} [params]
 * @param {{substituir?: boolean, empilhar?: boolean}} [opcoes]
 *   `substituir: true` troca a tela corrente sem empilhar — use quando a
 *   navegacao e uma correcao da anterior, como cada tecla digitada na busca.
 *   `empilhar: true` guarda o caminho de volta mesmo indo para uma tela raiz —
 *   e o caso do link "Ver avisos" dentro de uma linha: quem chegou aos avisos
 *   por ali quer voltar para a linha, ao contrario de quem clicou na aba.
 */
export function irPara(chaveTela, params = {}, opcoes = {}) {
  // Digitar na busca re-renderiza a mesma tela a cada tecla; rolar ao topo ai
  // brigaria com quem estivesse lendo os resultados enquanto refina o termo.
  const mesmaTela = atual.chave === chaveTela;

  if (TELAS_RAIZ.includes(chaveTela) && !opcoes.empilhar) {
    pilha = [];
  } else if (!opcoes.substituir && atual.chave) {
    pilha.push({ chave: atual.chave, params: { ...atual.params } });
  }

  atual = { chave: chaveTela, params };
  notificar();
  renderizar(chaveTela, params);
  if (!mesmaTela) irParaOTopo();
}

/**
 * Ha para onde voltar?
 * @returns {boolean}
 */
export function podeVoltar() {
  return pilha.length > 0;
}

/**
 * Tela para a qual `voltar()` vai, sem navegar. O cabecalho usa isto para
 * escrever o destino no botao ("Voltar para o Ponto 02").
 * @returns {{chave: string, params: object}|null}
 */
export function destinoDeVolta() {
  const anterior = pilha[pilha.length - 1];
  return anterior ? { chave: anterior.chave, params: { ...anterior.params } } : null;
}

/**
 * Volta uma tela. Sem historico, nao faz nada — o botao que a chama fica
 * escondido nesse caso, mas a funcao nao depende disso.
 * @returns {boolean} se houve navegacao
 */
export function voltar() {
  const anterior = pilha.pop();
  if (!anterior) return false;

  atual = { chave: anterior.chave, params: anterior.params };
  notificar();
  renderizar(anterior.chave, anterior.params);
  irParaOTopo();
  return true;
}

/**
 * Tela corrente. Copia defensiva — mexer no retorno nao altera o estado.
 * @returns {{chave: string|null, params: object}}
 */
export function telaAtual() {
  return { chave: atual.chave, params: { ...atual.params } };
}

/**
 * Observa mudancas de dia ou de tela. O callback recebe
 * `{ dia, tela: { chave, params } }` e e chamado DEPOIS da mudanca de estado
 * e ANTES da re-renderizacao.
 *
 * @param {(estado: {dia: string, tela: {chave: string|null, params: object}}) => void} callback
 */
export function aoMudar(callback) {
  observadores.push(callback);
}
