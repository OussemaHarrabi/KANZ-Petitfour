"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
from supabase import create_client

from app.core.auth import get_current_user
from app.core.config import SUPABASE_KEY, SUPABASE_URL, UserRole
from app.db.database import User, get_session

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "investor"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    full_name: str | None


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest, session: Session = Depends(get_session)):
    """Register a new user."""
    if request.role not in [UserRole.INVESTOR, UserRole.CMF_INSPECTOR]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'investor' or 'cmf_inspector'",
        )

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        auth_response = supabase.auth.sign_up(
            {
                "email": request.email,
                "password": request.password,
                "options": {
                    "data": {"full_name": request.full_name, "role": request.role}
                },
            }
        )

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user",
            )

        db_user = User(
            supabase_uid=auth_response.user.id,
            email=request.email,
            role=request.role,
            full_name=request.full_name,
        )
        session.add(db_user)
        session.commit()
        session.refresh(db_user)

        return AuthResponse(
            access_token=auth_response.session.access_token
            if auth_response.session
            else "",
            user={
                "id": db_user.id,
                "email": db_user.email,
                "role": db_user.role,
                "full_name": db_user.full_name,
            },
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, session: Session = Depends(get_session)):
    """Login user."""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        auth_response = supabase.auth.sign_in_with_password(
            {"email": request.email, "password": request.password}
        )

        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        db_user = session.exec(
            select(User).where(User.supabase_uid == auth_response.user.id)
        ).first()

        if not db_user:
            db_user = User(
                supabase_uid=auth_response.user.id,
                email=request.email,
                role=auth_response.user.user_metadata.get("role", UserRole.INVESTOR),
                full_name=auth_response.user.user_metadata.get("full_name", ""),
            )
            session.add(db_user)
            session.commit()
            session.refresh(db_user)

        return AuthResponse(
            access_token=auth_response.session.access_token,
            user={
                "id": db_user.id,
                "email": db_user.email,
                "role": db_user.role,
                "full_name": db_user.full_name,
            },
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return UserResponse(
        id=current_user.id or 0,
        email=current_user.email,
        role=current_user.role,
        full_name=current_user.full_name,
    )


@router.post("/logout")
async def logout():
    """Logout user (client should clear token)."""
    return {"message": "Logged out successfully"}
