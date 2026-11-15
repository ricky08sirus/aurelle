"use client";

import { Plus, X } from "lucide-react";
import { inputClass } from "@/components/admin/form-fields";
import type { NutritionRow } from "@/lib/types";

export function HighlightsEditor({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder="e.g. 25 g protein per scoop"
            aria-label={`Benefit ${i + 1}`}
            maxLength={200}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            aria-label={`Remove benefit ${i + 1}`}
            className="rounded-lg px-2 text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      {items.length < 12 && (
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add benefit
        </button>
      )}
    </div>
  );
}

export function NutritionEditor({
  rows,
  onChange,
}: {
  rows: NutritionRow[];
  onChange: (v: NutritionRow[]) => void;
}) {
  const update = (i: number, patch: Partial<NutritionRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_8rem_auto] gap-2">
          <input
            value={row.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="e.g. Protein"
            aria-label={`Nutrient ${i + 1}`}
            maxLength={60}
            className={inputClass}
          />
          <input
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="e.g. 25 g"
            aria-label={`Amount ${i + 1}`}
            maxLength={60}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            aria-label={`Remove row ${i + 1}`}
            className="rounded-lg px-2 text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      {rows.length < 25 && (
        <button
          type="button"
          onClick={() => onChange([...rows, { label: "", value: "" }])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add row
        </button>
      )}
    </div>
  );
}