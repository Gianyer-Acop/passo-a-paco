// quadro.js — quadro horario completo, por turno e TAB. Chave: 'quadro'.
//
// Padrao de tela: replica app/telas/avisos.js (funcoes puras que montam nos
// de DOM, texto sempre por textContent, registro no fim do arquivo).
//
// CONTRATO CONGELADO NA TASK-02 — a TASK-06 importa esta funcao:
//   export function renderizarQuadroCompleto(elemento, objetoLinha, diaISO)
// A assinatura nao pode mudar.
//
// Este e o UNICO lugar do site que exibe a coluna IDA (saida do bairro) —
// rotulada e ao lado da VOLTA, para o operador que precisa da escala
// completa. Em nenhum outro lugar do site ela e exibida.

import { registrar } from '../telas.js';
import { linha } from '../dados.js';
import { diaSelecionado } from '../estado.js';
import { hora } from '../formato.js';

/**
 * Formata um horario cru ('HH:MM', podendo ser null) para exibicao.
 * @param {string|null} hhmm
 * @returns {string} texto formatado, ou '' se nao houver horario
 */
function horaOuVazio(hhmm) {
  return hhmm ? hora(hhmm) : '';
}

/**
 * Monta uma celula <td> com texto simples.
 * @param {string} texto
 * @param {string} [classe]
 * @returns {HTMLTableCellElement}
 */
function celula(texto, classe) {
  const td = document.createElement('td');
  if (classe) td.className = classe;
  td.textContent = texto;
  return td;
}

/**
 * Monta a linha (<tr>) de uma viagem, tratando os edge cases de
 * continuacao (volta null) e baixada (ida null).
 *
 * @param {object} viagem { ida, volta, termino, tempoViagem, tipo, continuacao }
 * @returns {HTMLTableRowElement}
 */
function linhaViagem(viagem) {
  const tr = document.createElement('tr');
  if (viagem.tipo) tr.className = 'linha-viagem linha-viagem--' + viagem.tipo;

  // IDA — saida do bairro. So aparece aqui, rotulada.
  if (viagem.ida == null) {
    const td = celula('—', 'quadro__vazia');
    if (viagem.tipo === 'baixada') {
      td.title = 'Viagem baixada: comeca direto no retorno, sem saida do bairro.';
    }
    tr.append(td);
  } else {
    tr.append(celula(hora(viagem.ida)));
  }

  // VOLTA — passagem pelo ponto.
  if (viagem.volta == null) {
    const td = celula('—', 'quadro__vazia');
    if (viagem.tipo === 'continuacao' || viagem.continuacao) {
      td.title = 'Perna de retorno (continuacao): nao ha passagem pelo ponto aqui.';
    }
    tr.append(td);
  } else {
    tr.append(celula(hora(viagem.volta)));
  }

  tr.append(celula(horaOuVazio(viagem.termino)));
  tr.append(celula(viagem.tempoViagem ?? ''));

  return tr;
}

/**
 * Monta a tabela de uma TAB (veiculo/jornada + viagens).
 * @param {object} tabela { tab, veiculo, tipoVeiculo, jornada, viagens[] }
 * @returns {HTMLElement}
 */
function blocoTabela(tabela) {
  const bloco = document.createElement('div');
  bloco.className = 'quadro__tab';

  const cabecalho = document.createElement('div');
  cabecalho.className = 'quadro__tab-cabecalho';

  const tab = document.createElement('h4');
  tab.className = 'quadro__tab-nome';
  tab.textContent = tabela.tab ?? '';
  cabecalho.append(tab);

  const meta = document.createElement('p');
  meta.className = 'quadro__tab-meta';
  const partes = [];
  if (tabela.veiculo != null) partes.push('Veículo ' + tabela.veiculo);
  if (tabela.tipoVeiculo) partes.push(tabela.tipoVeiculo);
  if (tabela.jornada) partes.push('Jornada ' + tabela.jornada);
  meta.textContent = partes.join(' · ');
  cabecalho.append(meta);

  bloco.append(cabecalho);

  const envolveTabela = document.createElement('div');
  envolveTabela.className = 'quadro__rolagem';

  const table = document.createElement('table');
  table.className = 'quadro__tabela';

  const thead = document.createElement('thead');
  const trCabecalho = document.createElement('tr');
  for (const rotulo of ['IDA (saída do bairro)', 'VOLTA (passagem no ponto)', 'TÉRMINO', 'T. VIAGEM']) {
    const th = document.createElement('th');
    th.textContent = rotulo;
    trCabecalho.append(th);
  }
  thead.append(trCabecalho);
  table.append(thead);

  const tbody = document.createElement('tbody');
  for (const viagem of tabela.viagens ?? []) {
    tbody.append(linhaViagem(viagem));
  }
  table.append(tbody);

  envolveTabela.append(table);
  bloco.append(envolveTabela);

  return bloco;
}

/**
 * Monta a secao de um turno (nome + suas tabelas).
 * @param {object} turno { nome, tabelas[] }
 * @returns {HTMLElement}
 */
