// sw.js — service worker do site de apoio operacional.
//
// Duas estrategias, e a diferenca entre elas e deliberada:
//
//   app shell (html, css, js, imagens)  -> cache-first
//     Sao arquivos versionados junto com o deploy. Servir da rede primeiro so
//     adicionaria latencia no meio da rua, que e exatamente onde o operador
//     esta. Cache novo = VERSAO nova.
//
//   dados/dados.json                    -> stale-while-revalidate
//     Responde na hora com o que esta em cache (o operador nunca espera rede)
//     e busca a versao nova em segundo plano. Se o `versaoDados` que voltar
//     for diferente do que esta em cache, avisa as abas abertas para que o
//     rodape ofereca "Atualizar". Sem isso o operador ficaria em campo com a
//     programacao antiga sem nenhum sinal — o risco que a TASK-09 mitiga.
//
// CONTRATO com app/rodape.js: o unico acoplamento entre os dois e o literal
// MENSAGEM_ATUALIZACAO. Se um lado mudar sozinho, o botao simplesmente nunca
// aparece e nada falha em lugar nenhum — por isso o teste-guarda compara os
// dois literais.
//
//   postMessage({ tipo: MENSAGEM_ATUALIZACAO, versaoDados: '<ISO 8601 com offset>' })

const VERSAO = 'v7';
const CACHE = 'passo-a-paco-' + VERSAO;

const MENSAGEM_ATUALIZACAO = 'dados-atualizados';

// Caminhos relativos ao escopo do SW (a raiz do site), para funcionar tanto na
// raiz do dominio quanto num subdiretorio do GitHub Pages.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',

  './assets/css/base.css',
  './assets/css/telas/mapa.css',
  './assets/css/telas/busca.css',
  './assets/css/telas/ponto.css',
  './assets/css/telas/linha.css',
  './assets/css/telas/quadro.css',
  './assets/css/telas/avisos.css',

  './app/principal.js',
  './app/dados.js',
  './app/estado.js',
  './app/formato.js',
  './app/telas.js',
  './app/rodape.js',
  './app/telas/mapa.js',
  './app/telas/busca.js',
  './app/telas/ponto.js',
  './app/telas/linha.js',
  './app/telas/quadro.js',
  './app/telas/avisos.js',

  // Os dois formatos de cada arte. O navegador escolhe um pelo <picture>, mas
  // qual dos dois nao da para saber daqui, entao os dois entram no cache.
  './assets/img/mapa-pontos.webp',
  './assets/img/mapa-pontos.png',

  './dados/dados.json',
];

const CAMINHO_DADOS = 'dados/dados.json';

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // addAll e atomico: um 404 em qualquer item aborta o install inteiro e o
      // site fica sem offline nenhum. Cacheamos item a item para que um asset
      // renomeado custe apenas aquele asset.
      //
      // `cache: 'reload'` NAO e opcional. Sem ele o fetch do precache passa
      // pelo cache HTTP do navegador, que num servidor estatico sem
      // Cache-Control (GitHub Pages, http.server, Live Server) guarda os
      // arquivos por heuristica propria. O resultado e um SW novo, com VERSAO
      // nova, que precacheia os arquivos VELHOS — e como o app shell e
      // cache-first, o site fica servindo a versao antiga para sempre, sem
      // erro nenhum. Foi exatamente isso que segurou a atualizacao no
      // Live Server do VS Code.
      await Promise.all(
        APP_SHELL.map((caminho) =>
          cache.add(new Request(caminho, { cache: 'reload' })).catch((erro) => {
            console.warn('[sw] nao consegui cachear ' + caminho, erro);
          }),
        ),
      );
      await self.skipWaiting();
    }),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes
          .filter((nome) => nome.startsWith('passo-a-paco-') && nome !== CACHE)
          .map((nome) => caches.delete(nome)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (evento) => {
  // Permite ao rodape pedir a ativacao imediata de um SW novo.
  if (evento.data && evento.data.tipo === 'assumir-controle') self.skipWaiting();
});

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== 'GET') return;

  const url = new URL(requisicao.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith(CAMINHO_DADOS)) {
    // O evento inteiro vai junto: a revalidacao acontece DEPOIS que
    // respondWith ja resolveu, e sem evento.waitUntil() o navegador pode
    // encerrar o worker no meio dela. Quando isso acontece o cache nunca e
    // atualizado e o botao nunca aparece — sem erro nenhum.
    evento.respondWith(dadosStaleWhileRevalidate(evento));
    return;
  }

  // Navegacao (recarregar, abrir a URL direto): devolve o index do cache
  // quando a rede falha. Sem isso, recarregar offline da a tela de erro do
  // navegador em vez do site.
  if (requisicao.mode === 'navigate') {
    evento.respondWith(navegacao(requisicao));
    return;
  }

  evento.respondWith(cacheFirst(requisicao));
});

