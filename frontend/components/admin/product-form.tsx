"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, TextArea, TextField } from "@/components/admin/form-fields";
import { HighlightsEditor, NutritionEditor } from "@/components/admin/list-editors";
import { ImageManager } from "@/components/admin/image-manager";
import { SeoPreview } from "@/components/admin/seo-preview";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminApi } from "@/lib/admin-api";
import * as seo from "@/lib/seo";
import type { NutritionRow, Product, ProductImage, ProductInput } from "@/lib/types";

/** Fields that fill themselves in from the product details until the admin edits them */
type AutoField =
  | "slug"
  | "h1"
  | "h2"
  | "highlights_heading"
  | "nutrition_heading"
  | "usage_heading"
  | "meta_title"
  | "meta_description";

type FormState = {
  title: string;
  flavour: string;
  size: string;
  mrp: string;
  price: string;
  in_stock: boolean;
  sort_order: string;
  description: string;
  highlights: string[];
  nutrition: NutritionRow[];
  usage: string;
  images: ProductImage[];
} & Record<AutoField, string>;

const EMPTY: FormState = {
  title: "", flavour: "", size: "", mrp: "", price: "", in_stock: true, sort_order: "0",
  description: "", highlights: [], nutrition: [], usage: "", images: [],
  slug: "", h1: "", h2: "", highlights_heading: "", nutrition_heading: "", usage_heading: "",
  meta_title: "", meta_description: "",
};

/** Values the automatic fields would have, given the rest of the form */
function generate(f: FormState, h1Auto: boolean): Record<AutoField, string> {
  const h1 = h1Auto ? seo.defaultH1(f.title, f.flavour, f.size) : f.h1;
  return {
    slug: seo.defaultSlug(f.title, f.flavour, f.size),
    h1,
    h2: seo.defaultH2(f.title),
    highlights_heading: seo.DEFAULT_HIGHLIGHTS_HEADING,
    nutrition_heading: seo.DEFAULT_NUTRITION_HEADING,
    usage_heading: seo.DEFAULT_USAGE_HEADING,
    meta_title: seo.defaultMetaTitle(h1),
    meta_description: seo.defaultMetaDescription(f.description, h1, Number(f.price) || 0),
  };
}

function fromProduct(p?: Product): { form: FormState; auto: Record<AutoField, boolean> } {
  if (!p) {
    const all = { slug: true, h1: true, h2: true, highlights_heading: true, nutrition_heading: true,
      usage_heading: true, meta_title: true, meta_description: true };
    return { form: EMPTY, auto: all };
  }
  const form: FormState = {
    title: p.title, flavour: p.flavour, size: p.size, mrp: String(p.mrp), price: String(p.price),
    in_stock: p.in_stock, sort_order: String(p.sort_order), description: p.description,
    highlights: p.highlights, nutrition: p.nutrition, usage: p.usage, images: p.images,
    slug: p.slug, h1: p.h1, h2: p.h2, highlights_heading: p.highlights_heading,
    nutrition_heading: p.nutrition_heading, usage_heading: p.usage_heading,
    meta_title: p.meta_title, meta_description: p.meta_description,
  };
  // A saved value that still equals the generated one keeps updating automatically
  const gen = generate(form, false);
  const auto = {
    // The URL of a live product never changes by itself: that would break existing links
    slug: p.status === "draft" && p.slug === gen.slug,
    h1: p.h1 === seo.defaultH1(p.title, p.flavour, p.size),
    h2: p.h2 === gen.h2,
    highlights_heading: p.highlights_heading === gen.highlights_heading,
    nutrition_heading: p.nutrition_heading === gen.nutrition_heading,
    usage_heading: p.usage_heading === gen.usage_heading,
    meta_title: p.meta_title === gen.meta_title,
    meta_description: p.meta_description === gen.meta_description,
  };
  return { form, auto };
}

