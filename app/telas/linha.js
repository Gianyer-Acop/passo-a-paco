// linha.js — tela da linha, visao simplificada. Chave: 'linha'.
//
// STUB DA TASK-02. A implementacao e da TASK-06 (ONDA 3), que detem
// EXCLUSIVAMENTE este arquivo e assets/css/telas/linha.css.
//
// Padrao de tela: replicar app/telas/avisos.js.
// Nao renomear a chave 'linha', nao registrar chave nova.
//
// Params: { numero } — string de 3 digitos ('608').
// Fonte: `linha(numero)` e `avisosDe(numero, dia)` de ../dados.js.
//
// PROIBIDO ler o campo de partida do bairro (o vizinho de `passagens` dentro de
// `dias[dia]`). Ele nao e a passagem pelo ponto: na linha 604 mostraria 15:46 no
// lugar de 16:46. O teste-guarda falha se o nome desse campo aparecer neste
// arquivo — nem em comentario. Use SEMPRE `dias[dia].passagens[]`, rotulado
// como "passagem prevista pelo ponto" e sinalizado como aproximado.
//
// Botao "Ver quadro completo" usa o contrato congelado aqui na TASK-02:
//   import { renderizarQuadroCompleto } from './quadro.js';
//   renderizarQuadroCompleto(elemento, objetoLinha, diaISO);

import { registrar } from '../telas.js';

function render(elemento, params) {
  const p = document.createElement('p');
  p.className = 'estado-vazio';
  p.textContent = 'Tela "linha" ainda nao implementada (TASK-06).';
  elemento.append(p);
}

registrar('linha', { titulo: 'Linha', render });
