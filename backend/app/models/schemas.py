from pydantic import BaseModel


class StockRequest(BaseModel):
    ticker: str


class PortfolioRequest(BaseModel):
    tickers: list[str]
    strategy: str = "equal_weight"