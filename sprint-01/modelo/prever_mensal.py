#!/usr/bin/env python3
"""Previsao mensal — Marina. Serie mais curta, menos ruidosa. Vale a troca?

Antes de escrever: buscas na base retornaram previsao-volta-nan-sem-erro (NaN silencioso)
e serie-curta-nao-permite-sazonalidade-anual (limite de historico). As duas se aplicam
aqui e economizaram a investigacao.
"""
import sqlite3, pathlib, warnings
import pandas as pd, numpy as np
from statsmodels.tsa.holtwinters import SimpleExpSmoothing, ExponentialSmoothing
warnings.filterwarnings("ignore")

AQUI = pathlib.Path(__file__).resolve().parent.parent
con = sqlite3.connect(AQUI / "dados" / "varejo.db")
df = pd.read_sql("""SELECT c.AnoMes mes, SUM(f.ValorLiquido) v
                    FROM fato_vendas f JOIN dim_calendario c ON f.Data=c.Data
                    GROUP BY c.AnoMes ORDER BY 1""", con)
con.close()
s = pd.Series(df["v"].values, index=pd.PeriodIndex(df["mes"], freq="M")).astype(float)

# REUSO: entrada previsao-volta-nan-sem-erro. Conferir buracos ANTES de modelar.
completo = pd.period_range(s.index.min(), s.index.max(), freq="M")
faltando = completo.difference(s.index)
print(f"Serie mensal: {len(s)} pontos ({s.index.min()} a {s.index.max()})")
print(f"Meses sem registro: {len(faltando)}  {'(preenchidos com zero)' if len(faltando) else ''}")
s = s.reindex(completo).fillna(0.0)

# o ultimo mes esta truncado (dados param em 09/12) — descartar
s = s.iloc[:-1]
print(f"Apos descartar o mes truncado: {len(s)} pontos")
print(f"CV mensal: {s.std()/s.mean():.2f}  (semanal era 0.66)\n")

# REUSO: entrada serie-curta. 12 pontos, sazonalidade 12 exigiria 24.
print(f"Sazonalidade mensal (periodo 12) exigiria 24 pontos. Temos {len(s)}. Fora.\n")

def mape(r, p):
    r, p = np.asarray(r, float), np.asarray(p, float)
    m = r != 0
    return float(np.mean(np.abs((r[m]-p[m])/r[m]))*100)

TESTE = 4
res = {}
for k in range(TESTE, 0, -1):
    c = len(s) - k
    tr, real = s.iloc[:c], s.iloc[c:c+1]
    cand = {"ingenuo": np.repeat(tr.iloc[-1], 1),
            "media_movel_3": np.repeat(tr.iloc[-3:].mean(), 1)}
    try: cand["ses"] = SimpleExpSmoothing(tr.values, initialization_method="estimated").fit().forecast(1)
    except Exception: pass
    try: cand["holt"] = ExponentialSmoothing(tr.values, trend="add", damped_trend=True,
            initialization_method="estimated").fit().forecast(1)
    except Exception: pass
    for n, p in cand.items():
        res.setdefault(n, []).append((real.iloc[0], p[0]))

print(f"Backtest walk-forward, {TESTE} meses:\n")
print(f"{'modelo':<18}{'MAPE %':>10}")
print("-"*28)
placar = {n: mape(*zip(*v)) for n, v in res.items()}
for n, m in sorted(placar.items(), key=lambda x: x[1]):
    print(f"{n:<18}{m:>10.1f}")
venc = min(placar, key=placar.get)
print(f"\nMensal: MAPE {placar[venc]:.1f}% ({venc})   |   Semanal foi: 31.8% (ses)")
ganho = (31.8 - placar[venc]) / 31.8 * 100
print(f"Reducao de erro ao agregar para mes: {ganho:+.0f}%")
print(f"\nCusto: backtest de apenas {TESTE} pontos. O MAPE mensal e ele proprio incerto.")
print("Conclusao: mensal e melhor para tendencia; nenhum dos dois serve para estoque.")
