"""Supabase Authentication utilities with Demo Mode support."""

import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.core.config import SUPABASE_KEY, SUPABASE_URL, UserRole
from app.db.database import User, get_session

# Demo mode flag - set DEMO_MODE=true to bypass auth
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

security = HTTPBearer(auto_error=not DEMO_MODE)

# Demo users for each role
DEMO_USERS = {
    "investor": User(
        id=1,
        supabase_uid="demo-investor-001",
        email="investor@demo.bvmt.tn",
        role=UserRole.INVESTOR,
        full_name="Demo Investor",
    ),
    "inspector": User(
        id=2,
        supabase_uid="demo-inspector-001",
        email="inspector@demo.bvmt.tn",
        role=UserRole.CMF_INSPECTOR,
        full_name="Demo CMF Inspector",
    ),
}


def get_supabase_client():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    if DEMO_MODE:
        role = "investor"
        if credentials and credentials.credentials:
            token = credentials.credentials.lower()
            if "inspector" in token:
                role = "inspector"
        return DEMO_USERS[role]

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    token = credentials.credentials

    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

        supabase_user = user_response.user

        db_user = session.exec(
            select(User).where(User.supabase_uid == supabase_user.id)
        ).first()

        if not db_user:
            db_user = User(
                supabase_uid=supabase_user.id,
                email=supabase_user.email or "",
                role=UserRole.INVESTOR,
                full_name=supabase_user.user_metadata.get("full_name", ""),
            )
            session.add(db_user)
            session.commit()
            session.refresh(db_user)

        return db_user

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {exc}",
        )


async def get_current_investor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.INVESTOR, UserRole.CMF_INSPECTOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Investor access required",
        )
    return current_user


async def get_current_inspector(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.CMF_INSPECTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CMF Inspector access required",
        )
    return current_user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    session: Session = Depends(get_session),
) -> Optional[User]:
    if DEMO_MODE:
        return DEMO_USERS["investor"]
    if not credentials:
        return None
    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(credentials.credentials)
        if user_response and user_response.user:
            return session.exec(
                select(User).where(User.supabase_uid == user_response.user.id)
            ).first()
    except Exception:
        return None
    return None
