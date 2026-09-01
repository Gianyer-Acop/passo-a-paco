// circulacao.js — mapa de circulacao e orientacoes de trafego. Chave: 'circulacao'.
//
// STUB DA TASK-02. A implementacao e da TASK-08 (ONDA 3), que detem
// EXCLUSIVAMENTE este arquivo e assets/css/telas/circulacao.css.
//
// Padrao de tela: replicar app/telas/avisos.js.
// Nao renomear a chave 'circulacao', nao registrar chave nova.
//
// Params: nenhum.
// Conteudo estatico: assets/img/mapa-circulacao.png mais os 8 itens de
// circulacao (docs/prd.md §8). Nao le dados/dados.json.

import { registrar } from '../telas.js';

function render(elemento, params) {
  const p = document.createElement('p');
  p.className = 'estado-vazio';
  p.textContent = 'Tela "circulacao" ainda nao implementada (TASK-08).';
  elemento.append(p);
}

registrar('circulacao', { titulo: 'Circulação', render });
