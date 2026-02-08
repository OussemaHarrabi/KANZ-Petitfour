from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db.database import News, get_session

router = APIRouter(prefix="/api/news", tags=["news"])


class NewsItem(BaseModel):
    id: int
    url: str
    title: str
    content: Optional[str]
    date: Optional[datetime]
    source: str
    stock_code: Optional[str]
    language: str
    sentiment_score: Optional[float]
    sentiment_label: Optional[str]
    sentiment_confidence: Optional[float]


class NewsCreate(BaseModel):
    url: str
    title: str
    content: Optional[str] = None
    date: Optional[str] = None
    source: str
    stock_code: Optional[str] = None
    language: str = "fr"


class SentimentResult(BaseModel):
    score: float
    label: str
    confidence: float


@router.get("", response_model=List[NewsItem])
def list_news(
    limit: int = Query(20, ge=1, le=100),
    stock_code: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    session: Session = Depends(get_session),
):
    query = select(News)
    
    if stock_code:
        query = query.where(News.stock_code == stock_code)
    if source:
        query = query.where(News.source == source)
    if language:
        query = query.where(News.language == language)
    
    cutoff = datetime.now() - timedelta(days=days)
    query = query.where(News.created_at >= cutoff)
    query = query.order_by(News.date.desc()).limit(limit)  # type: ignore[union-attr]
    
    return session.exec(query).all()


@router.get("/stock/{stock_code}", response_model=List[NewsItem])
def get_stock_news(
    stock_code: str,
    limit: int = Query(10, ge=1, le=50),
    session: Session = Depends(get_session),
):
    query = (
        select(News)
        .where(News.stock_code == stock_code)
        .order_by(News.date.desc())  # type: ignore[union-attr]
        .limit(limit)
    )
    return session.exec(query).all()


@router.get("/sentiment/{stock_code}")
def get_stock_sentiment_summary(
    stock_code: str,
    days: int = Query(7, ge=1, le=30),
    session: Session = Depends(get_session),
):
    cutoff = datetime.now() - timedelta(days=days)
    query = (
        select(News)
        .where(News.stock_code == stock_code)
        .where(News.created_at >= cutoff)
        .where(News.sentiment_score.isnot(None))  # type: ignore[union-attr]
    )
    news_items = session.exec(query).all()
    
    if not news_items:
        return {
            "stock_code": stock_code,
            "period_days": days,
            "article_count": 0,
            "average_score": 0.0,
            "sentiment_label": "neutral",
            "confidence": 0.0,
        }
    
    scores = [n.sentiment_score for n in news_items if n.sentiment_score is not None]
    avg_score = sum(scores) / len(scores) if scores else 0.0
    
    if avg_score > 0.2:
        label = "positive"
    elif avg_score < -0.2:
        label = "negative"
    else:
        label = "neutral"
    
    return {
        "stock_code": stock_code,
        "period_days": days,
        "article_count": len(news_items),
        "average_score": round(avg_score, 3),
        "sentiment_label": label,
        "confidence": min(len(news_items) / 5, 1.0),
    }


@router.get("/market-sentiment")
def get_market_sentiment(
    days: int = Query(7, ge=1, le=30),
    session: Session = Depends(get_session),
):
    cutoff = datetime.now() - timedelta(days=days)
    query = (
        select(News)
        .where(News.created_at >= cutoff)
        .where(News.sentiment_score.isnot(None))  # type: ignore[union-attr]
    )
    news_items = session.exec(query).all()
    
    if not news_items:
        return {
            "period_days": days,
            "article_count": 0,
            "average_score": 0.0,
            "sentiment_label": "neutral",
            "stocks_covered": 0,
        }
    
    scores = [n.sentiment_score for n in news_items if n.sentiment_score is not None]
    avg_score = sum(scores) / len(scores) if scores else 0.0
    
    stocks = set(n.stock_code for n in news_items if n.stock_code)
    
    if avg_score > 0.1:
        label = "bullish"
    elif avg_score < -0.1:
        label = "bearish"
    else:
        label = "neutral"
    
    return {
        "period_days": days,
        "article_count": len(news_items),
        "average_score": round(avg_score, 3),
        "sentiment_label": label,
        "stocks_covered": len(stocks),
    }


@router.post("/analyze")
def analyze_text(text: str = Query(..., min_length=10)):
    try:
        import sys
        sys.path.insert(0, str(__file__).replace("backend/app/api/routes/news.py", "nlp"))
        from nlp.sentiment.analyzer import SentimentAnalyzer
        
        analyzer = SentimentAnalyzer()
        result = analyzer.analyze(text)
        return result
    except ImportError:
        positive_words = {'hausse', 'croissance', 'profit', 'benefice', 'succes', 'gain'}
        negative_words = {'baisse', 'chute', 'perte', 'crise', 'deficit', 'risque'}
        
        text_lower = text.lower()
        pos = sum(1 for w in positive_words if w in text_lower)
        neg = sum(1 for w in negative_words if w in text_lower)
        
        total = pos + neg
        if total == 0:
            return {"score": 0.0, "label": "neutral", "confidence": 0.3}
        
        score = (pos - neg) / total
        label = "positive" if score > 0.2 else "negative" if score < -0.2 else "neutral"
        
        return {
            "score": round(score, 3),
            "label": label,
            "confidence": round(min(total / 5, 1.0), 3),
        }


@router.post("/batch", response_model=List[NewsItem])
def create_news_batch(
    articles: List[NewsCreate],
    session: Session = Depends(get_session),
):
    created = []
    
    try:
        import sys
        sys.path.insert(0, str(__file__).replace("backend/app/api/routes/news.py", "nlp"))
        from nlp.sentiment.analyzer import SentimentAnalyzer
        analyzer = SentimentAnalyzer()
        use_nlp = True
    except ImportError:
        use_nlp = False
        analyzer = None
    
    for article in articles:
        existing = session.exec(
            select(News).where(News.url == article.url)
        ).first()
        
        if existing:
            continue
        
        sentiment_score = None
        sentiment_label = None
        sentiment_confidence = None
        
        if use_nlp and analyzer:
            text = f"{article.title} {article.content or ''}"
            result = analyzer.analyze(text, article.language)
            sentiment_score = result.get("score", 0.0)
            sentiment_label = result.get("label", "neutral")
            sentiment_confidence = result.get("confidence", 0.0)
        
        news = News(
            url=article.url,
            title=article.title,
            content=article.content,
            date=datetime.fromisoformat(article.date) if article.date else None,
            source=article.source,
            stock_code=article.stock_code,
            language=article.language,
            sentiment_score=sentiment_score,
            sentiment_label=sentiment_label,
            sentiment_confidence=sentiment_confidence,
        )
        session.add(news)
        created.append(news)
    
    session.commit()
    
    for news in created:
        session.refresh(news)
    
    return created
