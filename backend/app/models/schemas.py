"""Pydantic models for API responses and requests."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class StockBase(BaseModel):
    code: str
    name: str
    groupe: int


class StockWithLatest(StockBase):
    latest_price: Optional[float] = None
    change_pct: Optional[float] = None
    last_date: Optional[datetime] = None


class StockDetail(StockBase):
    latest_price: Optional[float] = None
    change_pct: Optional[float] = None
    last_date: Optional[datetime] = None


class PricePoint(BaseModel):
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    transactions: int
    capital: float


class StockHistory(BaseModel):
    stock_code: str
    points: List[PricePoint]


class MarketOverview(BaseModel):
    index_name: str = "TUNINDEX"
    value: float
    change_pct: float
    top_gainers: List[str]
    top_losers: List[str]


class MarketSentiment(BaseModel):
    date: str
    score: float
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    stock: str
    current_price: float
    timestamp: str
    predictions: dict
    recommendation: dict


class SentimentResponse(BaseModel):
    stock: str
    date: str
    score: float
    label: str
    confidence: float
    article_count: int
    articles: List[dict]


class RecommendationResponse(BaseModel):
    action: str
    confidence: float
    reasons: List[str]


class PortfolioPosition(BaseModel):
    id: int
    user_id: str
    stock_code: str
    quantity: int
    avg_buy_price: float
    created_at: datetime
    current_price: Optional[float] = None
    current_value: Optional[float] = None


class PortfolioTradeRequest(BaseModel):
    stock_code: str = Field(..., examples=["SFBT"])
    quantity: int = Field(..., gt=0)
    price: float = Field(..., gt=0)


class AlertResponse(BaseModel):
    id: int
    stock_code: str
    alert_type: str
    message: str
    severity: str
    timestamp: datetime
    is_read: bool
