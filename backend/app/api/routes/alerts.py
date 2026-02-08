"""Alerts endpoints and websocket."""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.database import Alert, User, get_session

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            await connection.send_json(message)


manager = AlertConnectionManager()


@router.get("")
def get_alerts(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    alerts = session.exec(select(Alert).order_by(Alert.timestamp.desc()).limit(50)).all()
    return alerts


@router.get("/unread")
def unread_alerts(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    count = session.exec(select(Alert).where(Alert.is_read == False)).all()
    return {"unread": len(count)}


@router.post("/{alert_id}/read")
def mark_read(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    alert = session.exec(select(Alert).where(Alert.id == alert_id)).first()
    if not alert:
        return {"status": "not_found"}
    alert.is_read = True
    session.add(alert)
    session.commit()
    return {"status": "ok"}


@router.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(5)
            await manager.broadcast(
                {
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat(),
                }
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
