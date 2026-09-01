// ponto.js — lista de linhas de um ponto de embarque. Chave: 'ponto'.
//
// STUB DA TASK-02. A implementacao e da TASK-05 (ONDA 3), que detem
// EXCLUSIVAMENTE este arquivo e assets/css/telas/ponto.css.
//
// Padrao de tela: replicar app/telas/avisos.js.
// Nao renomear a chave 'ponto', nao registrar chave nova.
//
// Params: { id } — 'P1'..'P4'.
// Fonte: `ponto(id)` de ../dados.js; as linhas do ponto estao em
// `linhas[]`, com o recorte pronto em `linhasComProgramacao[]` e
// `linhasSemProgramacao[]`. Clique -> irPara('linha', { numero }).

import { registrar } from '../telas.js';

function render(elemento, params) {
  const p = document.createElement('p');
  p.className = 'estado-vazio';
  p.textContent = 'Tela "ponto" ainda nao implementada (TASK-05).';
  elemento.append(p);
}

registrar('ponto', { titulo: 'Linhas do ponto', render });
