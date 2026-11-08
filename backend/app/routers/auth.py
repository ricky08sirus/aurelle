from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import LoginIn, RegisterIn
from app.security import DUMMY_HASH, hash_password, verify_password
from app.sessions import SESSION_TTL, create_session, delete_session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201)
async def register(data: RegisterIn, db: AsyncSession = Depends(get_db)):
    user = User(
        name=data.name,
        email=data.email.lower(),
        phone=data.phone,
        password_hash=await hash_password(data.password),
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email or phone already registered")
    return {"id": str(user.id), "name": user.name, "email": user.email}


@router.post("/login")
async def login(data: LoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user = result.scalar_one_or_none()

    # always run one verify, so timing doesn't reveal whether the email exists
    ok = await verify_password(user.password_hash if user else DUMMY_HASH, data.password)

    if not user or not ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = await create_session(db, user.id)
    response.set_cookie(
        key="session_id",
        value=token,
        max_age=SESSION_TTL,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )
    return {"id": str(user.id), "name": user.name, "email": user.email}


@router.post("/logout")
async def logout(
    response: Response,
    session_id: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if session_id:
        await delete_session(db, session_id)
    response.delete_cookie("session_id")
    return {"ok": True}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "name": user.name, "email": user.email, "phone": user.phone}