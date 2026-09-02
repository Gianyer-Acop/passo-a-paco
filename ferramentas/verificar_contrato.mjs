#!/usr/bin/env node
// verificar_contrato.mjs — teste-guarda do site de apoio operacional.
// Node puro, sem dependencias, roda em ~1s.  Uso: node ferramentas/verificar_contrato.mjs
//
// Verifica quatro coisas que nenhum teste de tela enxerga sozinho:
//   1. a forma e os numeros de dados/dados.json;
//   2. o registro de chaves de tela em app/telas/ (colisao / chave fora da lista);
//   3. que nenhuma tela le `saidasOrigem` (a partida do bairro, que nunca pode ser exibida);
//   4. as assinaturas congeladas de app/formato.js.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

let falhas = 0;
let passes = 0;

function ok(descricao, condicao, detalhe = '') {
  if (condicao) {
    passes++;
    console.log('  ok    ' + descricao);
  } else {
    falhas++;
    console.log('  FALHA ' + descricao + (detalhe ? ' -> ' + detalhe : ''));
  }
}

function igual(descricao, obtido, esperado) {
  ok(
    descricao,
    Object.is(obtido, esperado),
    'obtido ' + JSON.stringify(obtido) + ', esperado ' + JSON.stringify(esperado),
  );
}

function secao(titulo) {
  console.log('\n' + titulo);
}


