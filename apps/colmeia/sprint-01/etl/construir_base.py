#!/usr/bin/env python3
"""ETL: UCI Online Retail (Franca) -> banco SQLite em star schema + CSVs para o Power BI.

Fonte: https://raw.githubusercontent.com/pycaret/pycaret/master/datasets/france.csv
Origem original: UCI Machine Learning Repository, Online Retail Data Set.
"""
import pandas as pd, sqlite3, pathlib, sys

AQUI = pathlib.Path(__file__).resolve().parent.parent
BRUTO = AQUI / "etl" / "france.csv"
SAIDA = AQUI / "dados"
BANCO = SAIDA / "varejo.db"

def main():
    df = pd.read_csv(BRUTO)
    bruto_n = len(df)

    # OBSTACULO 1: data em M/D/AAAA H:MM. Sem format explicito o parser troca dia/mes
    # em toda linha de dia <= 12 e inventa vendas em meses errados sem levantar erro.
    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"], format="%m/%d/%Y %H:%M")

    # OBSTACULO 2: quantidade negativa nao e erro, e devolucao. Nota fiscal de credito
    # comeca com "C". Filtrar sem entender isso infla o faturamento.
    df["EhDevolucao"] = df["InvoiceNo"].astype(str).str.startswith("C")
    df["ValorLiquido"] = (df["Quantity"] * df["UnitPrice"]).round(2)

    # OBSTACULO 3: CustomerID ausente = venda de balcao, nao linha invalida.
    df["CustomerID"] = df["CustomerID"].fillna(-1).astype(int)

    df["Description"] = df["Description"].fillna("SEM DESCRICAO").str.strip()
    df["Data"] = df["InvoiceDate"].dt.normalize()

    # ---- dimensoes ----
    dim_produto = (df.groupby("StockCode", as_index=False)
                     .agg(Descricao=("Description", "first"),
                          PrecoMedio=("UnitPrice", "mean"))
                     .rename(columns={"StockCode": "CodigoProduto"}))
    dim_produto["PrecoMedio"] = dim_produto["PrecoMedio"].round(2)
    dim_produto["FaixaPreco"] = pd.cut(dim_produto["PrecoMedio"],
        bins=[-0.01, 1, 3, 10, 1e9], labels=["Ate 1", "1 a 3", "3 a 10", "Acima de 10"]).astype(str)

    dim_cliente = (df.groupby("CustomerID", as_index=False)
                     .agg(PrimeiraCompra=("Data", "min"), UltimaCompra=("Data", "max"),
                          Pedidos=("InvoiceNo", "nunique"))
                     .rename(columns={"CustomerID": "ChaveCliente"}))
    dim_cliente["TipoCliente"] = dim_cliente["ChaveCliente"].apply(
        lambda x: "Balcao (nao identificado)" if x == -1 else "Identificado")

    datas = pd.date_range(df["Data"].min(), df["Data"].max(), freq="D")
    MES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
    dim_calendario = pd.DataFrame({"Data": datas})
    dim_calendario["Ano"] = dim_calendario["Data"].dt.year
    dim_calendario["NumeroMes"] = dim_calendario["Data"].dt.month
    dim_calendario["Mes"] = dim_calendario["NumeroMes"].apply(lambda m: MES_PT[m-1])
    dim_calendario["AnoMes"] = dim_calendario["Data"].dt.strftime("%Y-%m")
    dim_calendario["Trimestre"] = "T" + dim_calendario["Data"].dt.quarter.astype(str)
    dim_calendario["Semana"] = dim_calendario["Data"].dt.isocalendar().week.astype(int)
    dim_calendario["InicioSemana"] = (dim_calendario["Data"]
        - pd.to_timedelta(dim_calendario["Data"].dt.weekday, unit="D"))

    # ---- fato ----
    fato = df[["InvoiceNo","StockCode","CustomerID","Data","Quantity",
               "UnitPrice","ValorLiquido","EhDevolucao"]].copy()
    fato.columns = ["Pedido","CodigoProduto","ChaveCliente","Data","Quantidade",
                    "PrecoUnitario","ValorLiquido","EhDevolucao"]
    fato["EhDevolucao"] = fato["EhDevolucao"].astype(int)

    SAIDA.mkdir(exist_ok=True)
    if BANCO.exists():
        BANCO.unlink()
    con = sqlite3.connect(BANCO)
    for nome, tabela in [("dim_produto", dim_produto), ("dim_cliente", dim_cliente),
                         ("dim_calendario", dim_calendario), ("fato_vendas", fato)]:
        t = tabela.copy()
        for c in t.columns:
            if pd.api.types.is_datetime64_any_dtype(t[c]):
                t[c] = t[c].dt.strftime("%Y-%m-%d")
        t.to_sql(nome, con, index=False)
        t.to_csv(SAIDA / f"{nome}.csv", index=False, encoding="utf-8-sig")
        print(f"  {nome:<16} {len(t):>6} linhas")
    con.execute("CREATE INDEX idx_fato_data ON fato_vendas(Data)")
    con.execute("CREATE INDEX idx_fato_produto ON fato_vendas(CodigoProduto)")
    con.commit()

    liquido = fato.loc[fato.EhDevolucao == 0, "ValorLiquido"].sum()
    devol = fato.loc[fato.EhDevolucao == 1, "ValorLiquido"].sum()
    print(f"\n  linhas na origem: {bruto_n}")
    print(f"  periodo: {df.Data.min().date()} a {df.Data.max().date()} "
          f"({(df.Data.max()-df.Data.min()).days} dias)")
    print(f"  faturamento bruto: {liquido:,.2f}")
    print(f"  devolucoes:        {devol:,.2f}  ({abs(devol)/liquido*100:.1f}% do bruto)")
    print(f"  semanas completas: {fato.Data.dt.to_period('W').nunique()}")
    con.close()

if __name__ == "__main__":
    main()
