#!/usr/bin/env python3
"""Valida as entradas de conhecimento. Roda no pre-commit e no CI.

Barra: frontmatter incompleto, segredo, dado pessoal, titulo escrito como causa.
Lista: entradas vencidas (--vencidas).
"""
import sys, re, datetime, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
BASE = RAIZ / "conhecimento"
OBRIGATORIOS = ["sintoma", "escopo", "autor", "criado", "valida_ate", "status", "reusos"]
STATUS_VALIDOS = {"bronze", "prata", "ouro", "obsoleto"}

# padroes que nunca podem entrar no repositorio
PROIBIDOS = [
    (r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b", "CPF"),
    (r"\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b", "CNPJ"),
    (r"\bdap[a-z0-9]{32,}\b", "token Databricks"),
    (r"(?i)\b(password|senha|secret|api[_-]?key)\s*[:=]\s*\S+", "credencial"),
    (r"(?i)jdbc:\w+://\S+", "connection string"),
    (r"(?i)\b[a-z0-9._%+-]+@(?!exemplo\.com)[a-z0-9.-]+\.[a-z]{2,}\b", "e-mail"),
    (r"(?i)^\s*\|?\s*(cliente|conta|cpf|nome_cliente)\s*\|", "possivel resultado de query"),
]

def parse(texto):
    if not texto.startswith("---"):
        return None, texto
    partes = texto.split("---", 2)
    if len(partes) < 3:
        return None, texto
    meta = {}
    for linha in partes[1].strip().splitlines():
        if ":" in linha and not linha.strip().startswith("#"):
            k, v = linha.split(":", 1)
            meta[k.strip()] = v.split("#")[0].strip().strip('"')
    return meta, partes[2]

def data(valor):
    try:
        return datetime.date.fromisoformat(valor)
    except Exception:
        return None

def main():
    so_vencidas = "--vencidas" in sys.argv
    hoje = datetime.date.today()
    erros, vencidas, total = [], [], 0

    for arq in sorted(BASE.rglob("*.md")):
        if arq.name.startswith("_"):
            continue
        total += 1
        rel = arq.relative_to(RAIZ)
        texto = arq.read_text(encoding="utf-8")
        meta, corpo = parse(texto)

        if meta is None:
            erros.append(f"{rel}: sem frontmatter")
            continue

        for campo in OBRIGATORIOS:
            if campo not in meta:
                erros.append(f"{rel}: falta o campo '{campo}'")

        if meta.get("status") not in STATUS_VALIDOS:
            erros.append(f"{rel}: status invalido '{meta.get('status')}'")

        venc = data(meta.get("valida_ate", ""))
        if venc is None:
            erros.append(f"{rel}: valida_ate ausente ou mal formatada (use AAAA-MM-DD)")
        elif venc < hoje and meta.get("status") != "obsoleto":
            vencidas.append((rel, venc, int(meta.get("reusos", 0) or 0)))

        if "## O que NÃO funciona" not in corpo:
            erros.append(f"{rel}: falta a secao 'O que NAO funciona' (obrigatoria)")

        sintoma = meta.get("sintoma", "")
        if len(sintoma) < 12:
            erros.append(f"{rel}: sintoma curto demais para ser encontravel")

        for linha_n, linha in enumerate(texto.splitlines(), 1):
            for padrao, nome in PROIBIDOS:
                if re.search(padrao, linha):
                    if nome == "e-mail" and linha.strip().startswith("autor:"):
                        continue
                    erros.append(f"{rel}:{linha_n}: {nome} detectado — nao pode entrar no repositorio")

    if so_vencidas:
        if not vencidas:
            print(f"Nada vencido. {total} entradas na base.")
            return 0
        print(f"{len(vencidas)} entrada(s) vencida(s) — decidir: renovar, reescrever ou arquivar\n")
        for rel, venc, reusos in sorted(vencidas, key=lambda x: x[1]):
            alerta = "  <- nunca foi reusada, o titulo pode nao estar encontravel" if reusos == 0 else ""
            print(f"  {venc}  {rel}  (reusos: {reusos}){alerta}")
        return 0

    if erros:
        print(f"{len(erros)} problema(s):\n")
        for e in erros:
            print(f"  {e}")
        return 1

    print(f"OK. {total} entradas validas. {len(vencidas)} vencida(s) — rode --vencidas.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
