"""Market endpoints."""

from __future__ import annotations

from typing import Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlmodel import Session, select  # type: ignore[import-not-found]

from app.db.database import PriceData, Stock, get_session
from app.services.sentiment import SentimentService
from app.services.market_data import market_data_service

router = APIRouter(prefix="/api/market", tags=["market"])
sentiment_service = SentimentService()


def _latest_prices(session: Session) -> Dict[str, Dict]:
    statement = select(Stock)
    stocks = session.exec(statement).all()
    results: Dict[str, Dict] = {}
    for stock in stocks:
        latest = session.exec(
            select(PriceData)
            .where(PriceData.stock_id == stock.id)
            .order_by(desc(PriceData.date))
            .limit(2)
        ).all()
        if not latest:
            continue
        current = latest[0]
        previous = latest[1] if len(latest) > 1 else None
        change_pct = (
            (current.close - previous.close) / previous.close * 100
            if previous and previous.close
            else 0.0
        )
        results[stock.code] = {
            "close": current.close,
            "change_pct": round(change_pct, 2),
        }
    return results


@router.get("/overview")
def market_overview(session: Session = Depends(get_session)):
    prices = _latest_prices(session)
    if not prices:
        return {
            "index_name": "TUNINDEX",
            "value": 0.0,
            "change_pct": 0.0,
            "top_gainers": [],
            "top_losers": [],
        }

    change_values = [info["change_pct"] for info in prices.values()]
    tunindex_change = sum(change_values) / len(change_values)
    tunindex_value = 9000 + tunindex_change * 10

    sorted_codes = sorted(prices.items(), key=lambda item: item[1]["change_pct"], reverse=True)
    top_gainers = [code for code, _ in sorted_codes[:5]]
    top_losers = [code for code, _ in sorted_codes[-5:]][::-1]
    return {
        "index_name": "TUNINDEX",
        "value": round(tunindex_value, 2),
        "change_pct": round(tunindex_change, 2),
        "top_gainers": top_gainers,
        "top_losers": top_losers,
    }


@router.get("/top-movers")
def top_movers(session: Session = Depends(get_session)):
    prices = _latest_prices(session)
    sorted_codes = sorted(prices.items(), key=lambda item: item[1]["change_pct"], reverse=True)
    gainers = [
        {"code": code, **info} for code, info in sorted_codes[:5]
    ]
    losers = [
        {"code": code, **info} for code, info in sorted_codes[-5:]
    ][::-1]
    return {"gainers": gainers, "losers": losers}


@router.get("/sentiment")
def market_sentiment():
    sample_sentiments: List[Dict] = []
    return sentiment_service.market_sentiment(sample_sentiments)


@router.get("/live")
def live_market_data():
    return market_data_service.get_market_overview()


@router.get("/live/quote/{stock_code}")
def live_stock_quote(stock_code: str):
    return market_data_service.get_stock_quote(stock_code)


@router.get("/live/tunindex")
def live_tunindex():
    return market_data_service.get_tunindex()


@router.get("/live/movers")
def live_top_movers(limit: int = Query(10, ge=1, le=50)):
    return market_data_service.get_top_movers(limit)
