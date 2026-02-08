"""Stock endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select  # type: ignore[import-not-found]

from app.db.database import PriceData, Stock, get_session
from app.services.prediction import PredictionService
from app.services.sentiment import SentimentService
from app.services.anomaly import AnomalyService
from app.services.decision import get_recommendation

router = APIRouter(prefix="/api/stocks", tags=["stocks"])
prediction_service = PredictionService()
sentiment_service = SentimentService()
anomaly_service = AnomalyService()


def _get_stock(session: Session, code: str) -> Stock:
    stock = session.exec(select(Stock).where(Stock.code == code)).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock


def _latest_price(session: Session, stock_id: int):
    rows = session.exec(
        select(PriceData)
        .where(PriceData.stock_id == stock_id)
        .order_by(PriceData.date)  # type: ignore[arg-type]
    ).all()
    return rows[-2:]


def _get_price_history(session: Session, stock_id: int, days: int = 30) -> List[PriceData]:
    cutoff = datetime.now() - timedelta(days=days)
    rows = session.exec(
        select(PriceData)
        .where(PriceData.stock_id == stock_id)
        .where(PriceData.date >= cutoff)
        .order_by(PriceData.date)  # type: ignore[arg-type]
    ).all()
    return list(rows)


def _compute_historical_stats(history: List[PriceData]) -> Dict:
    if len(history) < 2:
        return {}
    
    prev_close = history[-2].close if len(history) >= 2 else history[-1].close
    
    closes = [p.close for p in history]
    volumes = [p.volume for p in history]
    transactions = [p.transactions or 0 for p in history]
    ranges = [(p.high - p.low) / p.close if p.close else 0 for p in history]
    
    def mean(lst):
        return sum(lst) / len(lst) if lst else 0
    
    def std(lst):
        if len(lst) < 2:
            return 1
        avg = mean(lst)
        variance = sum((x - avg) ** 2 for x in lst) / len(lst)
        return variance ** 0.5 or 1
    
    vol_20 = volumes[-20:] if len(volumes) >= 20 else volumes
    price_20 = closes[-20:] if len(closes) >= 20 else closes
    range_10 = ranges[-10:] if len(ranges) >= 10 else ranges
    tx_20 = transactions[-20:] if len(transactions) >= 20 else transactions
    
    return {
        "prev_close": prev_close,
        "volume_ma_20": mean(vol_20),
        "volume_std_20": std(vol_20),
        "price_ma_20": mean(price_20),
        "price_std_20": std(price_20),
        "range_ma_10": mean(range_10),
        "tx_ma_20": mean(tx_20),
    }


@router.get("")
def list_stocks(session: Session = Depends(get_session)):
    stocks = session.exec(select(Stock)).all()
    results = []
    for stock in stocks:
        stock_id = stock.id if stock.id is not None else 0
        latest = _latest_price(session, stock_id)
        current = latest[0] if latest else None
        previous = latest[1] if len(latest) > 1 else None
        change_pct = (
            (current.close - previous.close) / previous.close * 100
            if current and previous and previous.close
            else 0.0
        )
        results.append(
            {
                "code": stock.code,
                "name": stock.name,
                "groupe": stock.groupe,
                "latest_price": current.close if current else None,
                "change_pct": round(change_pct, 2),
                "last_date": current.date if current else None,
            }
        )
    return results


@router.get("/{code}")
def stock_detail(code: str, session: Session = Depends(get_session)):
    stock = _get_stock(session, code)
    stock_id = stock.id if stock.id is not None else 0
    latest = _latest_price(session, stock_id)
    current = latest[0] if latest else None
    previous = latest[1] if len(latest) > 1 else None
    change_pct = (
        (current.close - previous.close) / previous.close * 100
        if current and previous and previous.close
        else 0.0
    )
    return {
        "code": stock.code,
        "name": stock.name,
        "groupe": stock.groupe,
        "latest_price": current.close if current else None,
        "change_pct": round(change_pct, 2),
        "last_date": current.date if current else None,
    }


@router.get("/{code}/history")
def stock_history(
    code: str,
    days: int = Query(30, ge=1, le=3650),
    session: Session = Depends(get_session),
):
    stock = _get_stock(session, code)
    cutoff = datetime.now() - timedelta(days=days)
    stock_id = stock.id if stock.id is not None else 0
    rows = session.exec(
        select(PriceData)
        .where(PriceData.stock_id == stock_id)
        .where(PriceData.date >= cutoff)
        .order_by(PriceData.date)  # type: ignore[arg-type]
    ).all()
    return {
        "stock_code": stock.code,
        "points": [
            {
                "date": row.date,
                "open": row.open,
                "high": row.high,
                "low": row.low,
                "close": row.close,
                "volume": row.volume,
                "transactions": row.transactions,
                "capital": row.capital,
            }
            for row in rows
        ],
    }


@router.get("/{code}/prediction")
def stock_prediction(code: str, session: Session = Depends(get_session)):
    stock = _get_stock(session, code)
    stock_id = stock.id if stock.id is not None else 0
    rows = session.exec(
        select(PriceData)
        .where(PriceData.stock_id == stock_id)
        .order_by(PriceData.date)  # type: ignore[arg-type]
    ).all()
    history = [
        {
            "date": row.date,
            "open": row.open,
            "high": row.high,
            "low": row.low,
            "close": row.close,
            "volume": row.volume,
            "transactions": row.transactions,
        }
        for row in rows
    ]
    import pandas as pd

    history_df = pd.DataFrame(history)
    return prediction_service.predict(stock.code, history_df)


@router.get("/{code}/sentiment")
def stock_sentiment(code: str):
    sample_news = [
        {"title": f"{code} annonce une croissance solide", "url": ""},
        {"title": f"Résultats trimestriels de {code}", "url": ""},
    ]
    return sentiment_service.stock_sentiment(code, sample_news)


@router.get("/{code}/recommendation")
def stock_recommendation(code: str, session: Session = Depends(get_session)):
    stock = _get_stock(session, code)
    stock_id = stock.id if stock.id is not None else 0
    
    prediction = stock_prediction(code, session)
    sentiment = stock_sentiment(code)
    
    history = _get_price_history(session, stock_id, days=30)
    historical_stats = _compute_historical_stats(history)
    
    current_data = {}
    if history:
        latest = history[-1]
        current_data = {
            "open": latest.open,
            "high": latest.high,
            "low": latest.low,
            "close": latest.close,
            "volume": latest.volume,
            "transactions": latest.transactions or 0,
        }
    
    anomalies = anomaly_service.detect(code, current_data, historical_stats)
    return get_recommendation(code, prediction, sentiment, anomalies)


@router.get("/{code}/anomaly")
def stock_anomaly(code: str, session: Session = Depends(get_session)):
    stock = _get_stock(session, code)
    stock_id = stock.id if stock.id is not None else 0
    
    history = _get_price_history(session, stock_id, days=30)
    historical_stats = _compute_historical_stats(history)
    
    current_data = {}
    if history:
        latest = history[-1]
        current_data = {
            "open": latest.open,
            "high": latest.high,
            "low": latest.low,
            "close": latest.close,
            "volume": latest.volume,
            "transactions": latest.transactions or 0,
        }
    
    return anomaly_service.detect(code, current_data, historical_stats)
