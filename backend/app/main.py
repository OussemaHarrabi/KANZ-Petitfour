"""
KANZ - AI-Powered Trading Assistant for BVMT
FastAPI application entry point with ML model preloading.
"""

from __future__ import annotations

import logging
import os
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import ALLOWED_ORIGINS, PROJECT_NAME
from app.db.database import create_db_and_tables, get_session, is_data_loaded
from app.db.data_loader import load_data
from app.api.routes import market, stocks, portfolio, alerts, auth, news, agent, profile

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("backend.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("kanz")

NLP_PATH = Path(__file__).parent.parent.parent / "nlp"
if str(NLP_PATH) not in sys.path:
    sys.path.insert(0, str(NLP_PATH))

_news_scheduler = None
_ml_status: Dict[str, Any] = {
    "prediction_model": False,
    "anomaly_model": False,
    "sentiment_model": False,
    "load_time_ms": 0,
    "errors": []
}


def _preload_ml_models() -> None:
    """Preload ML models at startup to avoid blocking during requests."""
    global _ml_status
    start_time = time.time()
    errors = []
    
    logger.info("Preloading ML models...")
    
    try:
        from app.services.prediction import PredictionService
        pred_service = PredictionService()
        if pred_service.predictor is not None:
            _ml_status["prediction_model"] = True
            logger.info("[OK] Price prediction model loaded (XGBoost)")
        else:
            logger.warning("[WARN] Price prediction model not available - using fallback")
    except Exception as e:
        error_msg = f"Prediction model load failed: {e}"
        errors.append(error_msg)
        logger.error(error_msg)
    
    try:
        from app.services.anomaly import AnomalyService
        anomaly_service = AnomalyService()
        if anomaly_service.detector is not None:
            _ml_status["anomaly_model"] = True
            logger.info("[OK] Anomaly detection model loaded (IsolationForest)")
        else:
            logger.warning("[WARN] Anomaly detection model not available - using rule-based fallback")
    except Exception as e:
        error_msg = f"Anomaly model load failed: {e}"
        errors.append(error_msg)
        logger.error(error_msg)
    
    try:
        from app.services.sentiment import SentimentService
        sentiment_service = SentimentService()
        _ml_status["sentiment_model"] = True
        logger.info("[OK] Sentiment analysis service ready")
    except Exception as e:
        error_msg = f"Sentiment service load failed: {e}"
        errors.append(error_msg)
        logger.error(error_msg)
    
    load_time = (time.time() - start_time) * 1000
    _ml_status["load_time_ms"] = round(load_time, 2)
    _ml_status["errors"] = errors
    
    logger.info(f"ML models preloaded in {load_time:.0f}ms")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown."""
    logger.info("=" * 50)
    logger.info("KANZ Trading Assistant - Starting up...")
    logger.info("=" * 50)
    
    logger.info("Initializing database...")
    create_db_and_tables()
    with get_session() as session:
        if not is_data_loaded():
            logger.info("Loading historical data...")
            load_data(session)
            logger.info("[OK] Historical data loaded")
        else:
            logger.info("[OK] Database already populated")
    
    _preload_ml_models()
    
    global _news_scheduler
    enable_scheduler = os.environ.get("ENABLE_NEWS_SCHEDULER", "false").lower() == "true"
    if enable_scheduler:
        try:
            from scrapers.scheduler import NewsScheduler
            _news_scheduler = NewsScheduler(interval_seconds=3600)
            _news_scheduler.start()
            logger.info("[OK] News scheduler started (1 hour interval)")
        except Exception as e:
            logger.warning(f"[WARN] Could not start news scheduler: {e}")
    
    logger.info("=" * 50)
    logger.info("KANZ Trading Assistant - Ready!")
    logger.info("=" * 50)
    
    yield
    
    logger.info("Shutting down KANZ...")
    if _news_scheduler:
        _news_scheduler.stop()
        logger.info("[OK] News scheduler stopped")


app = FastAPI(
    title="KANZ - Trading Assistant",
    description="AI-Powered Trading Assistant for the Tunisian Stock Market (BVMT)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Basic health check endpoint."""
    return {"status": "ok", "service": "kanz-trading-assistant"}


@app.get("/api/health/ml")
def ml_health():
    """ML models health check with detailed status."""
    return {
        "status": "ok" if any([
            _ml_status["prediction_model"],
            _ml_status["anomaly_model"],
            _ml_status["sentiment_model"]
        ]) else "degraded",
        "models": {
            "prediction": "loaded" if _ml_status["prediction_model"] else "fallback",
            "anomaly": "loaded" if _ml_status["anomaly_model"] else "fallback",
            "sentiment": "loaded" if _ml_status["sentiment_model"] else "fallback",
        },
        "load_time_ms": _ml_status["load_time_ms"],
        "errors": _ml_status["errors"] if _ml_status["errors"] else None
    }


@app.get("/api/scheduler/status")
def scheduler_status():
    """News scheduler status."""
    global _news_scheduler
    if _news_scheduler:
        return {
            "running": _news_scheduler._running,
            "last_run": _news_scheduler.last_run.isoformat() if _news_scheduler.last_run else None,
            "articles_count": len(_news_scheduler.last_articles),
            "interval_seconds": _news_scheduler.interval,
        }
    return {"running": False, "message": "Scheduler not enabled. Set ENABLE_NEWS_SCHEDULER=true"}


app.include_router(auth.router)
app.include_router(market.router)
app.include_router(stocks.router)
app.include_router(portfolio.router)
app.include_router(alerts.router)
app.include_router(news.router)
app.include_router(agent.router)
app.include_router(profile.router)
