// rodape.js — o carimbo de versao dos dados e o botao "Atualizar".
//
// Por que isso existe separado de principal.js: o rodape e o unico lugar do
// site que responde a um evento vindo do service worker. Deixar essa escuta
// no ponto de entrada misturaria o ciclo de vida do SW com a inicializacao
// das telas.
//
// CONTRATO com sw.js — o unico acoplamento entre os dois arquivos:
//
//   { tipo: MENSAGEM_ATUALIZACAO, versaoDados: '<ISO 8601 com offset>' }
//
// O literal precisa ser identico dos dois lados. Se divergir, nada quebra e
// nenhum erro aparece: o botao apenas nunca surge, e o operador fica em campo
// com a programacao antiga. E justamente por falhar em silencio que o
// teste-guarda compara os dois literais.

import { versaoDados } from './dados.js';

const MENSAGEM_ATUALIZACAO = 'dados-atualizados';

/**
 * '2026-09-01T15:30:58-04:00' -> '01/09/2026 às 15:30'.
 *
 * Le direto da string ISO: o carimbo ja vem no fuso de Manaus e reinterpretar
 * como Date so reintroduziria conversao de fuso sem necessidade.
 *
 * @param {string} iso
 * @returns {string}
 */
export function formatarCarimbo(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, ano, mes, dia, hora, minuto] = m;
  return dia + '/' + mes + '/' + ano + ' às ' + hora + ':' + minuto;
}

/**
 * Preenche o rodape com 'Dados de DD/MM/AAAA às HH:MM' e passa a escutar o
 * service worker. Chamada uma vez, depois que os dados carregaram.
 */
export function montarRodape() {
  const alvo = document.querySelector('#rodape .envolve');
  if (!alvo) return;

  const carimbo = versaoDados();

  const texto = document.createElement('p');
  texto.className = 'rodape__versao';
  texto.textContent = carimbo
    ? 'Dados de ' + formatarCarimbo(carimbo)
    : 'Versão dos dados indisponível';
  alvo.replaceChildren(texto);

  escutarAtualizacao(alvo);
}

/**
 * Liga a escuta da mensagem do SW. Só o primeiro aviso importa: depois que o
 * botao esta na tela, novos avisos nao mudam nada.
 *
 * @param {HTMLElement} alvo o contentor do rodape
 */
function escutarAtualizacao(alvo) {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', (evento) => {
    const dados = evento.data;
    if (!dados || dados.tipo !== MENSAGEM_ATUALIZACAO) return;
    mostrarBotaoAtualizar(alvo, dados.versaoDados);
  });

  // Sem isto o listener acima nunca dispara. A entrega de mensagens no
  // ServiceWorkerContainer fica represada ate que alguem defina `onmessage`
  // ou chame startMessages(); com addEventListener sozinho, as mensagens sao
  // enfileiradas e nada — nem um erro no console — indica o problema.
  navigator.serviceWorker.startMessages();
}

/**
 * Insere o aviso de programacao nova. Recarregar e suficiente: o SW ja gravou
 * o dados.json novo no cache antes de mandar a mensagem, entao a proxima
 * carga le a versao nova mesmo se a rede tiver caido nesse meio-tempo.
 *
 * @param {HTMLElement} alvo
 * @param {string|undefined} versaoNova
 */
function mostrarBotaoAtualizar(alvo, versaoNova) {
  if (alvo.querySelector('.rodape__atualizar')) return;

  const aviso = document.createElement('div');
  aviso.className = 'rodape__aviso';
  aviso.setAttribute('role', 'status');

  const texto = document.createElement('p');
  texto.className = 'rodape__aviso-texto';
  texto.textContent = versaoNova
    ? 'Programação nova disponível (' + formatarCarimbo(versaoNova) + ').'
    : 'Programação nova disponível.';
  aviso.append(texto);

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'rodape__atualizar';
  botao.textContent = 'Atualizar';
  botao.addEventListener('click', () => window.location.reload());
  aviso.append(botao);

  alvo.append(aviso);
}
