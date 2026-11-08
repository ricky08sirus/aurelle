from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi.concurrency import run_in_threadpool

ph = PasswordHasher()

# used so login takes the same time whether or not the email exists
DUMMY_HASH = ph.hash("not-a-real-password")


async def hash_password(password: str) -> str:
    return await run_in_threadpool(ph.hash, password)


async def verify_password(hashed: str, password: str) -> bool:
    try:
        return await run_in_threadpool(ph.verify, hashed, password)
    except (VerificationError, InvalidHashError):
        return False