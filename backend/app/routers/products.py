"""Public product endpoints: only published products are visible."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Product
from app.product_schemas import ProductOut

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductOut])
async def list_published(
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .where(Product.status == "published")
        .order_by(Product.sort_order, Product.published_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{slug}", response_model=ProductOut)
async def get_published(slug: str, db: AsyncSession = Depends(get_db)):
    product = await db.scalar(
        select(Product).where(Product.slug == slug, Product.status == "published")
    )
    if not product:
        raise HTTPException(404, "Product not found")
    return product