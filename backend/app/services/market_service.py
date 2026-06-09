import yfinance as yf


def get_market_indices():

    symbols = {
        "nifty": "^NSEI",
        "sensex": "^BSESN",
        "bank": "^NSEBANK",
        "vix": "^INDIAVIX"
    }

    result = {}

    for key, ticker in symbols.items():

        try:

            data = yf.download(
                ticker,
                period="5d",
                progress=False,
                auto_adjust=True
            )

            if data.empty:
                raise Exception("No data")

            close_prices = data["Close"].squeeze()

            latest = float(close_prices.iloc[-1])
            previous = float(close_prices.iloc[-2])

            change = (
                (latest - previous)
                / previous
            ) * 100

            result[key] = {
                "value": round(latest, 2),
                "change": round(change, 2)
            }

        except Exception as e:

            print(f"Market Error {ticker}: {e}")

            result[key] = {
                "value": 0,
                "change": 0
            }

    return result