def equal_weight_portfolio(tickers):
    n = len(tickers)

    weights = {
        ticker: round(1 / n, 4)
        for ticker in tickers
    }

    return weights

from pypfopt import EfficientFrontier
from pypfopt import expected_returns
from pypfopt import risk_models
import yfinance as yf


def mean_variance_portfolio(tickers):

    prices = yf.download(
        tickers,
        period="1y",
        progress=False
    )["Close"]

    mu = expected_returns.mean_historical_return(
        prices
    )

    S = risk_models.sample_cov(
        prices
    )

    ef = EfficientFrontier(mu, S)

    weights = ef.min_volatility()

    cleaned_weights = ef.clean_weights()

    return cleaned_weights