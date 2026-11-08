import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, UserSession

SESSION_TTL = 60 * 60 * 24 * 7  # 7 days


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def create_session(db: AsyncSession, user_id: uuid.UUID) -> str:
    # remove this user's expired sessions
    await db.execute(
        delete(UserSession).where(
            UserSession.user_id == user_id, UserSession.expires_at < func.now()
        )
    )
    token = secrets.token_urlsafe(32)
    db.add(
        UserSession(
            id=_hash(token),
            user_id=user_id,
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=SESSION_TTL),
        )
    )
    await db.commit()
    return token


async def get_user_by_session(db: AsyncSession, token: str) -> User | None:
    result = await db.execute(
        select(User)
        .join(UserSession, UserSession.user_id == User.id)
        .where(UserSession.id == _hash(token), UserSession.expires_at > func.now())
    )
    return result.scalar_one_or_none()


async def delete_session(db: AsyncSession, token: str) -> None:
    await db.execute(delete(UserSession).where(UserSession.id == _hash(token)))
    await db.commit()