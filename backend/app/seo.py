"""
Automatic URL (slug), headings and meta tags for product pages.
The admin can override any of these; empty values are generated here.
The frontend uses the same rules (lib/seo.ts) to show a live preview.
"""
import re
import unicodedata

BRAND = "Aurelle"
SLUG_MAX = 80
META_TITLE_MAX = 60
META_DESCRIPTION_MAX = 155

DEFAULT_HIGHLIGHTS_HEADING = "Key benefits"
DEFAULT_NUTRITION_HEADING = "Nutrition facts"
DEFAULT_USAGE_HEADING = "How to use"


def slugify(text: str) -> str:
    """'Aurelle Whey Protein Chocolate 1 kg' -> 'aurelle-whey-protein-chocolate-1-kg'"""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    if len(text) > SLUG_MAX:
        text = text[:SLUG_MAX].rsplit("-", 1)[0]
    return text


def truncate(text: str, limit: int) -> str:
    """Shorten at a word boundary and add an ellipsis."""
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    cut = text[: limit - 1].rsplit(" ", 1)[0].rstrip(",.;:-–")
    return f"{cut}…"


def variant(flavour: str, size: str) -> str:
    return ", ".join(p for p in (flavour, size) if p)


def default_slug(title: str, flavour: str, size: str) -> str:
    return slugify(" ".join(p for p in (title, flavour, size) if p))


def default_h1(title: str, flavour: str, size: str) -> str:
    v = variant(flavour, size)
    return f"{title} – {v}" if v else title


def default_h2(title: str) -> str:
    return f"About {title}"


def default_meta_title(h1: str) -> str:
    with_brand = f"{h1} | {BRAND}"
    if BRAND.lower() in h1.lower() or len(with_brand) > META_TITLE_MAX:
        return truncate(h1, META_TITLE_MAX)
    return with_brand


def default_meta_description(description: str, h1: str, price: float) -> str:
    if description.strip():
        return truncate(description, META_DESCRIPTION_MAX)
    return truncate(
        f"Buy {h1} online from {BRAND} at ₹{price:,.0f}. "
        "Genuine products with fast delivery across India.",
        META_DESCRIPTION_MAX,
    )


def fill_defaults(d: dict) -> dict:
    """Fill every empty heading/meta field. `d` holds the fields of ProductIn (except slug)."""
    d["h1"] = d["h1"] or default_h1(d["title"], d["flavour"], d["size"])
    d["h2"] = d["h2"] or default_h2(d["title"])
    d["highlights_heading"] = d["highlights_heading"] or DEFAULT_HIGHLIGHTS_HEADING
    d["nutrition_heading"] = d["nutrition_heading"] or DEFAULT_NUTRITION_HEADING
    d["usage_heading"] = d["usage_heading"] or DEFAULT_USAGE_HEADING
    d["meta_title"] = d["meta_title"] or default_meta_title(d["h1"])
    d["meta_description"] = d["meta_description"] or default_meta_description(
        d["description"], d["h1"], d["price"]
    )
    for img in d["images"]:  # images without alt text get the product name
        img["alt"] = img["alt"] or d["h1"]
    return d