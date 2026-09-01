// linha.js — tela da linha, visao simplificada. Chave: 'linha'. A TELA MAIS
// IMPORTANTE DO SITE.
//
// Padrao replicado de app/telas/avisos.js: funcoes puras que montam nos de
// DOM, texto sempre via textContent, `render(elemento, params)` e
// `registrar(...)` no fim.
//
// Params: { numero } — string de 3 digitos ('608').
//
// Caso A (temProgramacaoEvento: false): tela reduzida, sem nenhum horario.
// Caso B (temProgramacaoEvento: true): cabecalho + avisos + observacoes +
// legenda + grade de passagens + botao "Ver quadro completo".
//
// PROIBIDO ler o campo de partida do bairro (o vizinho de `passagens` dentro
// de `dias[dia]`). Ele nao e a passagem pelo ponto: na linha 604 mostraria
// 15:46 no lugar de 16:46. Use SEMPRE `dias[dia].passagens[]`, rotulado como
// "passagem prevista pelo ponto" e sinalizado como aproximado.

import { registrar } from '../telas.js';
import { linha, ponto, avisosDe } from '../dados.js';
import { diaSelecionado } from '../estado.js';
import { hora, diaVigente, proximaPassagem } from '../formato.js';
import { renderizarQuadroCompleto } from './quadro.js';

/** Rotulo textual da severidade — a cor nunca e o unico indicador (RNF-06). */
const ROTULO_SEVERIDADE = {
  alta: 'Atenção',
  media: 'Importante',
  info: 'Informação',
};

/**
 * Formata 'AAAA-MM-DD' como 'sexta, 05/09'.
 * @param {string} diaISO
 * @returns {string}
 */
function rotuloDia(diaISO) {
  const [ano, mes, dia] = diaISO.split('-').map(Number);
  const nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const semana = nomes[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  return semana + ', ' + String(dia).padStart(2, '0') + '/' + String(mes).padStart(2, '0');
}

/**
 * Monta o cabecalho com numero e nome da linha (nome omitido quando null).
 * @param {object} objetoLinha
 * @returns {HTMLElement}
 */
function cabecalhoNumeroNome(objetoLinha) {
  const cabecalho = document.createElement('div');
  cabecalho.className = 'linha__identificacao';

  const numero = document.createElement('p');
  numero.className = 'numero-linha';
  numero.textContent = objetoLinha.numero;
  cabecalho.append(numero);

  if (objetoLinha.nome) {
    const nome = document.createElement('h2');
    nome.className = 'linha__nome';
    nome.textContent = objetoLinha.nome;
    cabecalho.append(nome);
  }

  return cabecalho;
}

/**
 * Monta o cartao do ponto de embarque, com a cor funcional do ponto.
 * @param {object|undefined} objetoPonto
 * @returns {HTMLElement}
 */
function cartaoPonto(objetoPonto) {
  const cartao = document.createElement('p');
  cartao.className = 'linha__ponto';
  if (objetoPonto) {
    cartao.classList.add('ponto-p' + objetoPonto.numero);
    cartao.textContent = 'Ponto ' + String(objetoPonto.numero).padStart(2, '0');
  } else {
    cartao.textContent = 'Ponto de embarque não identificado';
  }
  return cartao;
}

/**
 * Monta o cartao de um aviso (mesmo padrao visual de avisos.js).
 * @param {object} aviso
 * @returns {HTMLElement}
 */
function cartaoAviso(aviso) {
  const artigo = document.createElement('article');
  artigo.className = 'aviso aviso--' + aviso.severidade;

  const marca = document.createElement('span');
  marca.className = 'aviso__severidade';
  marca.textContent = ROTULO_SEVERIDADE[aviso.severidade] ?? aviso.severidade;
  artigo.append(marca);

  const texto = document.createElement('p');
  texto.className = 'aviso__texto';
  texto.textContent = aviso.texto;
  artigo.append(texto);

  return artigo;
}

/**
 * Texto de exibicao de um item de legendaViagens — string ou objeto
 * `{ codigo, veiculos, viagens, descricao }`, conforme vem do JSON.
 * @param {string|object} item
 * @returns {string}
 */
function textoLegenda(item) {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    const partes = [item.codigo, item.descricao].filter(Boolean);
    return partes.join(' — ');
  }
  return String(item);
}

/**
 * Monta uma lista simples de textos, ou null se a lista estiver vazia.
 * @param {string} titulo
 * @param {string} classe
 * @param {(string|object)[]} itens
 * @returns {HTMLElement|null}
 */
