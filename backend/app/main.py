from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.portfolio import router as portfolio_router
from app.routes.market import router as market_router

app = FastAPI(
    title="Quant Lab API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://quant-lab-tau.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    portfolio_router,
    prefix="/api"
)

app.include_router(
    market_router,
    prefix="/api/market",
    tags=["Market"]
)

@app.get("/")
def root():
    return {
        "message": "Quant Lab API Running"
    }