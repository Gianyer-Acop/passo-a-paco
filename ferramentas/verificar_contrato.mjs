#!/usr/bin/env node
// verificar_contrato.mjs — teste-guarda do site de apoio operacional.
// Node puro, sem dependencias, roda em ~1s.  Uso: node ferramentas/verificar_contrato.mjs
//
// Verifica quatro coisas que nenhum teste de tela enxerga sozinho:
//   1. a forma e os numeros de dados/dados.json;
//   2. o registro de chaves de tela em app/telas/ (colisao / chave fora da lista);
//   3. que nenhuma tela le `saidasOrigem` (a partida do bairro, que nunca pode ser exibida);
//   4. as assinaturas congeladas de app/formato.js.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
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

igual('77 linhas', numeros.length, 77);
igual('34 linhas com temProgramacaoEvento', comProgramacao.length, 34);

const DIAS = ['2026-09-05', '2026-09-06', '2026-09-07'];

const semOs3Dias = [];
const contagemErrada = [];
const foraDeOrdem = [];

for (const numero of comProgramacao) {
  const linha = linhas[numero];
  const dias = Object.keys(linha.dias ?? {});
  if (dias.length !== 3 || !DIAS.every((d) => dias.includes(d))) semOs3Dias.push(numero);

  for (const dia of dias) {
    const bloco = linha.dias[dia];
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

ok('toda linha com programacao tem os 3 dias', semOs3Dias.length === 0, semOs3Dias.join(', '));
ok('passagens.length == viagens com tipo != continuacao', contagemErrada.length === 0, contagemErrada.slice(0, 5).join(' | '));
ok('passagens em ordem crescente em todos os blocos', foraDeOrdem.length === 0, foraDeOrdem.slice(0, 5).join(' | '));

// Os tres canarios: se qualquer um mudar, o parser da planilha mudou de comportamento.
igual('linha 604 / 07-09 / primeira passagem', linhas['604']?.dias?.['2026-09-07']?.passagens?.[0], '16:46');
igual('linha 214 / 05-09 / primeira passagem', linhas['214']?.dias?.['2026-09-05']?.passagens?.[0], '06:02');
igual('linha 113 / 05-09 / total de passagens', linhas['113']?.dias?.['2026-09-05']?.passagens?.length, 32);

// --------------------------------------------------- 2. registro de telas

secao('app/telas/ — registro de chaves');

const CHAVES_RESERVADAS = ['mapa', 'busca', 'ponto', 'linha', 'quadro', 'avisos', 'circulacao'];
const dirTelas = join(RAIZ, 'app', 'telas');
const arquivosTela = existsSync(dirTelas) ? readdirSync(dirTelas).filter((f) => f.endsWith('.js')) : [];

ok('app/telas/ tem 7 arquivos .js', arquivosTela.length === 7, 'encontrados ' + arquivosTela.length + ': ' + arquivosTela.join(', '));

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

// ------------------------------------------------------- 4. formatadores

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

const p113 = linhas['113']?.dias?.['2026-09-05']?.passagens ?? [];
igual('proximaPassagem 05/09 06:00 -> hora', formato.proximaPassagem?.(p113, new Date('2026-09-05T06:00:00-04:00'))?.hora, '06:13');
igual('proximaPassagem 05/09 06:00 -> emMinutos', formato.proximaPassagem?.(p113, new Date('2026-09-05T06:00:00-04:00'))?.emMinutos, 13);
// madrugada do dia 06 = fim do dia operacional 05; 01:00 ainda alcanca a passagem 25:47.
igual('proximaPassagem na madrugada (25:47)', formato.proximaPassagem?.(p113, new Date('2026-09-06T01:00:00-04:00'))?.hora, '25:47');
igual('proximaPassagem depois da ultima -> null', formato.proximaPassagem?.(p113, new Date('2026-09-06T02:30:00-04:00')), null);
igual('proximaPassagem com lista vazia -> null', formato.proximaPassagem?.([], new Date('2026-09-05T06:00:00-04:00')), null);

// ------------------------------------------------------------- resultado

console.log('\n' + passes + ' asserções ok, ' + falhas + ' falha(s).');
process.exit(falhas === 0 ? 0 : 1);
