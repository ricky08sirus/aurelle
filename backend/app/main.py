from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.routers import auth, images

app = FastAPI()
app.include_router(auth.router)
app.include_router(images.router)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/health/db")
async def health_db(db: AsyncSession = Depends(get_db)):
    await db.execute(text("select 1"))
    return {"db": "ok"}