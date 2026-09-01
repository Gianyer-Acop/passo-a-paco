// quadro.js — quadro horario completo, por turno e TAB. Chave: 'quadro'.
//
// STUB DA TASK-02. A implementacao e da TASK-07 (ONDA 3), que detem
// EXCLUSIVAMENTE este arquivo e assets/css/telas/quadro.css.
//
// Padrao de tela: replicar app/telas/avisos.js.
// Nao renomear a chave 'quadro', nao registrar chave nova.
//
// Params: { numero }.
// Fonte: `dias[dia].turnos[]` -> `{ nome, tabelas[] }`;
//        tabela -> `{ tab, veiculo, tipoVeiculo, jornada, viagens[] }`;
//        viagem -> `{ ida, volta, termino, tempoViagem, linha, veiculo, tipo, continuacao }`.
// `tipo: 'continuacao'` tem `volta: null`; `tipo: 'baixada'` tem `ida: null`.
//
// CONTRATO CONGELADO NA TASK-02 — a TASK-06 importa esta funcao:
//   export function renderizarQuadroCompleto(elemento, objetoLinha, diaISO)
// A assinatura nao pode mudar. O stub ja a exporta para o import nao quebrar.

import { registrar } from '../telas.js';

function render(elemento, params) {
  const p = document.createElement('p');
  p.className = 'estado-vazio';
  p.textContent = 'Tela "quadro" ainda nao implementada (TASK-07).';
  elemento.append(p);
}

/**
 * Contrato congelado na TASK-02, consumido pela TASK-06.
 * @param {HTMLElement} elemento contentor onde o quadro e renderizado
 * @param {object} objetoLinha objeto da linha vindo de dados.linha(numero)
 * @param {string} diaISO 'AAAA-MM-DD'
 */
export function renderizarQuadroCompleto(elemento, objetoLinha, diaISO) {
  const p = document.createElement('p');
  p.className = 'estado-vazio';
  p.textContent = 'Quadro completo ainda nao implementado (TASK-07).';
  elemento.append(p);
}

registrar('quadro', { titulo: 'Quadro horário', render });
