// formato.js — formatadores e a nocao de "dia operacional".
//
// Modulo puro: nao importa nada, nao toca no DOM, nao le dados.
// As quatro assinaturas abaixo estao CONGELADAS (TASK-02) e sao consumidas
// pelas telas da ONDA 3. Nao alterar sem alterar o teste-guarda junto.
//
// Vocabulario:
//   dia operacional  — o dia do evento ao qual um horario pertence. Vai das 03:00
//                      as 02:59 do dia civil seguinte. A madrugada de sabado
//                      pertence, operacionalmente, a sexta-feira.
//   HH:MM >= 24:00   — horario da madrugada seguinte, como vem da planilha
//                      ("25:52" = 01:52 do dia civil seguinte).

/** Dias do evento, em ordem. */
export const DIAS_EVENTO = ['2026-09-05', '2026-09-06', '2026-09-07'];

/** Hora em que o dia operacional vira. */
const HORA_VIRADA = 3;

const FUSO = 'America/Manaus';

/**
 * Formata um horario da planilha para exibicao.
 * Horarios >= 24:00 viram a hora civil correspondente com o sufixo "(+1)".
 *
 *   hora('05:19') -> '05:19'
 *   hora('25:52') -> '01:52 (+1)'
 *
 * @param {string} hhmm horario cru, como vem de `passagens[]`
 * @returns {string}
 */
export function hora(hhmm) {
  if (typeof hhmm !== 'string' || !hhmm.includes(':')) return '';
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  const civil = h % 24;
  const texto = String(civil).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  return h >= 24 ? texto + ' (+1)' : texto;
}

/**
 * Minutos desde 00:00 do dia operacional. Preserva a faixa >= 24h,
 * o que torna a comparacao entre horarios da noite e da madrugada trivial.
 *
 *   minutos('05:19') ->  319
 *   minutos('25:52') -> 1552
 *
 * @param {string} hhmm
 * @returns {number} NaN se a entrada nao for um horario
 */
export function minutos(hhmm) {
  if (typeof hhmm !== 'string' || !hhmm.includes(':')) return NaN;
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

/**
 * Partes de data/hora de um instante, no fuso de Manaus.
 * Usa Intl (nunca offset fixo) para nao errar se a regra de fuso mudar.
 *
 * @param {Date} instante
 * @returns {{ano:number, mes:number, dia:number, hora:number, minuto:number}}
 */
function partesEmManaus(instante) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instante);

  const valor = (tipo) => Number(partes.find((p) => p.type === tipo).value);
  return {
    ano: valor('year'),
    mes: valor('month'),
    dia: valor('day'),
    hora: valor('hour'),
    minuto: valor('minute'),
  };
}

/** Formata ano/mes/dia como 'AAAA-MM-DD'. */
function paraISO({ ano, mes, dia }) {
  return ano + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
}

/**
 * Dia do evento vigente agora, em America/Manaus, com a virada as 03h.
 * Entre 00:00 e 02:59 devolve o dia ANTERIOR — a madrugada ainda e do dia
 * operacional que acabou.
 *
 * Fora de 05-07/09/2026 devolve o primeiro dia do evento com `foraDoEvento: true`,
 * para a interface poder avisar que esta mostrando programacao fora da vigencia.
 *
 * @param {Date} [agora]
 * @returns {{dia: string, foraDoEvento: boolean}}
 */
export function diaVigente(agora = new Date()) {
  const dia = diaOperacional(agora);

  return DIAS_EVENTO.includes(dia)
    ? { dia, foraDoEvento: false }
    : { dia: DIAS_EVENTO[0], foraDoEvento: true };
}

/**
 * Dia operacional corrente em Manaus, SEM limitar aos dias do evento.
 *
 * `diaVigente` grampeia o resultado no primeiro dia do evento quando esta fora
 * dele, o que perde a informacao de "antes" ou "depois" — e e justamente essa
 * distincao que `diasLiberados` precisa.
 *
 * @param {Date} [agora]
 * @returns {string} 'AAAA-MM-DD'
 */
function diaOperacional(agora = new Date()) {
  const partes = partesEmManaus(agora);

  // A subtracao e feita em UTC so para nao reintroduzir fuso no calculo de calendario.
  const emUTC = Date.UTC(partes.ano, partes.mes - 1, partes.dia);
  const ajustado = new Date(partes.hora < HORA_VIRADA ? emUTC - 86400000 : emUTC);
  return paraISO({
    ano: ajustado.getUTCFullYear(),
    mes: ajustado.getUTCMonth() + 1,
    dia: ajustado.getUTCDate(),
  });
}

/**
 * Dias do evento que o operador pode abrir AGORA.
 *
 * Existe por um motivo de seguranca operacional, nao de interface: na correria
 * do ponto, um toque errado no seletor de dia abre o quadro de outro dia sem
 * nenhum sinal evidente, e o operador passa a informar horario de um dia que
 * nao e o de hoje. Fechar os dias que nao estao em operacao elimina o erro.
 *
 *   durante o evento  -> so o dia em operacao (passados E futuros fechados)
 *   antes do evento   -> os tres, para a equipe conferir na preparacao
 *   depois do evento  -> so o ultimo dia, que foi o ultimo em operacao
 *
 * A comparacao de strings basta: 'AAAA-MM-DD' ordena igual a data.
 *
 * @param {Date} [agora]
 * @returns {string[]} subconjunto de DIAS_EVENTO, sempre com pelo menos um dia
 */
export function diasLiberados(agora = new Date()) {
  const dia = diaOperacional(agora);

  if (DIAS_EVENTO.includes(dia)) return [dia];
  if (dia < DIAS_EVENTO[0]) return [...DIAS_EVENTO];
  return [DIAS_EVENTO[DIAS_EVENTO.length - 1]];
}

/**
 * Minuto corrente dentro do dia operacional, em Manaus.
 * A madrugada (00:00–02:59) e projetada para a faixa 24:00–26:59, na mesma
 * escala que `minutos()` — e por isso que 01:00 "alcanca" a passagem 25:47.
 *
 * @param {Date} instante
 * @returns {number}
 */
function minutoOperacional(instante) {
  const { hora: h, minuto } = partesEmManaus(instante);
  const base = h * 60 + minuto;
  return h < HORA_VIRADA ? base + 1440 : base;
}

/**
 * Proxima passagem prevista pelo ponto, dentro do dia operacional corrente.
 *
 * `hora` e o valor BRUTO de `passagens[]` — pode ser '25:47'.
 * Quem exibe deve passar por `hora()` antes. Isso e proposital: o consumidor
 * decide o formato, o calculo nao perde a informacao de madrugada.
 *
 * @param {string[]} passagens lista crescente de horarios ('HH:MM', podendo passar de 24h)
 * @param {Date} [agora]
 * @returns {{hora: string, emMinutos: number} | null} null se nao ha mais passagens hoje
 */
export function proximaPassagem(passagens, agora = new Date()) {
  if (!Array.isArray(passagens) || passagens.length === 0) return null;

  const agoraMin = minutoOperacional(agora);
  for (const passagem of passagens) {
    const min = minutos(passagem);
    if (Number.isFinite(min) && min >= agoraMin) {
      return { hora: passagem, emMinutos: min - agoraMin };
    }
  }
  return null;
}