function blocoTurno(turno) {
  const secao = document.createElement('section');
  secao.className = 'quadro__turno';

  const titulo = document.createElement('h3');
  titulo.className = 'quadro__turno-nome';
  titulo.textContent = turno.nome ?? '';
  secao.append(titulo);

  const envolveTabelas = document.createElement('div');
  envolveTabelas.className = 'quadro__tabelas';
  for (const tabela of turno.tabelas ?? []) {
    envolveTabelas.append(blocoTabela(tabela));
  }
  secao.append(envolveTabelas);

  return secao;
}

/**
 * Monta a tabela de frequencia (hora / intervalo), quando existir.
 * @param {object[]} frequencia [{ hora, intervalo, origem }]
 * @returns {HTMLElement|null}
 */
function blocoFrequencia(frequencia) {
  if (!Array.isArray(frequencia) || frequencia.length === 0) return null;

  const secao = document.createElement('section');
  secao.className = 'quadro__frequencia';

  const titulo = document.createElement('h3');
  titulo.textContent = 'Frequência';
  secao.append(titulo);

  const envolveTabela = document.createElement('div');
  envolveTabela.className = 'quadro__rolagem';

  const table = document.createElement('table');
  table.className = 'quadro__tabela';

  const thead = document.createElement('thead');
  const trCabecalho = document.createElement('tr');
  for (const rotulo of ['HORA', 'INTERVALO']) {
    const th = document.createElement('th');
    th.textContent = rotulo;
    trCabecalho.append(th);
  }
  thead.append(trCabecalho);
  table.append(thead);

  const tbody = document.createElement('tbody');
  for (const item of frequencia) {
    const tr = document.createElement('tr');
    tr.append(celula(horaOuVazio(item.hora)));
    tr.append(celula(item.intervalo ?? '—'));
    tbody.append(tr);
  }
  table.append(tbody);

  envolveTabela.append(table);
  secao.append(envolveTabela);

  return secao;
}

/**
 * Monta a legenda dos edge cases (celulas vazias, horarios de madrugada).
 * @returns {HTMLElement}
 */
function blocoLegenda() {
  const legenda = document.createElement('p');
  legenda.className = 'quadro__legenda';
  legenda.textContent =
    '(+1) = madrugada do dia seguinte. Em "IDA" ou "VOLTA", "—" indica ' +
    'perna de retorno (continuação, sem passagem no ponto) ou viagem baixada ' +
    '(começa direto no retorno, sem saída do bairro).';
  return legenda;
}

/**
 * Renderiza, dentro de `elemento`, o quadro horario completo de uma linha
 * num dia: por turno, uma tabela por TAB, com IDA/VOLTA/TÉRMINO/T.VIAGEM,
 * mais a tabela de frequencia quando existir.
 *
 * Contrato congelado na TASK-02, consumido pela TASK-06.
 *
 * @param {HTMLElement} elemento contentor onde o quadro e renderizado
 * @param {object} objetoLinha objeto da linha vindo de dados.linha(numero)
 * @param {string} diaISO 'AAAA-MM-DD'
 */
export function renderizarQuadroCompleto(elemento, objetoLinha, diaISO) {
  const envolve = document.createElement('div');
  envolve.className = 'quadro-completo';

  const dia = objetoLinha?.dias?.[diaISO];

  if (!objetoLinha || !dia) {
    const vazio = document.createElement('p');
    vazio.className = 'estado-vazio';
    vazio.textContent = 'Sem programação de quadro horário para este dia.';
    envolve.append(vazio);
    elemento.append(envolve);
    return;
  }

  const turnos = dia.turnos ?? [];
  if (turnos.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'estado-vazio';
    vazio.textContent = 'Sem turnos programados para este dia.';
    envolve.append(vazio);
  } else {
    for (const turno of turnos) {
      envolve.append(blocoTurno(turno));
    }
  }

  const frequencia = blocoFrequencia(dia.frequencia);
  if (frequencia) envolve.append(frequencia);

  envolve.append(blocoLegenda());

  elemento.append(envolve);
}

/**
 * Renderiza a tela 'quadro' (params: { numero }), reaproveitando a mesma
 * funcao usada pela TASK-06.
 * @param {HTMLElement} elemento <main id="tela">, ja limpo
 * @param {{numero: string}} params
 */
function render(elemento, params) {
  const numero = params?.numero;
  const objetoLinha = numero != null ? linha(numero) : undefined;
  const dia = diaSelecionado();

  const secao = document.createElement('section');
  secao.className = 'tela-quadro';

  const titulo = document.createElement('h2');
  titulo.textContent = objetoLinha ? 'Quadro horário — Linha ' + (objetoLinha.numero ?? numero) : 'Quadro horário';
  secao.append(titulo);

  if (!objetoLinha) {
    const vazio = document.createElement('p');
    vazio.className = 'estado-vazio';
    vazio.textContent = 'Linha não encontrada.';
    secao.append(vazio);
    elemento.append(secao);
    return;
  }

  elemento.append(secao);
  renderizarQuadroCompleto(secao, objetoLinha, dia);
}

registrar('quadro', { titulo: 'Quadro horário', render });
