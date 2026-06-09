import yfinance as yf


def get_stock_data(ticker: str):
    stock = yf.Ticker(ticker)

    hist = stock.history(period="1y")

    if hist.empty:
        return {
            "error": f"No data found for {ticker}"
        }

    return {
        "ticker": ticker,
        "current_price": round(float(hist["Close"].iloc[-1]), 2),
        "high_52w": round(float(hist["High"].max()), 2),
        "low_52w": round(float(hist["Low"].min()), 2)
    }