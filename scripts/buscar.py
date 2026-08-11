#!/usr/bin/env python3
"""Busca por sintoma. Prioriza precisao sobre cobertura: entrada errada custa mais
que entrada ausente, entao devolve no maximo 3 e nunca devolve match fraco."""
import sys, re, pathlib, datetime

RAIZ = pathlib.Path(__file__).resolve().parent.parent
BASE = RAIZ / "conhecimento"
LIMIAR = 0.18
PARADAS = {"de","da","do","em","na","no","the","a","o","e","que","com","para","ao","um","uma"}

def parse(texto):
    partes = texto.split("---", 2)
    if len(partes) < 3:
        return {}, texto
    meta = {}
    for linha in partes[1].strip().splitlines():
        if ":" in linha:
            k, v = linha.split(":", 1)
            meta[k.strip()] = v.split("#")[0].strip().strip('"')
    return meta, partes[2]

def tokens(s):
    return {t for t in re.findall(r"[a-z0-9_]+", s.lower()) if t not in PARADAS and len(t) > 2}

def main():
    if len(sys.argv) < 2:
        print('uso: buscar.py "<sintoma como aparece na tela>"')
        return 2
    consulta = tokens(" ".join(sys.argv[1:]))
    hoje = datetime.date.today()
    achados = []

    for arq in BASE.rglob("*.md"):
        if arq.name.startswith("_"):
            continue
        meta, corpo = parse(arq.read_text(encoding="utf-8"))
        if meta.get("status") == "obsoleto":
            continue
        alvo = tokens(meta.get("sintoma", "")) | tokens(meta.get("escopo", ""))
        if not alvo:
            continue
        # sintoma pesa mais que corpo: e por isso que o titulo tem que ser o sintoma
        score = len(consulta & alvo) / max(len(consulta), 1)
        score += 0.25 * len(consulta & tokens(corpo)) / max(len(consulta), 1)
        if meta.get("status") == "ouro":
            score *= 1.2
        if score >= LIMIAR:
            achados.append((score, arq, meta))

    if not achados:
        print("Nada aplicavel na base. Investigue do zero e considere registrar depois.")
        return 0

    achados.sort(reverse=True, key=lambda x: x[0])
    for score, arq, meta in achados[:3]:
        try:
            venc = datetime.date.fromisoformat(meta.get("valida_ate", ""))
            aviso = "  [VENCIDA — confirme antes de aplicar]" if venc < hoje else ""
        except Exception:
            aviso = "  [sem validade — suspeita]"
        print(f"\n{arq.relative_to(RAIZ)}  ({score:.2f}, {meta.get('status')}, reusos {meta.get('reusos')}){aviso}")
        print(f"  sintoma: {meta.get('sintoma')}")
        print(f"  escopo:  {meta.get('escopo')}  — so aplique se o escopo bater com o seu caso")
    return 0

if __name__ == "__main__":
    sys.exit(main())