export function ProductForm({ product: initial, initialNotice }: { product?: Product; initialNotice?: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | undefined>(initial);
  const [{ form, auto }, setState] = useState(() => fromProduct(initial));
  const [savedSnapshot, setSavedSnapshot] = useState(() => {
    const init = fromProduct(initial);
    return JSON.stringify(buildPayload(init.form, init.auto, !initial));
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(initialNotice ?? "");
  const [error, setError] = useState("");
  const [slugStatus, setSlugStatus] = useState<{ slug: string; available: boolean } | null>(null);

  const gen = useMemo(() => generate(form, auto.h1), [form, auto.h1]);
  /** What each automatic field will actually be saved as */
  const value = (k: AutoField) => (auto[k] ? gen[k] : form[k]);

  const set = <K extends keyof FormState>(key: K, v: FormState[K]) =>
    setState((s) => ({ ...s, form: { ...s.form, [key]: v } }));

  const setManual = (key: AutoField, v: string) =>
    setState((s) => ({ form: { ...s.form, [key]: v }, auto: { ...s.auto, [key]: false } }));

  const resetAuto = (key: AutoField) =>
    setState((s) => ({ ...s, auto: { ...s.auto, [key]: true } }));

  const autoProps = (key: AutoField) => ({ on: auto[key], onReset: () => resetAuto(key) });

  const savedKeys = useMemo(() => new Set(product?.images.map((i) => i.key)), [product]);

  const payload = () => buildPayload(form, auto, !product);
  const snapshot = JSON.stringify(payload());
  const dirty = snapshot !== savedSnapshot;

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Live check that the URL is free
  const currentSlug = value("slug");
  useEffect(() => {
    if (!currentSlug) return;
    let active = true;
    const t = setTimeout(() => {
      adminApi
        .slugCheck(currentSlug, product?.id)
        .then((r) => active && setSlugStatus(r))
        .catch(() => active && setSlugStatus(null));
    }, 400);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [currentSlug, product?.id]);

  function validate(forPublish: boolean): string {
    const mrp = Number(form.mrp);
    const price = Number(form.price);
    if (form.title.trim().length < 2) return "Add a product title.";
    if (!(mrp > 0)) return "Enter the MRP as a number, e.g. 3499.";
    if (!(price > 0)) return "Enter the selling price as a number, e.g. 2499.";
    if (price > mrp) return "The selling price can't be higher than the MRP.";
    if (forPublish && form.images.length === 0) return "Add at least one image before publishing.";
    if (value("meta_title").length > 70) return "Shorten the meta title to 70 characters or fewer.";
    if (value("meta_description").length > 170) return "Shorten the meta description to 170 characters or fewer.";
    return "";
  }

  async function save(publish: boolean) {
    const problem = validate(publish || product?.status === "published");
    if (problem) {
      setError(problem);
      setNotice("");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const body = payload();
      let saved = product ? await adminApi.update(product.id, body) : await adminApi.create(body);
      if (publish && saved.status !== "published") saved = await adminApi.publish(saved.id);

      if (!product) {
        setSavedSnapshot(JSON.stringify(body));
        router.replace(`/admin/products/${saved.id}?notice=${publish ? "published" : "created"}`);
        return;
      }
      const next = fromProduct(saved);
      setProduct(saved);
      setState(next);
      setSavedSnapshot(JSON.stringify(buildPayload(next.form, next.auto, false)));
      setNotice(publish ? "Published. It's now live on the website." : "Changes saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    if (!product) return;
    setBusy(true);
    setError("");
    try {
      const saved = await adminApi.unpublish(product.id);
      setProduct(saved);
      setNotice("Unpublished. The page is hidden from the website.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!product || !confirm(`Delete "${product.h1}"? Its page and images will be removed permanently.`)) return;
    setBusy(true);
    try {
      await adminApi.remove(product.id);
      setSavedSnapshot(snapshot);
      router.replace("/admin/products");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const isLive = product?.status === "published";
  const slugChangedOnLive = isLive && value("slug") !== product?.slug;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Products
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
            {product ? value("h1") || "Untitled product" : "Add product"}
          </h1>
        </div>
        {product && <StatusBadge status={product.status} />}
      </div>

      {(notice || error) && (
        <p
          role="status"
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
        >
          {error || notice}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Section title="Product details">
            <TextField id="title" label="Title" value={form.title} onChange={(v) => set("title", v)}
              placeholder="e.g. Aurelle Whey Protein" />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField id="flavour" label="Flavour" value={form.flavour} onChange={(v) => set("flavour", v)}
                placeholder="e.g. Chocolate" />
              <TextField id="size" label="Size" value={form.size} onChange={(v) => set("size", v)}
                placeholder="e.g. 1 kg" />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <TextField id="mrp" label="MRP" prefix="₹" inputMode="decimal" value={form.mrp}
                onChange={(v) => set("mrp", v)} placeholder="3499" />
              <TextField id="price" label="Selling price" prefix="₹" inputMode="decimal" value={form.price}
                onChange={(v) => set("price", v)} placeholder="2499" />
              <TextField id="sort" label="Position" inputMode="numeric" value={form.sort_order}
                onChange={(v) => set("sort_order", v.replace(/\D/g, ""))} hint="Lower numbers show first" />
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-800">
              <input type="checkbox" checked={form.in_stock} onChange={(e) => set("in_stock", e.target.checked)}
                className="size-4 accent-navy" />
              In stock
            </label>
          </Section>

          <Section title="Images" description="The first image is used on the home page and in search results.">
            <ImageManager images={form.images} onChange={(v) => set("images", v)} savedKeys={savedKeys} />
          </Section>

          <Section title="Page content" description="Headings fill in automatically from the product details. Edit any of them to write your own.">
            <TextField id="h1" label="Main heading (H1)" value={value("h1")} onChange={(v) => setManual("h1", v)}
              auto={autoProps("h1")} max={150} />
            <TextField id="h2" label="Description heading (H2)" value={value("h2")} onChange={(v) => setManual("h2", v)}
              auto={autoProps("h2")} max={150} />
            <TextArea id="description" label="Description" value={form.description} rows={6}
              onChange={(v) => set("description", v)}
              hint="Leave a blank line between paragraphs. The first sentences also become the meta description." />

            <div className="border-t border-neutral-100 pt-5">
              <TextField id="highlights_heading" label="Benefits heading (H3)" value={value("highlights_heading")}
                onChange={(v) => setManual("highlights_heading", v)} auto={autoProps("highlights_heading")} max={100} />
              <div className="mt-3">
                <HighlightsEditor items={form.highlights} onChange={(v) => set("highlights", v)} />
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-5">
              <TextField id="nutrition_heading" label="Nutrition heading (H3)" value={value("nutrition_heading")}
                onChange={(v) => setManual("nutrition_heading", v)} auto={autoProps("nutrition_heading")} max={100} />
              <div className="mt-3">
                <NutritionEditor rows={form.nutrition} onChange={(v) => set("nutrition", v)} />
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-5 space-y-5">
              <TextField id="usage_heading" label="Usage heading (H3)" value={value("usage_heading")}
                onChange={(v) => setManual("usage_heading", v)} auto={autoProps("usage_heading")} max={100} />
              <TextArea id="usage" label="How to use" value={form.usage} rows={3} onChange={(v) => set("usage", v)}
                placeholder="e.g. Mix 1 scoop (33 g) with 200 ml of water or milk. Take after your workout." />
            </div>
          </Section>

          <Section title="Search engine listing" description="Filled in automatically. Edit to customise how the page appears on Google.">
            <TextField id="meta_title" label="Meta title" value={value("meta_title")}
              onChange={(v) => setManual("meta_title", v)} auto={autoProps("meta_title")} max={seo.META_TITLE_MAX} />
            <TextArea id="meta_description" label="Meta description" value={value("meta_description")} rows={3}
              onChange={(v) => setManual("meta_description", v)} auto={autoProps("meta_description")}
              max={seo.META_DESCRIPTION_MAX} />
            <SeoPreview title={value("meta_title")} description={value("meta_description")} slug={value("slug")} />
          </Section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold text-neutral-900">Publish</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {isLive
                ? "This product is live. Saving updates the website immediately."
                : "Drafts are only visible here. Publish to show the product on the website."}
            </p>
            {dirty && <p className="mt-3 text-xs font-medium text-amber-700">You have unsaved changes.</p>}
            <div className="mt-4 flex flex-col gap-2">
              {isLive ? (
                <>
                  <Button disabled={busy} onClick={() => save(false)} className="h-10 bg-navy hover:bg-navy-dark">
                    {busy ? "Saving…" : "Update"}
                  </Button>
                  <Button disabled={busy} variant="outline" onClick={unpublish} className="h-10">
                    Unpublish
                  </Button>
                </>
              ) : (
                <>
                  <Button disabled={busy} onClick={() => save(true)} className="h-10 bg-navy hover:bg-navy-dark">
                    {busy ? "Saving…" : "Publish"}
                  </Button>
                  <Button disabled={busy} variant="outline" onClick={() => save(false)} className="h-10">
                    Save draft
                  </Button>
                </>
              )}
              {isLive && product && (
                <a
                  href={`/products/${product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center justify-center gap-1.5 text-sm text-navy hover:underline"
                >
                  View on website
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <TextField
              id="slug"
              label="Page URL"
              value={value("slug")}
              onChange={(v) => setManual("slug", v)}
              auto={autoProps("slug")}
              hint="Lowercase letters, numbers and hyphens. Other characters are converted when you save."
            />
            <p className="mt-2 text-xs break-all text-neutral-700">
              /products/<span className="font-medium">{seo.slugify(currentSlug) || "…"}</span>
            </p>
            {slugStatus && slugStatus.slug === seo.slugify(currentSlug) && currentSlug && (
              <p className={`mt-2 text-xs ${slugStatus.available ? "text-emerald-700" : auto.slug && !product ? "text-amber-700" : "text-red-600"}`}>
                {slugStatus.available
                  ? "This URL is available."
                  : auto.slug && !product
                    ? "Already used by another product. A number will be added, e.g. -2."
                    : "Already used by another product. Choose a different URL."}
              </p>
            )}
            {slugChangedOnLive && (
              <p className="mt-2 text-xs text-amber-700">
                This product is live. Changing its URL breaks links already shared or indexed by Google.
              </p>
            )}
          </div>

          {product && (
            <div className="rounded-xl border border-red-100 bg-white p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Delete product</h2>
              <p className="mt-1 text-xs text-neutral-500">Removes the page and its images permanently.</p>
              <Button disabled={busy} variant="destructive" size="sm" onClick={remove} className="mt-3">
                Delete product
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/** The request body, using generated values for every field still on "Automatic" */
function buildPayload(form: FormState, auto: Record<AutoField, boolean>, isNew: boolean): ProductInput {
  const gen = generate(form, auto.h1);
  const value = (k: AutoField) => (auto[k] ? gen[k] : form[k]);
  return {
    title: form.title.trim(),
    flavour: form.flavour.trim(),
    size: form.size.trim(),
    mrp: Number(form.mrp),
    price: Number(form.price),
    in_stock: form.in_stock,
    sort_order: Number(form.sort_order) || 0,
    // A generated URL for a new product is sent empty so the server can add -2, -3 if it is taken
    slug: auto.slug && isNew ? "" : value("slug"),
    h1: value("h1"),
    h2: value("h2"),
    description: form.description,
    highlights_heading: value("highlights_heading"),
    highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
    nutrition_heading: value("nutrition_heading"),
    nutrition: form.nutrition.filter((r) => r.label.trim() && r.value.trim()),
    usage_heading: value("usage_heading"),
    usage: form.usage,
    meta_title: value("meta_title"),
    meta_description: value("meta_description"),
    images: form.images.map(({ key, alt }) => ({ key, alt })),
  };
}