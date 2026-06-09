from fastapi import APIRouter
import yfinance as yf

router = APIRouter()

@router.get("/live")
def get_market_data():

    nifty = yf.Ticker("^NSEI").history(period="1d")
    bank = yf.Ticker("^NSEBANK").history(period="1d")
    vix = yf.Ticker("^INDIAVIX").history(period="1d")

    return {
        "nifty": round(float(nifty["Close"].iloc[-1]), 2),
        "bank": round(float(bank["Close"].iloc[-1]), 2),
        "vix": round(float(vix["Close"].iloc[-1]), 2)
    }