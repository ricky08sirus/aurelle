"""
Set a new password for an existing user.

Run from the backend folder (with the venv active):
    python reset_password.py you@example.com NEW_PASSWORD

It also logs that user out everywhere, so the new password is needed on every device.
"""
import asyncio
import sys

from sqlalchemy import delete, select

from app.db import SessionLocal, engine
from app.models import User, UserSession
from app.security import hash_password


async def main(email: str, password: str) -> int:
    try:
        async with SessionLocal() as db:
            user = await db.scalar(select(User).where(User.email == email.strip().lower()))
            if not user:
                print(f"No user found with email: {email}")
                admins = (await db.scalars(select(User.email).where(User.is_admin))).all()
                print(f"Admin accounts: {', '.join(admins) or 'none'}")
                return 1

            user.password_hash = await hash_password(password)
            await db.execute(delete(UserSession).where(UserSession.user_id == user.id))
            await db.commit()
            print(f"Password updated for {user.email} (admin: {'yes' if user.is_admin else 'no'})")
            return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python reset_password.py you@example.com NEW_PASSWORD")
        sys.exit(2)
    sys.exit(asyncio.run(main(sys.argv[1], sys.argv[2])))