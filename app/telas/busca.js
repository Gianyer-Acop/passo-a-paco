// busca.js — resultado da busca de linhas. Chave: 'busca'.
//
// STUB DA TASK-02. A implementacao e da TASK-04 (ONDA 3), que detem
// EXCLUSIVAMENTE este arquivo e assets/css/telas/busca.css.
//
// Padrao de tela: replicar app/telas/avisos.js.
// Nao renomear a chave 'busca', nao registrar chave nova.
//
// Params: { termo } — vem do campo #busca do index.html, que principal.js liga
// a `irPara('busca', { termo })` a cada digitacao. O input fica no <header>,
// FORA do <main>, entao re-renderizar nao tira o foco nem o cursor do campo.
// Termo vazio nao chega aqui: principal.js volta para a tela 'mapa'.
//
// Fonte: `linhas()` de ../dados.js (77 linhas, ordem numerica).
// `nome` e null em 50 das 77 linhas — exibir so o numero, nunca a string 'null'.

import { registrar } from '../telas.js';

function render(elemento, params) {
  const p = document.createElement('p');
  p.className = 'estado-vazio';
  p.textContent = 'Tela "busca" ainda nao implementada (TASK-04).';
  elemento.append(p);
}

registrar('busca', { titulo: 'Busca de linhas', render });
