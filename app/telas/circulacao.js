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

/** Os 8 itens de circulação — texto exato do ticket TASK-08. */
const ITENS_CIRCULACAO = [
  'As linhas continuarão circulando até o Terminal da Matriz;',
  'Apenas o corredor do Terminal Central localizado próximo a Igreja e Praça da Matriz ficará operante e as linhas serão redistribuídas por zonas;',
  'No dia da realização do evento as linhas abaixo descritas realizarão mais uma viagem após a meia noite: 101, 113, 120, 121, 126, 214, 216, 219, 227, 315, 321, 356, 422, 440, 443, 448, 500, 535, 540, 560, 604, 608, 612, 621, 640, 650, 652, 676, 705 e 713;',
  'Nos dias do evento serão disponibilizados 25 ônibus extras a partir das 00h para dar apoio a operação das linhas;',
  'As linhas 604 e 676 terão programação especial no dia 07.09 a partir das 18h;',
  'Durante os dias do evento, as linhas 011, 320, 321, 305, 302, 357, 444, 216, 560 e 621 irão operar até o centro;',
  'No dia 07.09, a linha 121 irá substituir a operação da linha 019;',
  'Após as 00h, as paradas Dom Bosco e Colégio Militar ficarão inoperantes, permanecendo ativo apenas o Terminal da Matriz.',
];

/**
 * Monta um item da lista de circulação. O item 3 recebe tratamento especial
 * para deixar os números legíveis em telas pequeninhas.
 * @param {string} texto
 * @param {number} indice (0-based)
 * @returns {HTMLElement}
 */
function montar_item(texto, indice) {
  const li = document.createElement('li');
  li.className = 'tela-circulacao__item';

  // Item 3 (indice 2) tem lista de linhas — separa o prefixo dos números
  if (indice === 2) {
    const prefixo = 'No dia da realização do evento as linhas abaixo descritas realizarão mais uma viagem após a meia noite: ';
    const numeros_str = texto.slice(prefixo.length);

    const p_prefixo = document.createElement('p');
    p_prefixo.textContent = prefixo;
    li.append(p_prefixo);

    // Extrai os números (tudo antes do ponto-e-vírgula final)
    const numeros_texto = numeros_str.slice(0, -1); // Remove o ponto-e-vírgula
    const numeros = numeros_texto.split(', ');

    const div_numeros = document.createElement('div');
    div_numeros.className = 'tela-circulacao__linhas';
    numeros.forEach((num) => {
      const span = document.createElement('span');
      span.className = 'tela-circulacao__numero';
      span.textContent = num;
      div_numeros.append(span);
    });
    li.append(div_numeros);

    return li;
  }

  // Todos os outros itens são simples parágrafos
  const p = document.createElement('p');
  p.textContent = texto;
  li.append(p);

  return li;
}

/**
 * Renderiza o mapa de circulação e os 8 itens de orientação.
 * @param {HTMLElement} elemento <main id="tela">, ja limpo
 */
function render(elemento) {
  const secao = document.createElement('section');
  secao.className = 'tela-circulacao';

  const titulo = document.createElement('h2');
  titulo.textContent = 'Circulação';
  secao.append(titulo);

  // Imagem do mapa — clicável para ampliação
  const imagem = document.createElement('img');
  imagem.src = 'assets/img/mapa-circulacao.png';
  imagem.alt = 'Mapa da circulação das linhas de ônibus: Avenida Epaminondas, Terminal da Matriz, Praça da Saudade, plataforma interditada.';
  imagem.className = 'tela-circulacao__imagem';
  imagem.tabIndex = 0;
  imagem.setAttribute('role', 'button');
  imagem.setAttribute('aria-label', 'Ampliar mapa da circulação (Enter ou Espaço)');
  secao.append(imagem);

  // Lista dos 8 itens
  const lista = document.createElement('ul');
  lista.className = 'tela-circulacao__lista';
  ITENS_CIRCULACAO.forEach((texto, indice) => {
    lista.append(montar_item(texto, indice));
  });
  secao.append(lista);

  elemento.append(secao);

  // Dialog para ampliação em tela cheia
  const dialog = document.createElement('dialog');
  dialog.className = 'tela-circulacao__dialog';

  const imagem_ampliada = document.createElement('img');
  imagem_ampliada.src = imagem.src;
  imagem_ampliada.alt = imagem.alt;
  imagem_ampliada.className = 'tela-circulacao__imagem-ampliada';
  dialog.append(imagem_ampliada);

  const botao_fechar = document.createElement('button');
  botao_fechar.className = 'tela-circulacao__fechar';
  botao_fechar.textContent = 'Fechar';
  botao_fechar.setAttribute('aria-label', 'Fechar ampliação do mapa');
  dialog.append(botao_fechar);

  elemento.append(dialog);

  // Listeners
  imagem.addEventListener('click', () => {
    dialog.showModal();
  });

  imagem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dialog.showModal();
    }
  });

  botao_fechar.addEventListener('click', () => {
    dialog.close();
    imagem.focus();
  });

  dialog.addEventListener('cancel', () => {
    imagem.focus();
  });

  // Escape também fecha automaticamente com dialog.close()
  // e o event 'cancel' dispara para devolver foco
}

registrar('circulacao', { titulo: 'Circulação', render });