function secaoDeLista(titulo, classe, itens) {
  if (!Array.isArray(itens) || itens.length === 0) return null;

  const secao = document.createElement('section');
  secao.className = classe;

  const h3 = document.createElement('h3');
  h3.textContent = titulo;
  secao.append(h3);

  const lista = document.createElement('ul');
  for (const item of itens) {
    const li = document.createElement('li');
    li.textContent = textoLegenda(item);
    lista.append(li);
  }
  secao.append(lista);

  return secao;
}

/**
 * Agrupa as passagens (ja formatadas para exibicao) pela hora civil.
 * @param {string[]} passagens horarios brutos de `dias[dia].passagens[]`
 * @returns {Map<string, {bruto:string, formatado:string}[]>}
 */
function agruparPorHora(passagens) {
  const grupos = new Map();
  for (const bruto of passagens) {
    const formatado = hora(bruto);
    const chaveHora = formatado.slice(0, 2);
    if (!grupos.has(chaveHora)) grupos.set(chaveHora, []);
    grupos.get(chaveHora).push({ bruto, formatado });
  }
  return grupos;
}

/**
 * Monta a grade de passagens agrupada por hora.
 * @param {string[]} passagens
 * @param {string|null} destaqueBruto valor bruto da proxima passagem, ou null
 * @returns {HTMLElement}
 */
function gradePassagens(passagens, destaqueBruto) {
  const grade = document.createElement('div');
  grade.className = 'grade-passagens';

  const grupos = agruparPorHora(passagens);
  for (const [chaveHora, itens] of grupos) {
    const linhaHora = document.createElement('div');
    linhaHora.className = 'grade-passagens__linha';

    const rotuloHora = document.createElement('span');
    rotuloHora.className = 'grade-passagens__hora';
    rotuloHora.textContent = chaveHora + 'h';
    linhaHora.append(rotuloHora);

    const minutos = document.createElement('div');
    minutos.className = 'grade-passagens__minutos';
    for (const item of itens) {
      const badge = document.createElement('span');
      badge.className = 'badge-passagem';
      if (destaqueBruto && item.bruto === destaqueBruto) {
        badge.classList.add('badge-passagem--proxima');
      }
      badge.textContent = item.formatado;
      minutos.append(badge);
    }
    linhaHora.append(minutos);

    grade.append(linhaHora);
  }

  return grade;
}

/**
 * Monta o destaque textual da proxima passagem do dia vigente.
 * @param {string[]} passagens
 * @returns {HTMLElement}
 */
function destaqueProximaPassagem(passagens) {
  const paragrafo = document.createElement('p');
  paragrafo.className = 'linha__proxima-passagem';

  const proxima = proximaPassagem(passagens);
  if (proxima) {
    paragrafo.textContent =
      'Próxima passagem por aqui, prevista para ' + hora(proxima.hora) + ' (em ' + proxima.emMinutos + ' min)';
  } else {
    paragrafo.textContent = 'Sem mais passagens hoje.';
  }

  return paragrafo;
}

/**
 * Renderiza o Caso A — linha sem programacao especial para o evento.
 * Nenhum horario e exibido; `escalaBase.dataReferencia` nunca aparece.
 * @param {HTMLElement} elemento
 * @param {object} objetoLinha
 */
function renderSemProgramacao(elemento, objetoLinha) {
  const secao = document.createElement('section');
  secao.className = 'tela-linha tela-linha--simples';

  secao.append(cabecalhoNumeroNome(objetoLinha));
  secao.append(cartaoPonto(ponto(objetoLinha.pontoId)));

  const objetoPonto = ponto(objetoLinha.pontoId);
  const rotuloPonto = objetoPonto ? 'Ponto ' + String(objetoPonto.numero).padStart(2, '0') : 'o ponto indicado';

  const mensagem = document.createElement('p');
  mensagem.className = 'linha__mensagem-regular';
  mensagem.textContent =
    'Esta linha não teve alteração para o Passo a Paço. Embarque no ' + rotuloPonto + ' e siga a escala regular.';
  secao.append(mensagem);

  elemento.append(secao);
}

/**
 * Renderiza o Caso B — linha com programacao especial para o evento.
 * @param {HTMLElement} elemento
 * @param {object} objetoLinha
 * @param {string} dia 'AAAA-MM-DD'
 */
