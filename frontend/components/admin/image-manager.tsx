"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, X } from "lucide-react";
import { deleteImage, uploadImage } from "@/lib/admin-api";
import type { ProductImage } from "@/lib/types";
import { inputClass } from "@/components/admin/form-fields";

const MAX_IMAGES = 10;
const MAX_MB = 5;

export function ImageManager({
  images,
  onChange,
  savedKeys,
}: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  /** Keys already saved on the product: those are deleted from R2 by the backend on save */
  savedKeys: Set<string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");

  async function onFiles(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (!list.length) return;

    setError("");
    const room = MAX_IMAGES - images.length;
    if (list.length > room) {
      setError(`You can add ${room} more image${room === 1 ? "" : "s"} (max ${MAX_IMAGES}).`);
      return;
    }

    let current = images;
    setUploading(list.length);
    for (const file of list) {
      try {
        if (file.size > MAX_MB * 1024 * 1024) throw new Error(`${file.name} is larger than ${MAX_MB} MB`);
        const up = await uploadImage(file);
        current = [...current, { key: up.key, url: up.url, alt: "" }];
        onChange(current);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...images];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  }

  function remove(i: number) {
    const img = images[i];
    // Uploaded in this session but never saved: delete it from R2 right away
    if (!savedKeys.has(img.key)) void deleteImage(img.key);
    onChange(images.filter((_, j) => j !== i));
  }

  function setAlt(i: number, alt: string) {
    onChange(images.map((img, j) => (j === i ? { ...img, alt } : img)));
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.key} className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <Image src={img.url} alt={img.alt || "Product image"} fill sizes="200px" className="object-contain p-3" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-navy px-2 py-0.5 text-[11px] font-medium text-white">
                    Main image
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove image ${i + 1}`}
                  className="absolute top-2 right-2 rounded-full bg-white/90 p-1 text-neutral-600 shadow-sm hover:text-red-600"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Move left"
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={i === images.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move right"
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
              <input
                value={img.alt}
                onChange={(e) => setAlt(i, e.target.value)}
                placeholder="Alt text (automatic if empty)"
                aria-label={`Alt text for image ${i + 1}`}
                maxLength={200}
                className={`${inputClass} py-1.5 text-xs`}
              />
            </li>
          ))}
        </ul>
      )}

      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition ${
          uploading ? "border-navy/40 bg-navy/5" : "border-neutral-300 hover:border-navy/50 hover:bg-neutral-50"
        }`}
      >
        <ImagePlus className="size-6 text-neutral-400" aria-hidden="true" />
        <span className="text-sm font-medium text-neutral-800">
          {uploading ? `Uploading ${uploading} image${uploading > 1 ? "s" : ""}…` : "Upload images"}
        </span>
        <span className="text-xs text-neutral-500">
          JPEG, PNG or WEBP up to {MAX_MB} MB. Square 1200 × 1200 on a white background looks best.
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading > 0 || images.length >= MAX_IMAGES}
          onChange={(e) => onFiles(e.target.files)}
          className="sr-only"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}