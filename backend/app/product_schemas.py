import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app import storage


class ProductImage(BaseModel):
    key: str
    alt: str = Field("", max_length=200)

    @field_validator("key")
    @classmethod
    def valid_key(cls, v: str) -> str:
        if not storage.KEY_RE.match(v):
            raise ValueError("Invalid image key")
        return v


class ProductImageOut(ProductImage):
    url: str


class NutritionRow(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    value: str = Field(min_length=1, max_length=60)


class ProductIn(BaseModel):
    """Create/update body. Empty slug, headings and meta fields are generated automatically."""

    # Basics
    title: str = Field(min_length=2, max_length=150)
    flavour: str = Field("", max_length=60)
    size: str = Field("", max_length=30)
    mrp: float = Field(gt=0, le=1_000_000)
    price: float = Field(gt=0, le=1_000_000)
    in_stock: bool = True
    sort_order: int = Field(0, ge=0, le=100_000)

    # Page content
    slug: str = Field("", max_length=100)
    h1: str = Field("", max_length=150)
    h2: str = Field("", max_length=150)
    description: str = Field("", max_length=5000)
    highlights_heading: str = Field("", max_length=100)
    highlights: list[str] = Field(default_factory=list, max_length=12)
    nutrition_heading: str = Field("", max_length=100)
    nutrition: list[NutritionRow] = Field(default_factory=list, max_length=25)
    usage_heading: str = Field("", max_length=100)
    usage: str = Field("", max_length=2000)

    # SEO
    meta_title: str = Field("", max_length=70)
    meta_description: str = Field("", max_length=170)

    images: list[ProductImage] = Field(default_factory=list, max_length=10)

    @field_validator(
        "title", "flavour", "size", "slug", "h1", "h2", "description", "highlights_heading",
        "nutrition_heading", "usage_heading", "usage", "meta_title", "meta_description",
        mode="before",
    )
    @classmethod
    def strip(cls, v):
        return v.strip() if isinstance(v, str) else v

    @field_validator("highlights")
    @classmethod
    def clean_highlights(cls, v: list[str]) -> list[str]:
        items = [s.strip() for s in v if s and s.strip()]
        if any(len(s) > 200 for s in items):
            raise ValueError("Each highlight must be 200 characters or fewer")
        return items

    @field_validator("images")
    @classmethod
    def unique_images(cls, v: list[ProductImage]) -> list[ProductImage]:
        if len({img.key for img in v}) != len(v):
            raise ValueError("The same image is added twice")
        return v

    @model_validator(mode="after")
    def price_not_above_mrp(self):
        if self.price > self.mrp:
            raise ValueError("Selling price cannot be higher than MRP")
        return self


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    flavour: str
    size: str
    mrp: float
    price: float
    in_stock: bool
    sort_order: int
    slug: str
    h1: str
    h2: str
    description: str
    highlights_heading: str
    highlights: list[str]
    nutrition_heading: str
    nutrition: list[NutritionRow]
    usage_heading: str
    usage: str
    meta_title: str
    meta_description: str
    images: list[ProductImageOut]
    status: Literal["draft", "published"]
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime

    @field_validator("images", mode="before")
    @classmethod
    def add_urls(cls, v):
        return [{**img, "url": storage.public_url(img["key"])} for img in v]


class SlugCheck(BaseModel):
    slug: str
    available: bool