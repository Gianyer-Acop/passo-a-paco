#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Gera os icones de manifest.webmanifest em assets/img/.

Uso: python ferramentas/gerar_icones.py

Desenhados em codigo, e nao exportados de uma arte, por um motivo pratico: o
manifesto exige tamanhos exatos (192, 512 e um maskable 512) e um icone
redimensionado a mao sai borrado ou fora da zona segura. Aqui o mesmo desenho
e re-renderizado em cada tamanho.

Paleta identica aos tokens de assets/css/base.css — o icone e a primeira coisa
que o operador ve na tela de inicio e precisa ler como o mesmo produto.

Zona segura do maskable: o sistema pode recortar o icone num circulo de 80% do
lado. Por isso a versao maskable desenha o mesmo simbolo em 60% do lado, com o
fundo sangrando ate a borda.
"""

from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
IMAGENS = RAIZ / "assets" / "img"

AZUL = (49, 39, 131)  # --cor-evento-azul  #312783
LARANJA = (245, 130, 31)  # --cor-evento-laranja  #F5821F
BRANCO = (255, 255, 255)

# (arquivo, lado em px, fracao do lado ocupada pelo simbolo, cantos arredondados)
ICONES = [
    ("icone-192.png", 192, 0.72, True),
    ("icone-512.png", 512, 0.72, True),
    ("icone-maskable-512.png", 512, 0.60, False),
]


def desenhar(lado: int, fracao: float, cantos: bool) -> Image.Image:
    """Fundo azul + disco laranja + silhueta de onibus em branco."""
    imagem = Image.new("RGB", (lado, lado), AZUL)
    desenho = ImageDraw.Draw(imagem)

    if cantos:
        # Cantos arredondados desenhados por cima, para o icone nao ficar um
        # quadrado duro nos launchers que nao aplicam mascara propria.
        mascara = Image.new("L", (lado, lado), 0)
        ImageDraw.Draw(mascara).rounded_rectangle(
            [0, 0, lado - 1, lado - 1], radius=int(lado * 0.22), fill=255
        )
        fundo = Image.new("RGB", (lado, lado), BRANCO)
        fundo.paste(imagem, (0, 0), mascara)
        imagem = fundo
        desenho = ImageDraw.Draw(imagem)

    # Disco laranja centrado
    raio = lado * fracao / 2
    centro = lado / 2
    desenho.ellipse(
        [centro - raio, centro - raio, centro + raio, centro + raio], fill=LARANJA
    )

    # Onibus: corpo, faixa de janelas e duas rodas. Todas as medidas sao
    # fracoes do raio, para o desenho escalar sem ajuste manual.
    largura = raio * 1.10
    altura = raio * 0.95
    esquerda = centro - largura / 2
    topo = centro - altura / 2 - raio * 0.06

    desenho.rounded_rectangle(
        [esquerda, topo, esquerda + largura, topo + altura],
        radius=raio * 0.20,
        fill=BRANCO,
    )

    # Faixa de janelas, em azul, na metade de cima do corpo
    margem = largura * 0.14
    janela_topo = topo + altura * 0.16
    desenho.rounded_rectangle(
        [
            esquerda + margem,
            janela_topo,
            esquerda + largura - margem,
            janela_topo + altura * 0.34,
        ],
        radius=raio * 0.07,
        fill=AZUL,
    )

    # Rodas, mordendo a base do corpo
    roda = raio * 0.17
    base = topo + altura
    for deslocamento in (-largura * 0.26, largura * 0.26):
        cx = centro + deslocamento
        desenho.ellipse([cx - roda, base - roda, cx + roda, base + roda], fill=BRANCO)
        desenho.ellipse(
            [
                cx - roda * 0.45,
                base - roda * 0.45,
                cx + roda * 0.45,
                base + roda * 0.45,
            ],
            fill=AZUL,
        )

    return imagem


def main() -> int:
    IMAGENS.mkdir(parents=True, exist_ok=True)

    for nome, lado, fracao, cantos in ICONES:
        destino = IMAGENS / nome
        desenhar(lado, fracao, cantos).save(destino, "PNG", optimize=True)
        print(f"  ok  {nome:26} {lado}x{lado}  {destino.stat().st_size / 1024:5.1f} KB")

    print("\nErros: 0")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
