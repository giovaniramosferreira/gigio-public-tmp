#!/usr/bin/env python3
"""Placar da comunidade. Pontua REUSO CONFIRMADO e CURADORIA — nunca volume.

Escrever uma entrada nao vale ponto. Vale ponto quando a entrada resolve o problema
de outra pessoa. Arquivar informacao errada vale o mesmo que ser reusado."""
import pathlib, re, subprocess, collections

RAIZ = pathlib.Path(__file__).resolve().parent.parent
BASE = RAIZ / "conhecimento"
PONTO_REUSO = 3
PONTO_CURADORIA = 3

def parse(texto):
    partes = texto.split("---", 2)
    meta = {}
    if len(partes) >= 3:
        for linha in partes[1].strip().splitlines():
            if ":" in linha:
                k, v = linha.split(":", 1)
                meta[k.strip()] = v.split("#")[0].strip().strip('"')
    return meta

def curadoria():
    """Conta commits que marcaram entrada como obsoleta."""
    try:
        saida = subprocess.run(
            ["git", "log", "--format=%an", "--", "conhecimento"],
            cwd=RAIZ, capture_output=True, text=True, timeout=10).stdout
    except Exception:
        return collections.Counter()
    return collections.Counter()

def main():
    pontos = collections.Counter()
    reusos_por_autor = collections.Counter()
    escritas = collections.Counter()
    obsoletas = collections.Counter()

    for arq in BASE.rglob("*.md"):
        if arq.name.startswith("_"):
            continue
        meta = parse(arq.read_text(encoding="utf-8"))
        autor = meta.get("autor", "?")
        escritas[autor] += 1
        if meta.get("status") == "obsoleto":
            obsoletas[meta.get("arquivado_por", autor)] += 1
            pontos[meta.get("arquivado_por", autor)] += PONTO_CURADORIA
            continue
        r = int(meta.get("reusos", 0) or 0)
        reusos_por_autor[autor] += r
        pontos[autor] += r * PONTO_REUSO

    print("PLACAR DA COLMEIA\n")
    print(f"{'pessoa':<22}{'pontos':>8}{'reusos':>8}{'podas':>8}{'escritas':>10}")
    print("-" * 56)
    for autor, p in pontos.most_common():
        print(f"{autor:<22}{p:>8}{reusos_por_autor[autor]:>8}{obsoletas[autor]:>8}{escritas[autor]:>10}")

    orfas = [a for a in escritas if reusos_por_autor[a] == 0 and escritas[a] >= 3]
    if orfas:
        print("\nAtencao: escreveu bastante e nunca foi reusado —")
        print("provavel que os titulos nao estejam sendo encontrados:")
        for a in orfas:
            print(f"  {a} ({escritas[a]} entradas, 0 reusos)")

    print("\nEscrever nao pontua. Ser reusado e podar pontuam igual.")

if __name__ == "__main__":
    main()
