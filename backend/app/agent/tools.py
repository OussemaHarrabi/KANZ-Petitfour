"""Agent tools wrapping existing services."""

from __future__ import annotations

from typing import Dict, Optional

from sqlmodel import Session, select  # type: ignore[import-not-found]

from app.db.database import PriceData, Stock, get_session

_prediction_service: Optional["PredictionService"] = None
_sentiment_service: Optional["SentimentService"] = None
_anomaly_service: Optional["AnomalyService"] = None


def _get_prediction_service():
    global _prediction_service
    if _prediction_service is None:
        from app.services.prediction import PredictionService
        _prediction_service = PredictionService()
    return _prediction_service


def _get_sentiment_service():
    global _sentiment_service
    if _sentiment_service is None:
        from app.services.sentiment import SentimentService
        _sentiment_service = SentimentService()
    return _sentiment_service


def _get_anomaly_service():
    global _anomaly_service
    if _anomaly_service is None:
        from app.services.anomaly import AnomalyService
        _anomaly_service = AnomalyService()
    return _anomaly_service


def _get_stock(session: Session, code: str) -> Stock:
    stock = session.exec(select(Stock).where(Stock.code == code)).first()
    if not stock:
        raise ValueError("Stock not found")
    return stock


def _get_history(session: Session, stock_id: int):
    rows = session.exec(
        select(PriceData)
        .where(PriceData.stock_id == stock_id)
        .order_by(PriceData.date)  # type: ignore[arg-type]
    ).all()
    return list(rows)


def _compute_historical_stats(history):
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


def get_stock_prediction(stock_code: str) -> Dict:
    """Call prediction service for stock_code."""
    with get_session() as session:
        stock = _get_stock(session, stock_code)
        stock_id = stock.id if stock.id is not None else 0
        rows = _get_history(session, stock_id)
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
    return _get_prediction_service().predict(stock_code, history_df)


def get_anomaly_detection(stock_code: str) -> Dict:
    """Call anomaly detection service for stock_code."""
    with get_session() as session:
        stock = _get_stock(session, stock_code)
        stock_id = stock.id if stock.id is not None else 0
        history = _get_history(session, stock_id)
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

    return _get_anomaly_service().detect(stock_code, current_data, historical_stats)


def get_sentiment_analysis(stock_code: str) -> Dict:
    """Call sentiment service for stock_code."""
    sample_news = [
        {"title": f"{stock_code} annonce une croissance solide", "url": ""},
        {"title": f"Résultats trimestriels de {stock_code}", "url": ""},
    ]
    return _get_sentiment_service().stock_sentiment(stock_code, sample_news)


def search_cmf_regulations(query: str) -> Dict:
    """Search CMF regulations using in-memory RAG."""
    from app.agent.rag import format_cmf_context
    context = format_cmf_context(query)
    return {"query": query, "context": context}
