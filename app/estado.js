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
import { DIAS_EVENTO } from './formato.js';

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
  if (!DIAS_EVENTO.includes(diaISO) || diaISO === dia) return;
  dia = diaISO;
  notificar();
  if (atual.chave) renderizar(atual.chave, atual.params);
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
 * @param {{substituir?: boolean}} [opcoes] `substituir: true` troca a tela
 *   corrente sem empilhar — use quando a navegacao e uma correcao da anterior,
 *   como cada tecla digitada na busca.
 */
export function irPara(chaveTela, params = {}, opcoes = {}) {
  if (TELAS_RAIZ.includes(chaveTela)) {
    pilha = [];
  } else if (!opcoes.substituir && atual.chave) {
    pilha.push({ chave: atual.chave, params: { ...atual.params } });
  }

  atual = { chave: chaveTela, params };
  notificar();
  renderizar(chaveTela, params);
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
