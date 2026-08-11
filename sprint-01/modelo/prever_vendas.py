#!/usr/bin/env python3
"""Previsao de faturamento semanal — equipe de Modelagem.

Backtest walk-forward nas ultimas 8 semanas. Compara quatro candidatos contra o
baseline ingenuo. Se nenhum bater o ingenuo, o resultado do estudo e "nao ha modelo",
e isso e um resultado legitimo.
"""
import sqlite3, pathlib, warnings
import pandas as pd, numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing, SimpleExpSmoothing
warnings.filterwarnings("ignore")

AQUI = pathlib.Path(__file__).resolve().parent.parent
BANCO = AQUI / "dados" / "varejo.db"
SAIDA = AQUI / "modelo"
HORIZONTE = 4       # semanas a prever
JANELA_TESTE = 8    # semanas de backtest

def serie():
    con = sqlite3.connect(BANCO)
    df = pd.read_sql("""
        SELECT c.InicioSemana AS semana, SUM(f.ValorLiquido) AS faturamento
        FROM fato_vendas f JOIN dim_calendario c ON f.Data = c.Data
        GROUP BY c.InicioSemana ORDER BY c.InicioSemana
    """, con)
    con.close()
    df["semana"] = pd.to_datetime(df["semana"])
    s = df.set_index("semana")["faturamento"].asfreq("W-MON")
    # ARMADILHA SILENCIOSA: asfreq cria NaN para semana sem venda (aqui, o Natal de 2010).
    # statsmodels NAO levanta erro com NaN na serie — devolve previsao NaN inteira.
    # Para varejo, semana sem transacao e faturamento zero, nao dado ausente.
    faltando = int(s.isna().sum())
    if faltando:
        print(f"  {faltando} semana(s) sem transacao preenchida(s) com zero: "
              f"{[d.date().isoformat() for d in s[s.isna()].index]}")
        s = s.fillna(0.0)
    # a ultima semana esta truncada (dados terminam numa quinta) — descartar
    return s.iloc[:-1]

def mape(real, prev):
    real, prev = np.asarray(real, float), np.asarray(prev, float)
    m = real != 0
    return float(np.mean(np.abs((real[m] - prev[m]) / real[m])) * 100)

def candidatos(treino, h):
    saida = {}
    saida["ingenuo"] = np.repeat(treino.iloc[-1], h)
    saida["media_movel_4"] = np.repeat(treino.iloc[-4:].mean(), h)
    try:
        saida["ses"] = SimpleExpSmoothing(treino, initialization_method="estimated").fit().forecast(h).values
    except Exception:
        pass
    try:
        saida["holt_amortecido"] = ExponentialSmoothing(
            treino, trend="add", damped_trend=True, seasonal=None,
            initialization_method="estimated").fit().forecast(h).values
    except Exception:
        pass
    return saida

def main():
    s = serie()
    print(f"Serie semanal: {len(s)} pontos, de {s.index.min().date()} a {s.index.max().date()}")
    print(f"Media {s.mean():,.0f} | desvio {s.std():,.0f} | CV {s.std()/s.mean():.2f}\n")

    # LIMITE ESTRUTURAL: sazonalidade anual exige >= 2 ciclos completos.
    print(f"Sazonalidade anual (periodo 52) exige >=104 pontos. Temos {len(s)}.")
    print("Modelo sazonal anual esta fora — nao por escolha, por falta de dado.\n")

    resultados = {}
    for k in range(JANELA_TESTE, 0, -1):
        # ARMADILHA: s.iloc[-k:-k+1] com k=1 vira s.iloc[-1:0] = vazio.
        # Indice negativo em fatia nao "da a volta". Usar posicao absoluta.
        corte = len(s) - k
        treino, real = s.iloc[:corte], s.iloc[corte:corte+1]
        for nome, prev in candidatos(treino, 1).items():
            resultados.setdefault(nome, []).append((real.iloc[0], prev[0]))

    print(f"Backtest walk-forward, {JANELA_TESTE} semanas, horizonte 1:\n")
    print(f"{'modelo':<20}{'MAPE %':>10}{'vs ingenuo':>14}")
    print("-" * 44)
    base = mape(*zip(*resultados["ingenuo"]))
    placar = {}
    for nome, pares in resultados.items():
        m = mape(*zip(*pares))
        placar[nome] = m
        delta = "—" if nome == "ingenuo" else f"{(base-m)/base*100:+.1f}%"
        print(f"{nome:<20}{m:>10.1f}{delta:>14}")

    vencedor = min(placar, key=placar.get)
    print(f"\nVencedor: {vencedor} (MAPE {placar[vencedor]:.1f}%)")
    if placar[vencedor] >= base:
        print("AVISO: nenhum candidato bateu o baseline ingenuo.")
    if placar[vencedor] > 25:
        print(f"AVISO: MAPE de {placar[vencedor]:.0f}% e alto demais para decisao de estoque.")
        print("Use como indicacao de tendencia, nunca como numero de compra.")

    # previsao final
    fit = candidatos(s, HORIZONTE)[vencedor]
    futuro = pd.date_range(s.index.max() + pd.Timedelta(weeks=1), periods=HORIZONTE, freq="W-MON")
    prev = pd.DataFrame({"semana": futuro, "previsao": np.round(fit, 2), "modelo": vencedor})
    residuo = np.std([r - p for r, p in resultados[vencedor]])
    prev["limite_inferior"] = np.round(prev["previsao"] - 1.96 * residuo, 2)
    prev["limite_superior"] = np.round(prev["previsao"] + 1.96 * residuo, 2)
    prev.to_csv(SAIDA / "previsao_semanal.csv", index=False)

    print(f"\nPrevisao das proximas {HORIZONTE} semanas -> modelo/previsao_semanal.csv")
    print(prev.to_string(index=False))
    print(f"\nIntervalo de +/- {1.96*residuo:,.0f} — largura de {2*1.96*residuo/prev.previsao.mean()*100:.0f}% da previsao.")

if __name__ == "__main__":
    main()
