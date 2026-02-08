"""Agent interaction routes."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agent.graph import build_messages, invoke_agent, stream_agent
from app.services.decision import get_recommendation
from app.agent.tools import (
    get_anomaly_detection,
    get_sentiment_analysis,
    get_stock_prediction,
)

router = APIRouter(prefix="/api/agent", tags=["agent"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: Optional[List[ChatMessage]] = None


def _format_history(history: Optional[List[ChatMessage]]) -> Optional[List[Dict[str, str]]]:
    if not history:
        return None
    return [{"role": item.role, "content": item.content} for item in history]


@router.post("/chat")
async def chat_agent(payload: ChatRequest):
    history = _format_history(payload.history)
    messages = build_messages(history, payload.message)

    async def event_stream():
        async for chunk in stream_agent(messages):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/advice/{stock_code}")
def get_investment_advice(stock_code: str) -> Dict[str, Any]:
    try:
        prediction = get_stock_prediction(stock_code)
        sentiment = get_sentiment_analysis(stock_code)
        anomalies = get_anomaly_detection(stock_code)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    recommendation = get_recommendation(stock_code, prediction, sentiment, anomalies)

    return {
        "stock": stock_code,
        "prediction": prediction,
        "sentiment": sentiment,
        "anomalies": anomalies,
        "recommendation": recommendation,
    }
