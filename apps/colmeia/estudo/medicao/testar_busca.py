#!/usr/bin/env python3
"""Mede a qualidade da recuperacao contra um conjunto de consultas com resposta conhecida.

Cada caso diz o que a pessoa digitaria e qual entrada deveria voltar (ou nenhuma).
Mede acerto no topo, falso positivo e silencio. Falso positivo pesa mais que silencio:
entrada errada ancora o agente numa correcao errada, entrada ausente so custa tempo.
"""
import subprocess, pathlib, sys, re

RAIZ = pathlib.Path(__file__).resolve().parent.parent.parent

CASOS = [
    # (quem, o que digitaria, arquivo esperado ou None)
    ("diego", "preciso analisar devolucoes por produto", "faturamento-inflado-com-devolucao"),
    ("diego", "quantidade negativa na base de vendas", "faturamento-inflado-com-devolucao"),
    ("diego", "faturamento nao bate com o sistema origem", "faturamento-inflado-com-devolucao"),
    ("diego", "como tratar nota de credito no relatorio", "faturamento-inflado-com-devolucao"),
    ("diego", "linhas com valor negativo devo filtrar", "faturamento-inflado-com-devolucao"),
    ("marina", "previsao devolveu NaN", "previsao-volta-nan-sem-erro"),
    ("marina", "serie temporal com semana faltando", "previsao-volta-nan-sem-erro"),
    ("marina", "quantos meses de historico preciso para sazonalidade", "serie-curta-nao-permite-sazonalidade-anual"),
    ("thiago", "como versionar relatorio power bi no git", "pbix-nao-pode-ser-gerado-por-codigo"),
    ("thiago", "tabelas falham ao atualizar em outra maquina", "pbip-com-csv-precisa-de-parametro"),
    ("bruno", "data veio no mes errado", "data-parseada-no-mes-errado"),
    # casos negativos: nao existe resposta na base, o certo e devolver nada
    ("diego", "como configurar RLS por area de negocio", None),
    ("rafael", "erro de memoria ao treinar rede neural", None),
    ("patricia", "qual o melhor horario para enviar campanha", None),
]

def buscar(q):
    r = subprocess.run([sys.executable, str(RAIZ/"scripts"/"buscar.py"), q],
                       capture_output=True, text=True, cwd=RAIZ)
    linhas = [l for l in r.stdout.splitlines() if l.startswith("conhecimento/")]
    return [re.sub(r"\.md.*", "", l.split("/")[-1]) for l in linhas]

def main():
    acerto_topo = fp = silencio = neg_ok = neg_ruim = 0
    positivos = [c for c in CASOS if c[2]]
    print(f"{'quem':<10}{'consulta':<48}{'resultado'}")
    print("-" * 86)
    for quem, q, esperado in CASOS:
        res = buscar(q)
        topo = res[0] if res else None
        if esperado is None:
            if not res:
                neg_ok += 1; marca = "OK — silencio correto"
            else:
                neg_ruim += 1; marca = f"FALSO POSITIVO -> {topo}"
        elif topo == esperado:
            acerto_topo += 1; marca = "ACERTO no topo"
        elif esperado in res:
            marca = f"achou, mas fora do topo (topo: {topo})"
        elif res:
            fp += 1; marca = f"ERRADO -> {topo}"
        else:
            silencio += 1; marca = "silencio (esperava achar)"
        print(f"{quem:<10}{q[:46]:<48}{marca}")

    n_pos, n_neg = len(positivos), len(CASOS) - len(positivos)
    print("\n" + "=" * 86)
    print(f"Consultas com resposta na base: {n_pos}")
    print(f"  acerto no topo ........ {acerto_topo}/{n_pos}  ({acerto_topo/n_pos*100:.0f}%)")
    print(f"  resposta errada ....... {fp}/{n_pos}  ({fp/n_pos*100:.0f}%)  <- o erro caro")
    print(f"  silencio .............. {silencio}/{n_pos}")
    print(f"Consultas sem resposta na base: {n_neg}")
    print(f"  silencio correto ...... {neg_ok}/{n_neg}")
    print(f"  falso positivo ........ {neg_ruim}/{n_neg}  <- o erro caro")
    total_caro = fp + neg_ruim
    print(f"\nTaxa de resposta errada com confianca: {total_caro}/{len(CASOS)} ({total_caro/len(CASOS)*100:.0f}%)")
    print("H3 (busca tem precisao util) e falsificada se passar de 25%.")

if __name__ == "__main__":
    main()
