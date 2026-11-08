from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import User
from app.sessions import get_user_by_session


async def get_current_user(
    session_id: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = await get_user_by_session(db, session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired")
    return user