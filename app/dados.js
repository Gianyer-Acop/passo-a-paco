// dados.js — acesso unico a dados/dados.json.
//
// O JSON e carregado UMA vez e fica memoizado. `carregar()` e assincrona;
// as demais funcoes sao sincronas e so respondem depois que ela resolveu
// (principal.js garante isso antes de renderizar qualquer tela).
//
// Assinaturas CONGELADAS (TASK-02), consumidas pelas telas da ONDA 3.

/** @type {Promise<object>|null} */
let promessa = null;
/** @type {object|null} */
let dados = null;

// Relativo a este modulo (app/), nao a pagina — funciona igual na raiz do
// GitHub Pages e em qualquer subdiretorio.
const URL_DADOS = new URL('../dados/dados.json', import.meta.url);

/**
 * Carrega dados/dados.json. Chamadas concorrentes compartilham a mesma
 * requisicao; chamadas posteriores devolvem o objeto ja em memoria.
 *
 * @returns {Promise<object>} o objeto completo do JSON
 */
export function carregar() {
  if (!promessa) {
    promessa = fetch(URL_DADOS)
      .then((resposta) => {
        if (!resposta.ok) throw new Error('Falha ao carregar dados.json: HTTP ' + resposta.status);
        return resposta.json();
      })
      .then((json) => {
        dados = json;
        return json;
      })
      .catch((erro) => {
        promessa = null; // permite nova tentativa depois de uma falha de rede
        throw erro;
      });
  }
  return promessa;
}

/**
 * Objeto completo ja carregado, ou null se `carregar()` ainda nao resolveu.
 * @returns {object|null}
 */
export function tudo() {
  return dados;
}

/**
 * Uma linha pelo numero. O numero e sempre string de 3 digitos no JSON ('011').
 *
 * @param {string|number} numero
 * @returns {object|undefined}
 */
export function linha(numero) {
  return dados?.linhas?.[String(numero)];
}

/**
 * Todas as linhas, como array, em ordem numerica crescente.
 * @returns {object[]}
 */
export function linhas() {
  if (!dados) return [];
  return Object.values(dados.linhas).sort((a, b) => String(a.numero).localeCompare(String(b.numero)));
}

/**
 * Os 4 pontos de embarque, na ordem P1..P4.
 * @returns {object[]}
 */
export function pontos() {
  return dados?.pontos ?? [];
}

/**
 * Um ponto pelo id ('P1'..'P4').
 * @param {string} id
 * @returns {object|undefined}
 */
export function ponto(id) {
  return pontos().find((p) => p.id === id);
}

const ORDEM_SEVERIDADE = { alta: 0, media: 1, info: 2 };

/**
 * Avisos aplicaveis a uma linha num dia, ja ordenados por severidade
 * (alta > media > info) e, dentro da mesma severidade, na ordem do JSON.
 *
 * Um aviso vale para a linha quando `linhas === 'todas'` ou quando o numero
 * aparece na lista; e vale para o dia quando o dia esta em `dias[]`.
 * O campo `linha.avisos` do JSON e ignorado de proposito: ele nao filtra por dia.
 *
 * @param {string|number} numero
 * @param {string} diaISO 'AAAA-MM-DD'
 * @returns {object[]}
 */
export function avisosDe(numero, diaISO) {
  const num = String(numero);
  return avisosDoDia(diaISO).filter((a) => a.linhas === 'todas' || (Array.isArray(a.linhas) && a.linhas.includes(num)));
}

/**
 * Só os avisos que citam ESTA linha pelo numero — os de `linhas: 'todas'`
 * ficam de fora.
 *
 * A tela da linha usa esta funcao, e nao `avisosDe`, para nao repetir os 6
 * avisos gerais que a aba Avisos ja mostra. `avisosDe` continua existindo
 * para quem precisar do conjunto completo.
 *
 * @param {string|number} numero
 * @param {string} diaISO 'AAAA-MM-DD'
 * @returns {object[]}
 */
export function avisosEspecificosDe(numero, diaISO) {
  const num = String(numero);
  return avisosDoDia(diaISO).filter((a) => Array.isArray(a.linhas) && a.linhas.includes(num));
}

/**
 * Os avisos gerais do dia (`linhas: 'todas'`), que valem para toda a operacao.
 * @param {string} diaISO
 * @returns {object[]}
 */
export function avisosGeraisDoDia(diaISO) {
  return avisosDoDia(diaISO).filter((a) => a.linhas === 'todas');
}

/** Id do aviso que marca as linhas com viagem extra depois da meia-noite. */
const AVISO_VIAGEM_EXTRA = 'viagem-extra-00h';

/**
 * A linha faz viagem extra a partir das 00h neste dia?
 * Lido do proprio aviso, para nao duplicar a lista de linhas em dois lugares.
 *
 * @param {string|number} numero
 * @param {string} diaISO
 * @returns {boolean}
 */
export function temViagemExtra(numero, diaISO) {
  return avisosEspecificosDe(numero, diaISO).some((a) => a.id === AVISO_VIAGEM_EXTRA);
}

/**
 * Todos os avisos de um dia, ordenados por severidade.
 * @param {string} diaISO
 * @returns {object[]}
 */
export function avisosDoDia(diaISO) {
  const avisos = dados?.avisos ?? [];
  return avisos
    .filter((a) => Array.isArray(a.dias) && a.dias.includes(diaISO))
    .sort((a, b) => (ORDEM_SEVERIDADE[a.severidade] ?? 9) - (ORDEM_SEVERIDADE[b.severidade] ?? 9));
}

/**
 * Carimbo de geracao do JSON, para o rodape.
 * @returns {string|undefined} ISO 8601 com offset
 */
export function versaoDados() {
  return dados?.versaoDados;
}