function renderComProgramacao(elemento, objetoLinha, dia) {
  const secao = document.createElement('section');
  secao.className = 'tela-linha tela-linha--completa';

  // ------------------------------------------------------------ cabecalho
  const cabecalho = document.createElement('header');
  cabecalho.className = 'linha__cabecalho';

  cabecalho.append(cabecalhoNumeroNome(objetoLinha));

  if (objetoLinha.empresa) {
    const empresa = document.createElement('p');
    empresa.className = 'linha__empresa';
    empresa.textContent = 'Empresa: ' + objetoLinha.empresa;
    cabecalho.append(empresa);
  }

  cabecalho.append(cartaoPonto(ponto(objetoLinha.pontoId)));

  const diaTexto = document.createElement('p');
  diaTexto.className = 'linha__dia';
  diaTexto.textContent = rotuloDia(dia);
  cabecalho.append(diaTexto);

  secao.append(cabecalho);

  // --------------------------------------------------------------- avisos
  const avisos = avisosDe(objetoLinha.numero, dia);
  if (avisos.length > 0) {
    const secaoAvisos = document.createElement('section');
    secaoAvisos.className = 'linha__avisos';
    const listaAvisos = document.createElement('ul');
    listaAvisos.className = 'lista-avisos';
    for (const aviso of avisos) {
      const item = document.createElement('li');
      item.append(cartaoAviso(aviso));
      listaAvisos.append(item);
    }
    secaoAvisos.append(listaAvisos);
    secao.append(secaoAvisos);
  }

  // ---------------------------------------------------- observacoes/legenda
  const blocoObservacoes = secaoDeLista('Observações', 'linha__observacoes', objetoLinha.observacoes);
  if (blocoObservacoes) secao.append(blocoObservacoes);

  const blocoLegenda = secaoDeLista('Legenda de viagens', 'linha__legenda', objetoLinha.legendaViagens);
  if (blocoLegenda) secao.append(blocoLegenda);

  // ------------------------------------------------------- grade de horario
  const blocoDia = objetoLinha.dias?.[dia];
  const passagens = blocoDia?.passagens ?? [];

  const secaoGrade = document.createElement('section');
  secaoGrade.className = 'linha__grade';

  const tituloGrade = document.createElement('h3');
  tituloGrade.textContent = 'Passagem prevista pelo ponto';
  secaoGrade.append(tituloGrade);

  const aviso = document.createElement('p');
  aviso.className = 'linha__grade-aviso';
  aviso.textContent = 'Horário aproximado — não é uma partida garantida.';
  secaoGrade.append(aviso);

  const { dia: diaVigenteAtual } = diaVigente();
  let destaqueBruto = null;
  if (dia === diaVigenteAtual) {
    const proxima = proximaPassagem(passagens);
    destaqueBruto = proxima ? proxima.hora : null;
    secaoGrade.append(destaqueProximaPassagem(passagens));
  }

  if (passagens.length > 0) {
    secaoGrade.append(gradePassagens(passagens, destaqueBruto));
  } else {
    const vazio = document.createElement('p');
    vazio.className = 'estado-vazio';
    vazio.textContent = 'Nenhuma passagem prevista para este dia.';
    secaoGrade.append(vazio);
  }

  secao.append(secaoGrade);

  // ------------------------------------------------------- quadro completo
  const secaoQuadro = document.createElement('section');
  secaoQuadro.className = 'linha__quadro';

  const botaoQuadro = document.createElement('button');
  botaoQuadro.type = 'button';
  botaoQuadro.className = 'botao-quadro-completo';
  botaoQuadro.textContent = 'Ver quadro completo';

  const contentorQuadro = document.createElement('div');
  contentorQuadro.className = 'linha__quadro-conteudo';
  contentorQuadro.hidden = true;

  botaoQuadro.addEventListener('click', () => {
    const aberto = !contentorQuadro.hidden;
    if (aberto) {
      contentorQuadro.hidden = true;
      botaoQuadro.setAttribute('aria-expanded', 'false');
      return;
    }
    contentorQuadro.hidden = false;
    botaoQuadro.setAttribute('aria-expanded', 'true');
    if (!contentorQuadro.dataset.preenchido) {
      renderizarQuadroCompleto(contentorQuadro, objetoLinha, dia);
      contentorQuadro.dataset.preenchido = 'true';
    }
  });
  botaoQuadro.setAttribute('aria-expanded', 'false');

  secaoQuadro.append(botaoQuadro, contentorQuadro);
  secao.append(secaoQuadro);

  elemento.append(secao);
}

/**
 * @param {HTMLElement} elemento <main id="tela">, ja limpo
 * @param {{numero: string}} params
 */
function render(elemento, params) {
  const objetoLinha = linha(params?.numero);

  if (!objetoLinha) {
    const vazio = document.createElement('p');
    vazio.className = 'estado-vazio';
    vazio.textContent = 'Linha não encontrada.';
    elemento.append(vazio);
    return;
  }

  const dia = diaSelecionado();

  if (!objetoLinha.temProgramacaoEvento) {
    renderSemProgramacao(elemento, objetoLinha);
  } else {
    renderComProgramacao(elemento, objetoLinha, dia);
  }
}

registrar('linha', { titulo: 'Linha', render });
