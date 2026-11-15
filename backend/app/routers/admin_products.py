"""Admin product management: create, edit, publish, unpublish, delete."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app import seo, storage
from app.db import get_db
from app.deps import require_admin
from app.models import Product
from app.product_schemas import ProductIn, ProductOut, SlugCheck

router = APIRouter(
    prefix="/admin/products",
    tags=["admin: products"],
    dependencies=[Depends(require_admin)],
)


# ── helpers ──────────────────────────────────────────────

async def _slug_taken(db: AsyncSession, slug: str, exclude_id: uuid.UUID | None) -> bool:
    query = select(Product.id).where(Product.slug == slug)
    if exclude_id:
        query = query.where(Product.id != exclude_id)
    return await db.scalar(query) is not None


async def _resolve_slug(db: AsyncSession, data: ProductIn, exclude_id: uuid.UUID | None) -> str:
    # A URL typed by the admin must be free: we never silently change it
    if data.slug:
        slug = seo.slugify(data.slug)
        if not slug:
            raise HTTPException(400, "The URL must contain letters or numbers")
        if await _slug_taken(db, slug, exclude_id):
            raise HTTPException(409, f"The URL /products/{slug} is already used by another product")
        return slug

    # Generated URL: add -2, -3 ... until it is free
    base = seo.default_slug(data.title, data.flavour, data.size) or "product"
    slug, n = base, 2
    while await _slug_taken(db, slug, exclude_id):
        slug, n = f"{base}-{n}", n + 1
    return slug


def _values(data: ProductIn) -> dict:
    d = data.model_dump(exclude={"slug"})
    return seo.fill_defaults(d)


async def _get(db: AsyncSession, product_id: uuid.UUID) -> Product:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    return product


async def _commit(db: AsyncSession) -> None:
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, "This URL is already used by another product")


async def _delete_images(keys: set[str]) -> None:
    """Best effort: a failed delete only leaves an unused file in R2."""
    for key in keys:
        try:
            await storage.delete(key)
        except HTTPException:
            pass


# ── endpoints ────────────────────────────────────────────

@router.get("", response_model=list[ProductOut])
async def list_all(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).order_by(Product.updated_at.desc()))
    return result.scalars().all()


@router.get("/slug-check", response_model=SlugCheck)
async def slug_check(
    slug: str = Query(..., max_length=100),
    exclude_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    clean = seo.slugify(slug)
    return SlugCheck(slug=clean, available=bool(clean) and not await _slug_taken(db, clean, exclude_id))


@router.get("/{product_id}", response_model=ProductOut)
async def get_one(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await _get(db, product_id)


@router.post("", response_model=ProductOut, status_code=201)
async def create(data: ProductIn, db: AsyncSession = Depends(get_db)):
    product = Product(**_values(data), slug=await _resolve_slug(db, data, None), status="draft")
    db.add(product)
    await _commit(db)
    await db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
async def update(product_id: uuid.UUID, data: ProductIn, db: AsyncSession = Depends(get_db)):
    product = await _get(db, product_id)
    old_keys = {img["key"] for img in product.images}

    if product.status == "published" and not data.images:
        raise HTTPException(400, "A published product needs at least one image")

    for field, value in _values(data).items():
        setattr(product, field, value)
    product.slug = await _resolve_slug(db, data, product.id)
    await _commit(db)
    await db.refresh(product)

    # Remove images that were taken off the product from R2
    await _delete_images(old_keys - {img["key"] for img in product.images})
    return product


@router.post("/{product_id}/publish", response_model=ProductOut)
async def publish(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    product = await _get(db, product_id)
    if not product.images:
        raise HTTPException(400, "Add at least one image before publishing")
    product.status = "published"
    product.published_at = product.published_at or datetime.now(timezone.utc)
    await _commit(db)
    await db.refresh(product)
    return product


@router.post("/{product_id}/unpublish", response_model=ProductOut)
async def unpublish(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    product = await _get(db, product_id)
    product.status = "draft"
    await _commit(db)
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
async def delete(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    product = await _get(db, product_id)
    keys = {img["key"] for img in product.images}
    await db.delete(product)
    await db.commit()
    await _delete_images(keys)