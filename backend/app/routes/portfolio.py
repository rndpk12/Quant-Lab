from fastapi import APIRouter

from app.models.schemas import (
    StockRequest,
    PortfolioRequest
)

from app.services.data_service import (
    get_stock_data
)

from app.services.optimizer_service import (
    equal_weight_portfolio,
    mean_variance_portfolio
)

from app.services.metrics_service import (
    calculate_portfolio_metrics
)

from app.services.market_service import (
    get_market_indices
)

router = APIRouter()


@router.post("/stock")
def stock_info(request: StockRequest):
    return get_stock_data(request.ticker)


@router.get("/market")
def market_data():
    return get_market_indices()


@router.post("/portfolio/optimize")
def optimize_portfolio(
    request: PortfolioRequest
):

    if request.strategy == "mean_variance":

        weights = mean_variance_portfolio(
            request.tickers
        )

        strategy_name = "Mean Variance"

    else:

        weights = equal_weight_portfolio(
            request.tickers
        )

        strategy_name = "Equal Weight"

    metrics = calculate_portfolio_metrics(
        weights
    )

    return {
        "strategy": strategy_name,
        "weights": weights,
        "metrics": metrics
    }