/**
 * Cache-first com preenchimento sob demanda: o que nao entrou no install
 * (por 404 ou por ser novo) e cacheado na primeira vez que for pedido online.
 */
async function cacheFirst(requisicao) {
  const cache = await caches.open(CACHE);
  const emCache = await cache.match(requisicao, { ignoreSearch: true });
  if (emCache) return emCache;

  try {
    const resposta = await fetch(requisicao);
    if (resposta.ok && resposta.type === 'basic') cache.put(requisicao, resposta.clone());
    return resposta;
  } catch (erro) {
    // Sem rede e sem cache. Uma resposta 504 explicita e melhor do que deixar
    // o fetch estourar: o app trata isso como falha de carga e mostra a tela
    // de erro em vez de quebrar em branco.
    return new Response('Recurso indisponivel offline.', {
      status: 504,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function navegacao(requisicao) {
  const cache = await caches.open(CACHE);
  try {
    return await fetch(requisicao);
  } catch (erro) {
    const index = (await cache.match('./index.html')) || (await cache.match('./'));
    if (index) return index;
    return new Response(paginaOffline(), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

/**
 * Stale-while-revalidate do dados.json.
 *
 * Devolve o cache imediatamente e revalida em segundo plano. Quando o
 * `versaoDados` da rede difere do que estava em cache, avisa as abas abertas.
 * Sem cache, espera a rede (primeiro acesso).
 *
 * @param {FetchEvent} evento precisamos do evento, e nao so da requisicao,
 *   para prender a revalidacao em waitUntil().
 */
async function dadosStaleWhileRevalidate(evento) {
  const requisicao = evento.request;
  const cache = await caches.open(CACHE);
  const emCache = await cache.match(requisicao, { ignoreSearch: true });

  // A versao em cache e lida AGORA, enquanto `emCache` ainda esta intacta.
  // Mais abaixo ela e devolvida ao respondWith, que consome o corpo; a partir
  // dai qualquer emCache.clone() lanca TypeError. Como esse clone ficaria
  // dentro do .then() da revalidacao, o erro cairia no .catch e o unico
  // sintoma seria o cache nunca avancar.
  const versaoAntiga = emCache ? await lerVersao(emCache.clone()) : null;

  const daRede = fetch(requisicao)
    .then(async (resposta) => {
      if (!resposta.ok) return resposta;

      const versaoNova = await lerVersao(resposta.clone());

      await cache.put(requisicao, resposta.clone());

      if (versaoAntiga && versaoNova && versaoNova !== versaoAntiga) {
        await avisarClientes(versaoNova);
      }
      return resposta;
    })
    .catch((erro) => {
      // Offline durante a revalidacao e o caso normal, nao um defeito: ja
      // respondemos do cache. Registrado, e nao engolido, porque um erro aqui
      // e a unica pista de que a atualizacao parou de funcionar.
      console.warn('[sw] revalidacao de dados.json falhou', erro);
      return null;
    });

  // Mantem o worker vivo ate a revalidacao terminar. Sem isto ela e
  // interrompida na maior parte das vezes e o cache nunca avanca.
  evento.waitUntil(daRede);

  if (emCache) return emCache;

  const resposta = await daRede;
  if (resposta) return resposta;

  return new Response('Programacao indisponivel offline.', {
    status: 504,
    statusText: 'Offline',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

/** @returns {Promise<string|null>} o carimbo `versaoDados`, ou null se ilegivel. */
async function lerVersao(resposta) {
  try {
    const json = await resposta.json();
    return json?.versaoDados ?? null;
  } catch (erro) {
    return null;
  }
}

async function avisarClientes(versaoDados) {
  const abas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const aba of abas) {
    aba.postMessage({ tipo: MENSAGEM_ATUALIZACAO, versaoDados });
  }
}

/**
 * Ultimo recurso: primeiro acesso ja offline, sem nada em cache. Nunca uma
 * tela em branco — a pagina diz o que aconteceu e o que fazer.
 */
function paginaOffline() {
  return [
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Sem conexao — Passo a Paco 2026</title>',
    '<style>body{font-family:system-ui,sans-serif;margin:0;padding:2rem;',
    'background:#312783;color:#fff;line-height:1.5}h1{font-size:1.25rem}',
    'button{font:inherit;min-height:44px;padding:0 1.25rem;border:0;',
    'border-radius:8px;background:#F5821F;color:#fff;cursor:pointer}</style>',
    '</head><body>',
    '<h1>Sem conex&atilde;o</h1>',
    '<p>A programa&ccedil;&atilde;o ainda n&atilde;o foi baixada neste aparelho. ',
    'Conecte-se &agrave; internet uma vez para guardar os dados — depois disso o ',
    'site funciona sem rede.</p>',
    '<button onclick="location.reload()">Tentar de novo</button>',
    '</body></html>',
  ].join('');
}
