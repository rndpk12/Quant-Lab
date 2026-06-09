import yfinance as yf
import pandas as pd
import numpy as np


def calculate_portfolio_metrics(weights):

    prices = pd.DataFrame()

    for ticker in weights.keys():

        data = yf.download(
            ticker,
            period="1y",
            progress=False,
            auto_adjust=True
        )["Close"]

        prices[ticker] = data

    returns = prices.pct_change().dropna()

    weight_array = np.array(
        list(weights.values())
    )

    portfolio_return = (
        returns.mean() @ weight_array
    ) * 252

    portfolio_volatility = np.sqrt(
        weight_array.T
        @ (returns.cov() * 252)
        @ weight_array
    )

    sharpe_ratio = (
        portfolio_return
        / portfolio_volatility
    )

    return {
        "annual_return": round(
            portfolio_return * 100,
            2
        ),
        "volatility": round(
            portfolio_volatility * 100,
            2
        ),
        "sharpe_ratio": round(
            sharpe_ratio,
            2
        )
    }