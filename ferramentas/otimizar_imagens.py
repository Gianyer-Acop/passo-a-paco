#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Converte as artes de assets/img/ para WebP, mantendo o PNG como fallback.

Uso: python ferramentas/otimizar_imagens.py

O passo esta gravado aqui, e nao no historico do shell, para ser repetivel
quando a arte mudar. Duas regras nao negociaveis:

  1. As dimensoes originais sao preservadas. Os hotspots do mapa de pontos
     (TASK-03) sao posicionados em porcentagem sobre a imagem renderizada:
     redimensionar a arte desloca os quatro pins.
  2. O PNG nunca e apagado. Ele continua servindo de fallback no <picture>
     para navegador sem suporte a WebP.

Alvo: RNF-01 da spec — cada mapa abaixo de 400 KB, para carregar em 3G.
A qualidade comeca em QUALIDADE_INICIAL e cai de 5 em 5 ate caber no limite.
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
IMAGENS = RAIZ / "assets" / "img"

LIMITE_BYTES = 400 * 1024
QUALIDADE_INICIAL = 85
QUALIDADE_MINIMA = 40
PASSO = 5

ARTES = ["mapa-pontos.png"]


def converter(origem: Path) -> tuple[Path, int, int]:
    """Grava o .webp ao lado do .png e devolve (destino, bytes, qualidade)."""
    destino = origem.with_suffix(".webp")

    with Image.open(origem) as imagem:
        imagem = imagem.convert("RGB")
        largura, altura = imagem.size

        qualidade = QUALIDADE_INICIAL
        while True:
            imagem.save(destino, "WEBP", quality=qualidade, method=6)
            tamanho = destino.stat().st_size
            if tamanho <= LIMITE_BYTES or qualidade <= QUALIDADE_MINIMA:
                break
            qualidade -= PASSO

    # Guarda de dimensao: o WebP tem de ter exatamente o tamanho do PNG.
    with Image.open(destino) as gerada:
        if gerada.size != (largura, altura):
            raise SystemExit(
                f"ERRO: {destino.name} saiu {gerada.size}, esperado {(largura, altura)}"
            )

    return destino, tamanho, qualidade


def main() -> int:
    erros = 0

    for nome in ARTES:
        origem = IMAGENS / nome
        if not origem.exists():
            print(f"  FALTANDO  {origem.relative_to(RAIZ)}")
            erros += 1
            continue

        antes = origem.stat().st_size
        destino, depois, qualidade = converter(origem)

        estado = "ok" if depois <= LIMITE_BYTES else "ACIMA DO LIMITE"
        if depois > LIMITE_BYTES:
            erros += 1

        print(
            f"  {estado:15} {destino.name:22} "
            f"{antes / 1024:7.0f} KB -> {depois / 1024:6.0f} KB  (q={qualidade})"
        )

    print(f"\nErros: {erros}")
    return 1 if erros else 0


if __name__ == "__main__":
    raise SystemExit(main())
