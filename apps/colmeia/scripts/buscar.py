#!/usr/bin/env python3
"""Busca por sintoma.

Precisao acima de cobertura: entrada errada ancora o agente numa correcao errada e custa
mais que entrada ausente. Duas defesas, ambas vindas da medicao da rodada 1:

1. PISO. Match fraco nao vira resposta. Abaixo do piso, silencio.
2. MARGEM. Se o primeiro resultado nao se separa do segundo, os dois sao ruido.

O campo `tambem_aparece_como` existe porque um problema tem varios sintomas e so um
deles cabe no titulo. Ele pesa igual ao titulo na busca.
"""
import sys, re, pathlib, datetime

RAIZ = pathlib.Path(__file__).resolve().parent.parent
BASE = RAIZ / "conhecimento"
PISO = 0.40
MARGEM = 1.4
PARADAS = {"de","da","do","em","na","no","the","a","o","e","que","com","para","ao","um",
           "uma","como","preciso","quero","meu","minha","fazer","ser","por","os","as",
           "devo","qual","quais","esta","este","tem","nao","sim","mais","muito"}

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
    return {t for t in re.findall(r"[a-z0-9_]+", (s or "").lower())
            if t not in PARADAS and len(t) > 2}

def main():
    if len(sys.argv) < 2:
        print('uso: buscar.py "<sintoma como aparece na tela>"')
        return 2
    consulta = tokens(" ".join(sys.argv[1:]))
    if not consulta:
        print("Consulta vaga demais. Use a mensagem de erro como aparece na tela.")
        return 0
    hoje = datetime.date.today()
    achados = []

    for arq in BASE.rglob("*.md"):
        if arq.name.startswith("_"):
            continue
        meta, corpo = parse(arq.read_text(encoding="utf-8"))
        if meta.get("status") == "obsoleto":
            continue
        # sintoma e sintomas alternativos pesam igual; escopo pesa; corpo pesa pouco
        chave = tokens(meta.get("sintoma", "")) | tokens(meta.get("tambem_aparece_como", ""))
        escopo = tokens(meta.get("escopo", ""))
        if not chave:
            continue
        n = max(len(consulta), 1)
        score = (len(consulta & chave) / n) + 0.5 * (len(consulta & escopo) / n) \
                + 0.15 * (len(consulta & tokens(corpo)) / n)
        if meta.get("status") == "ouro":
            score *= 1.2
        achados.append((score, arq, meta))

    achados.sort(reverse=True, key=lambda x: x[0])
    if not achados or achados[0][0] < PISO:
        print("Nada aplicavel na base. Investigue do zero e considere registrar depois.")
        return 0
    if len(achados) > 1 and achados[1][0] > 0 and achados[0][0] / achados[1][0] < MARGEM:
        if achados[0][0] < PISO * 1.6:
            print("Resultados ambiguos e nenhum claramente aplicavel — tratando como nada encontrado.")
            print("Refaca a busca com a mensagem de erro literal.")
            return 0

    for score, arq, meta in achados[:3]:
        if score < PISO:
            break
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
