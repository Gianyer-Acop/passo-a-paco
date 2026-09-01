// mapa.js — mapa dos 4 pontos de embarque. Chave: 'mapa'.
//
// STUB DA TASK-02. A implementacao e da TASK-03 (ONDA 3), que detem
// EXCLUSIVAMENTE este arquivo e assets/css/telas/mapa.css.
//
// Padrao de tela: replicar app/telas/avisos.js.
// Nao renomear a chave 'mapa', nao registrar chave nova.
//
// Params: nenhum.
// Fonte: `pontos()` de ../dados.js — cada ponto traz
//   { id, numero, nome, cor, corHex, zonas, hotspot: {x, y}, linhas[],
//     linhasComProgramacao[], linhasSemProgramacao[], linhasSemPlanilha[] }
// `hotspot` esta em PORCENTAGEM da imagem — posicionar com position:absolute
// sobre um contentor position:relative que envolva <img>, para acompanhar o
// redimensionamento. Clique -> irPara('ponto', { id }).

import { registrar } from '../telas.js';

function render(elemento, params) {
  const p = document.createElement('p');
  p.className = 'estado-vazio';
  p.textContent = 'Tela "mapa" ainda nao implementada (TASK-03).';
  elemento.append(p);
}

registrar('mapa', { titulo: 'Mapa de pontos', render });