/** Largura/altura do IHDR de um PNG, sem dependencia externa. */
function dimensoesPng(caminho) {
  const buf = readFileSync(caminho);
  if (buf.length < 24 || buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
}

/** Largura/altura de um WebP (VP8L ou VP8X; Pillow grava VP8L em lossless). */
function dimensoesWebp(caminho) {
  const buf = readFileSync(caminho);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const tipo = buf.toString('ascii', 12, 16);
  if (tipo === 'VP8X') {
    return { largura: buf.readUIntLE(24, 3) + 1, altura: buf.readUIntLE(27, 3) + 1 };
  }
  if (tipo === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { largura: (b & 0x3fff) + 1, altura: ((b >> 14) & 0x3fff) + 1 };
  }
  if (tipo === 'VP8 ') {
    return { largura: buf.readUInt16LE(26) & 0x3fff, altura: buf.readUInt16LE(28) & 0x3fff };
  }
  return null;
}

function paraMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

// --------------------------------------------------------------- 1. dados

secao('dados/dados.json');

const caminhoDados = join(RAIZ, 'dados', 'dados.json');
ok('dados/dados.json existe', existsSync(caminhoDados));
const dados = JSON.parse(readFileSync(caminhoDados, 'utf8'));

const linhas = dados.linhas ?? {};
const numeros = Object.keys(linhas);
const comProgramacao = numeros.filter((n) => linhas[n].temProgramacaoEvento);

igual('80 linhas', numeros.length, 80);
igual('37 linhas com temProgramacaoEvento', comProgramacao.length, 37);

// Desde que o gerador passou a publicar tambem a escala regular, TODA linha
// tem quadro nos 3 dias — inclusive as 43 sem programacao especial. Se alguma
// voltar a sair sem `dias`, a tela dela fica sem horario nenhum.
const semQuadro = numeros.filter((n) => Object.keys(linhas[n].dias ?? {}).length === 0);
ok('toda linha publicada tem quadro horario', semQuadro.length === 0, semQuadro.join(', '));

const DIAS = ['2026-09-05', '2026-09-06', '2026-09-07'];

const semOs3Dias = [];
const contagemErrada = [];
const foraDeOrdem = [];

// Percorre as 77, nao so as de evento: as regras de integridade valem igual
// para o quadro replicado da escala regular.
for (const numero of numeros) {
  const linha = linhas[numero];
  const dias = Object.keys(linha.dias ?? {});
  if (dias.length !== 3 || !DIAS.every((d) => dias.includes(d))) semOs3Dias.push(numero);

  for (const dia of dias) {
    const bloco = linha.dias[dia];
    if (bloco.naoOpera) continue; // linha desativada neste dia (ex.: 619)
    const passagens = bloco.passagens ?? [];

    const viagens = (bloco.turnos ?? [])
      .flatMap((t) => t.tabelas ?? [])
      .flatMap((tb) => tb.viagens ?? [])
      .filter((v) => v.tipo !== 'continuacao');
    if (viagens.length !== passagens.length) {
      contagemErrada.push(numero + '/' + dia + ': ' + viagens.length + ' viagens vs ' + passagens.length + ' passagens');
    }

    for (let i = 1; i < passagens.length; i++) {
      if (paraMinutos(passagens[i]) < paraMinutos(passagens[i - 1])) {
        foraDeOrdem.push(numero + '/' + dia + ': ' + passagens[i - 1] + ' -> ' + passagens[i]);
        break;
      }
    }
  }
}

ok('toda linha tem os 3 dias', semOs3Dias.length === 0, semOs3Dias.join(', '));
ok('passagens.length == viagens com tipo != continuacao', contagemErrada.length === 0, contagemErrada.slice(0, 5).join(' | '));
ok('passagens em ordem crescente em todos os blocos', foraDeOrdem.length === 0, foraDeOrdem.slice(0, 5).join(' | '));

// Os tres canarios: se qualquer um mudar, o parser da planilha mudou de comportamento.
igual('linha 604 / 07-09 / primeira passagem', linhas['604']?.dias?.['2026-09-07']?.passagens?.[0], '16:46');
igual('linha 214 / 05-09 / primeira passagem', linhas['214']?.dias?.['2026-09-05']?.passagens?.[0], '06:02');
igual('linha 113 / 05-09 / total de passagens', linhas['113']?.dias?.['2026-09-05']?.passagens?.length, 32);

// Canario das linhas de escala regular: se o parser do bloco unico quebrar,
// elas voltam a sair sem passagem nenhuma e ninguem percebe pela tela.
igual('linha 306 (escala regular) / 06-09 / 1a passagem', linhas['306']?.dias?.['2026-09-06']?.passagens?.[0], '05:28');
igual('linha 002 (escala regular) / 07-09 / total de passagens', linhas['002']?.dias?.['2026-09-07']?.passagens?.length, 21);

// A 444 foi a ultima aba a entrar; se a planilha for trocada sem ela, some sem aviso.
ok('linha 444 publicada, no P4, com programacao do evento',
  linhas['444']?.pontoId === 'P4' && linhas['444']?.temProgramacaoEvento === true);
igual('linha 444 / 05-09 / total de passagens', linhas['444']?.dias?.['2026-09-05']?.passagens?.length, 24);

// 216 e 705 foram as ultimas abas a entrar.
ok('linha 216 no P2, com programacao do evento',
  linhas['216']?.pontoId === 'P2' && linhas['216']?.temProgramacaoEvento === true);
ok('linha 705 no P1, com programacao do evento',
  linhas['705']?.pontoId === 'P1' && linhas['705']?.temProgramacaoEvento === true);

// A aba 602 tem DOIS quadros (sabado 40 viagens, domingo 32) e alterna entre
// eles. Se o parser voltar a tratar a aba regular como um bloco unico, os dois
// se somam e estes numeros mudam.
igual('linha 602 / 05-09 (sabado) / saidas', linhas['602']?.dias?.['2026-09-05']?.saidasOrigem?.length, 40);
igual('linha 602 / 06-09 (domingo) / saidas', linhas['602']?.dias?.['2026-09-06']?.saidasOrigem?.length, 32);
igual('linha 602 / 07-09 (sabado) / saidas', linhas['602']?.dias?.['2026-09-07']?.saidasOrigem?.length, 40);

// A 619 so circula no sabado; nos outros dois dias o bloco existe e e vazio.
ok('linha 619 opera em 05-09', !linhas['619']?.dias?.['2026-09-05']?.naoOpera
  && (linhas['619']?.dias?.['2026-09-05']?.passagens?.length ?? 0) > 0);
igual('linha 619 nao opera em 06-09', linhas['619']?.dias?.['2026-09-06']?.naoOpera, true);
igual('linha 619 nao opera em 07-09', linhas['619']?.dias?.['2026-09-07']?.naoOpera, true);

// Todo bloco naoOpera precisa vir vazio: um dia "desativado" que ainda carrega
// horario seria pior do que nenhum dos dois.
const naoOperaSujo = numeros.filter((n) =>
  DIAS.some((d) => linhas[n].dias?.[d]?.naoOpera
    && ((linhas[n].dias[d].passagens?.length ?? 0) > 0
      || (linhas[n].dias[d].turnos?.length ?? 0) > 0)));
ok('todo dia sem operacao vem sem horario', naoOperaSujo.length === 0, naoOperaSujo.join(', '));

// Viagens cortadas: so a 305 tem, duas por dia, nos tres dias.
const comCortadas = numeros.filter((n) =>
  DIAS.some((d) => (linhas[n].dias?.[d]?.passagensCortadas ?? []).length > 0));
ok('so a 305 tem viagens cortadas', comCortadas.length === 1 && comCortadas[0] === '305', comCortadas.join(', '));
for (const dia of DIAS) {
  igual(
    'linha 305 / ' + dia + ' / passagensCortadas',
    JSON.stringify(linhas['305']?.dias?.[dia]?.passagensCortadas),
    '["10:00","11:30"]',
  );
}

// --------------------------------------------- 1b. entradas manuais

secao('ferramentas/entrada/ — nomes editados a mao');

const caminhoNomes = join(RAIZ, 'ferramentas', 'entrada', 'nomes_linhas.json');
ok('nomes_linhas.json existe', existsSync(caminhoNomes));

if (existsSync(caminhoNomes)) {
  const nomes = JSON.parse(readFileSync(caminhoNomes, 'utf8'));
  const faltando = numeros.filter((n) => !(n in nomes));
  ok('nomes_linhas.json cobre todas as linhas publicadas', faltando.length === 0, faltando.join(', '));

  // nomes_linhas.json e ENTRADA do gerador; o site le dados/dados.json. Editar
  // o primeiro sem rodar `python ferramentas/gerar_dados.py` nao muda nada na
  // tela, e nada acusa isso — foi exatamente a duvida de "os cards estao
  // hardcoded?". O mtime resolve.
  const geradoEm = statSync(caminhoDados).mtimeMs;
  const editadoEm = statSync(caminhoNomes).mtimeMs;
  ok(
    'dados.json foi gerado depois da ultima edicao de nomes_linhas.json',
    geradoEm >= editadoEm,
    'rode: python ferramentas/gerar_dados.py',
  );

  // E o nome tem de chegar ate o JSON publicado, nao so existir na entrada.
  const naoCompilados = numeros.filter((n) => nomes[n] && linhas[n].nome !== nomes[n]);
  ok(
    'todo itinerario de nomes_linhas.json esta compilado em dados.json',
    naoCompilados.length === 0,
    naoCompilados.slice(0, 5).join(', ') + ' — rode: python ferramentas/gerar_dados.py',
  );
}

// --------------------------------------------------- 2. registro de telas

secao('app/telas/ — registro de chaves');

const CHAVES_RESERVADAS = ['mapa', 'busca', 'ponto', 'linha', 'quadro', 'avisos'];
const dirTelas = join(RAIZ, 'app', 'telas');
const arquivosTela = existsSync(dirTelas) ? readdirSync(dirTelas).filter((f) => f.endsWith('.js')) : [];

ok('app/telas/ tem 6 arquivos .js', arquivosTela.length === 6, 'encontrados ' + arquivosTela.length + ': ' + arquivosTela.join(', '));

const registradas = [];
const fontes = new Map();
for (const arquivo of arquivosTela) {
  const fonte = readFileSync(join(dirTelas, arquivo), 'utf8');
  fontes.set(arquivo, fonte);
  for (const m of fonte.matchAll(/registrar\(\s*['"]([^'"]+)['"]/g)) {
    registradas.push({ chave: m[1], arquivo });
  }
}

for (const chave of CHAVES_RESERVADAS) {
  const donos = registradas.filter((r) => r.chave === chave);
  ok(
    "chave '" + chave + "' registrada exatamente uma vez",
    donos.length === 1,
    donos.length + ' registro(s): ' + (donos.map((d) => d.arquivo).join(', ') || 'nenhum'),
  );
}

const intrusas = registradas.filter((r) => !CHAVES_RESERVADAS.includes(r.chave));
ok('nenhuma chave fora da lista reservada', intrusas.length === 0, intrusas.map((i) => i.chave + ' (' + i.arquivo + ')').join(', '));

// ------------------------------------------- 3. o guarda do saidasOrigem

secao('app/telas/ — proibicao de saidasOrigem');

const usamSaidasOrigem = [...fontes.entries()]
  .filter(([, fonte]) => fonte.includes('saidasOrigem'))
  .map(([arquivo]) => arquivo);

ok(
  'nenhuma tela le saidasOrigem (partida do bairro, nunca exibida)',
  usamSaidasOrigem.length === 0,
  usamSaidasOrigem.join(', '),
);

// Os avisos moram so na aba Avisos, onde cada um lista as linhas que atinge.
// Repeti-los no card da linha era ruido; se alguem reintroduzir isso, aqui quebra.
secao('app/telas/ — avisos so na aba Avisos');

const renderizamAviso = [...fontes.entries()]
  .filter(([arquivo]) => arquivo !== 'avisos.js')
  .filter(([, fonte]) => /aviso\.texto|cartaoAviso|avisosDe\(|avisosEspecificosDe\(|avisosDoDia\(/.test(fonte))
  .map(([arquivo]) => arquivo);

ok(
  'so avisos.js renderiza texto de aviso',
  renderizamAviso.length === 0,
  renderizamAviso.join(', '),
);

const fonteAvisos = fontes.get('avisos.js') ?? '';
ok('avisos.js marca as linhas afetadas com chips clicaveis', fonteAvisos.includes('chip-linha'));
ok('avisos.js leva do chip para a tela da linha', /irPara\('linha'/.test(fonteAvisos));

// ------------------------------------------------------- 4. formatadores

secao('app/estado.js — historico de navegacao');

const fonteEstado = readFileSync(join(RAIZ, 'app', 'estado.js'), 'utf8');
ok('estado.js exporta voltar()', /export function voltar/.test(fonteEstado));
ok('estado.js exporta podeVoltar()', /export function podeVoltar/.test(fonteEstado));
ok('estado.js exporta destinoDeVolta()', /export function destinoDeVolta/.test(fonteEstado));
// Sem `substituir` na busca, cada tecla digitada empilha uma entrada e voltar
// de "608" exige tres cliques.
ok(
  'principal.js usa substituir na busca',
  readFileSync(join(RAIZ, 'app', 'principal.js'), 'utf8').includes('substituir:'),
);
ok(
  'index.html tem o botao de voltar',
  readFileSync(join(RAIZ, 'index.html'), 'utf8').includes('id="voltar"'),
);
// Trocar de tela tem de comecar do topo. Sem isto, sair de uma linha longa
// para a aba Avisos abria a tela nova ja rolada no meio dela.
ok('estado.js rola ao topo ao trocar de tela', /scrollTo\(\{\s*top: 0/.test(fonteEstado));

// O bloqueio precisa valer no estado, e nao so no botao desabilitado: e a
// unica porta de entrada da troca de dia.
ok('estado.js filtra a troca de dia por diasLiberados', /diasLiberados\(\)\.includes\(diaISO\)/.test(fonteEstado));
{
  const fonte = readFileSync(join(RAIZ, 'app', 'principal.js'), 'utf8');
  ok('principal.js desabilita os dias fechados', /botao\.disabled\s*=\s*!liberado/.test(fonte));
  // Sem reconferencia periodica, uma aba aberta desde as 22h manteria o dia de
  // ontem liberado e o de hoje fechado depois da virada das 03h.
  ok('principal.js reconfere o dia periodicamente', /setInterval\(sincronizar/.test(fonte));
}

secao('quadro — intervalo da tabela');
{
  const fonte = fontes.get('quadro.js') ?? '';
  // Linhas com IDA e TERMINO mas sem VOLTA sao intervalo, nao "perna de
  // retorno": nas 1372 ocorrencias da base termino - ida == tempoViagem.
  ok('quadro.js monta a faixa de intervalo', fonte.includes('faixaIntervalo'));
  ok('quadro.js rotula a faixa em texto', fonte.includes('Intervalo da tabela'));
  ok('quadro.js nao chama mais de "perna de retorno"', !/perna de retorno/i.test(fonte));
  const css = readFileSync(join(RAIZ, 'assets', 'css', 'telas', 'quadro.css'), 'utf8');
  ok('a faixa de intervalo e amarela', /\.linha-viagem--intervalo\s*\{[^}]*background:\s*#FFF3C4/i.test(css));
}

secao('cabecalho — barra de trabalho fixa');

const fonteBase = readFileSync(join(RAIZ, 'assets', 'css', 'base.css'), 'utf8');
const fonteHtml = readFileSync(join(RAIZ, 'index.html'), 'utf8');

// A busca, os dias e as abas acompanham a rolagem; so a identificacao do
// evento rola embora. Se #controles voltar para dentro de #cabecalho, o
// supervisor perde a busca ao descer a tela.
ok('index.html separa identificacao de controles', /<div id="controles">/.test(fonteHtml));
ok('#controles fica grudado no topo', /#controles\s*\{[^}]*position:\s*sticky/.test(fonteBase));
for (const id of ['busca', 'dias', 'abas']) {
  const dentro = fonteHtml.indexOf('id="' + id + '"') > fonteHtml.indexOf('<div id="controles">');
  ok(id + ' esta dentro da barra fixa', dentro);
}
// overflow-x: hidden no <main> promoveria o eixo Y a auto e criaria um
// contentor de rolagem paralelo ao da pagina.
ok('#tela usa overflow-x: clip, nao hidden', /#tela\s*\{[^}]*overflow-x:\s*clip/.test(fonteBase));

secao('app/formato.js — assinaturas congeladas');

const caminhoFormato = join(RAIZ, 'app', 'formato.js');
ok('app/formato.js existe', existsSync(caminhoFormato));

// formato.js nao importa nada, entao pode ser avaliado direto como modulo de dados.
const formato = existsSync(caminhoFormato)
  ? await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(readFileSync(caminhoFormato, 'utf8')))
  : {};

igual("hora('25:52')", formato.hora?.('25:52'), '01:52 (+1)');
igual("hora('05:19')", formato.hora?.('05:19'), '05:19');
igual("hora('24:23')", formato.hora?.('24:23'), '00:23 (+1)');
igual("minutos('25:52')", formato.minutos?.('25:52'), 1552);
igual("minutos('00:00')", formato.minutos?.('00:00'), 0);

// virada as 03h: 01:20 do dia 06 ainda pertence ao dia operacional 05.
igual('diaVigente 06/09 01:20 (virada 03h)', formato.diaVigente?.(new Date('2026-09-06T01:20:00-04:00'))?.dia, '2026-09-05');
igual('diaVigente 06/09 03:01', formato.diaVigente?.(new Date('2026-09-06T03:01:00-04:00'))?.dia, '2026-09-06');
igual('diaVigente 07/09 23:00', formato.diaVigente?.(new Date('2026-09-07T23:00:00-04:00'))?.dia, '2026-09-07');
igual('diaVigente fora do evento -> dia', formato.diaVigente?.(new Date('2026-09-20T10:00:00-04:00'))?.dia, '2026-09-05');
igual('diaVigente fora do evento -> foraDoEvento', formato.diaVigente?.(new Date('2026-09-20T10:00:00-04:00'))?.foraDoEvento, true);
igual('diaVigente dentro do evento -> foraDoEvento false', formato.diaVigente?.(new Date('2026-09-06T10:00:00-04:00'))?.foraDoEvento, false);

// Bloqueio de dia (ajuste funcional): na correria do ponto um toque errado no
// seletor abre o quadro de outro dia sem sinal evidente, e o operador passa a
// informar horario que nao e o de hoje. Durante o evento so o dia em operacao
// abre; antes dele os tres, para a preparacao; depois, so o ultimo.
const liberados = (iso) => JSON.stringify(formato.diasLiberados?.(new Date(iso)));

igual('antes do evento libera os 3 dias', liberados('2026-09-02T10:00:00-04:00'),
  '["2026-09-05","2026-09-06","2026-09-07"]');
igual('no dia 05 so o 05 abre', liberados('2026-09-05T14:00:00-04:00'), '["2026-09-05"]');
igual('no dia 06 so o 06 abre', liberados('2026-09-06T14:00:00-04:00'), '["2026-09-06"]');
igual('no dia 07 so o 07 abre', liberados('2026-09-07T20:00:00-04:00'), '["2026-09-07"]');
igual('depois do evento trava no 07', liberados('2026-09-20T10:00:00-04:00'), '["2026-09-07"]');

// A operacao atravessa a madrugada e o dia operacional so vira as 03h. Se este
// par inverter, o supervisor da noite perde o quadro que ainda esta rodando.
igual('01:20 do dia 06 ainda e o dia 05', liberados('2026-09-06T01:20:00-04:00'), '["2026-09-05"]');
igual('03:01 do dia 06 ja e o dia 06', liberados('2026-09-06T03:01:00-04:00'), '["2026-09-06"]');

const p113 = linhas['113']?.dias?.['2026-09-05']?.passagens ?? [];
igual('proximaPassagem 05/09 06:00 -> hora', formato.proximaPassagem?.(p113, new Date('2026-09-05T06:00:00-04:00'))?.hora, '06:13');
igual('proximaPassagem 05/09 06:00 -> emMinutos', formato.proximaPassagem?.(p113, new Date('2026-09-05T06:00:00-04:00'))?.emMinutos, 13);
// madrugada do dia 06 = fim do dia operacional 05; 01:00 ainda alcanca a passagem 25:47.
igual('proximaPassagem na madrugada (25:47)', formato.proximaPassagem?.(p113, new Date('2026-09-06T01:00:00-04:00'))?.hora, '25:47');
igual('proximaPassagem depois da ultima -> null', formato.proximaPassagem?.(p113, new Date('2026-09-06T02:30:00-04:00')), null);
igual('proximaPassagem com lista vazia -> null', formato.proximaPassagem?.([], new Date('2026-09-05T06:00:00-04:00')), null);


// ------------------------------------------------- 5. peso e formato das artes

secao('assets/img/ — WebP com fallback PNG (RNF-01)');

const LIMITE_BYTES = 400 * 1024;
for (const nome of ['mapa-pontos']) {
  const png = join(RAIZ, 'assets', 'img', nome + '.png');
  const webp = join(RAIZ, 'assets', 'img', nome + '.webp');

  ok(nome + '.webp existe', existsSync(webp));
  ok(nome + '.png continua existindo (fallback)', existsSync(png));

  if (existsSync(webp)) {
    const bytes = statSync(webp).size;
    ok(
      nome + '.webp abaixo de 400 KB',
      bytes < LIMITE_BYTES,
      Math.round(bytes / 1024) + ' KB',
    );
  }

  // Trocar o formato nao pode mudar as dimensoes: os hotspots da TASK-03 sao
  // posicionados em % sobre a imagem renderizada.
  if (existsSync(png) && existsSync(webp)) {
    const dimPng = dimensoesPng(png);
    const dimWebp = dimensoesWebp(webp);
    ok(
      nome + ': WebP mantem as dimensoes do PNG',
      dimPng && dimWebp && dimPng.largura === dimWebp.largura && dimPng.altura === dimWebp.altura,
      JSON.stringify(dimPng) + ' vs ' + JSON.stringify(dimWebp),
    );
  }
}

// Os hotspots sao % sobre a arte. Trocar a arte por outra com enquadramento
// diferente sem remedir os quatro pinos deixa os botoes fora de lugar, e nada
// no site reclama: continuam clicaveis, so que no pedaco errado do mapa.
// Estes numeros valem para o recorte 618x811 usado hoje; se a arte mudar, e
// para medir de novo (ver o comentario de PONTOS em gerar_dados.py).
const dimMapa = dimensoesPng(join(RAIZ, 'assets', 'img', 'mapa-pontos.png'));
igual('arte do mapa continua 618x811', JSON.stringify(dimMapa), '{"largura":618,"altura":811}');

const HOTSPOTS = { P1: [41.8, 27.4], P2: [42.5, 43.2], P3: [51, 62.2], P4: [61.5, 71.8] };
for (const [id, [x, y]] of Object.entries(HOTSPOTS)) {
  const p = (dados.pontos ?? []).find((cada) => cada.id === id);
  igual('hotspot ' + id + ' casa com a arte atual', JSON.stringify([p?.hotspot?.x, p?.hotspot?.y]), JSON.stringify([x, y]));
}

// As duas telas de imagem precisam servir o WebP com <picture> e manter o <img> PNG.
for (const [arquivo, base] of [['mapa.js', 'mapa-pontos']]) {
  const fonte = fontes.get(arquivo) ?? '';
  ok(arquivo + ' usa <picture> com source WebP', fonte.includes("'picture'") && fonte.includes('image/webp'));
  ok(arquivo + ' mantem o PNG como fallback no <img>', fonte.includes(base + '.png'));
}


// --------------------------------------------- 6. offline: SW e manifesto

secao('sw.js / manifest.webmanifest — funcionamento offline (RF-23..25)');

const caminhoSw = join(RAIZ, 'sw.js');
ok('sw.js existe', existsSync(caminhoSw));
const fonteSw = existsSync(caminhoSw) ? readFileSync(caminhoSw, 'utf8') : '';

ok('sw.js versiona o nome do cache', /const\s+VERSAO\s*=\s*'[^']+'/.test(fonteSw));
ok('sw.js precacheia o app shell no install', fonteSw.includes("addEventListener('install'") && fonteSw.includes('addAll'));
ok('sw.js limpa caches antigos no activate', fonteSw.includes("addEventListener('activate'") && fonteSw.includes('caches.delete'));
ok('sw.js trata dados.json em stale-while-revalidate', fonteSw.includes('dados.json') && fonteSw.includes('MENSAGEM_ATUALIZACAO'));
ok('sw.js cacheia .webp junto do .png', fonteSw.includes('.webp'));
// A revalidacao roda depois de respondWith resolver. Sem waitUntil o worker
// pode ser encerrado no meio dela: o cache nunca avanca, o botao nunca
// aparece, e nenhum erro e emitido.
ok('sw.js prende a revalidacao em waitUntil', /evento\.waitUntil\(daRede\)/.test(fonteSw));
// Sem `cache: 'reload'` o precache passa pelo cache HTTP e um SW com VERSAO
// nova guarda os arquivos VELHOS. Como o app shell e cache-first, o site
// serve a versao antiga para sempre — sem erro nenhum em lugar nenhum.
ok("sw.js precacheia com cache: 'reload' (nunca pelo cache HTTP)", /cache:\s*'reload'/.test(fonteSw));

const caminhoManifesto = join(RAIZ, 'manifest.webmanifest');
ok('manifest.webmanifest existe', existsSync(caminhoManifesto));
if (existsSync(caminhoManifesto)) {
  const manifesto = JSON.parse(readFileSync(caminhoManifesto, 'utf8'));
  igual('manifesto: display standalone', manifesto.display, 'standalone');
  ok('manifesto: name e short_name', Boolean(manifesto.name && manifesto.short_name));
  ok('manifesto: theme_color e background_color', Boolean(manifesto.theme_color && manifesto.background_color));
  ok('manifesto: pelo menos um icone', Array.isArray(manifesto.icons) && manifesto.icons.length > 0);
  for (const icone of manifesto.icons ?? []) {
    ok('manifesto: icone ' + icone.src + ' existe', existsSync(join(RAIZ, icone.src)));
  }
}

const caminhoRodape = join(RAIZ, 'app', 'rodape.js');
ok('app/rodape.js existe', existsSync(caminhoRodape));
const fonteRodape = existsSync(caminhoRodape) ? readFileSync(caminhoRodape, 'utf8') : '';
ok('rodape.js exporta montarRodape', /export function montarRodape/.test(fonteRodape));
ok('rodape.js escuta a mensagem do service worker', fonteRodape.includes('MENSAGEM_ATUALIZACAO'));
ok('rodape.js oferece o botao Atualizar', fonteRodape.includes('Atualizar'));
// addEventListener('message') no ServiceWorkerContainer so entrega mensagens
// depois de startMessages(). Sem a chamada, o botao nunca aparece e nao ha
// nenhum erro — falha exatamente do jeito que ninguem percebe.
ok('rodape.js chama startMessages()', fonteRodape.includes('startMessages()'));

// O tipo da mensagem e o unico contrato entre sw.js e rodape.js: os dois
// precisam concordar no literal, senao o botao nunca aparece e nada falha.
const tipoNoSw = /MENSAGEM_ATUALIZACAO\s*=\s*'([^']+)'/.exec(fonteSw)?.[1];
const tipoNoRodape = /MENSAGEM_ATUALIZACAO\s*=\s*'([^']+)'/.exec(fonteRodape)?.[1];
ok(
  'sw.js e rodape.js usam o mesmo tipo de mensagem',
  Boolean(tipoNoSw) && tipoNoSw === tipoNoRodape,
  'sw=' + tipoNoSw + ' rodape=' + tipoNoRodape,
);

const fonteIndex = readFileSync(join(RAIZ, 'index.html'), 'utf8');
ok('index.html linka o manifesto', /rel="manifest"/.test(fonteIndex));
ok('index.html registra o service worker', fonteIndex.includes('serviceWorker'));
// Em localhost o SW fica desligado: cache-first esconderia toda edicao ate
// alguem trocar a VERSAO, que foi o que travou o Live Server do VS Code.
ok('index.html nao registra o SW em localhost', fonteIndex.includes("'127.0.0.1'") && fonteIndex.includes('unregister'));
ok('index.html tem <noscript> — nunca tela branca sem JS', fonteIndex.includes('<noscript>'));

const fontePrincipal = readFileSync(join(RAIZ, 'app', 'principal.js'), 'utf8');
ok('principal.js delega o rodape para rodape.js', fontePrincipal.includes("from './rodape.js'"));

// ------------------------------------------------------------- resultado

console.log('\n' + passes + ' asserções ok, ' + falhas + ' falha(s).');
process.exit(falhas === 0 ? 0 : 1);
