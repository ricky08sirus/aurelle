"use client";

import { RotateCcw } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-navy focus:ring-2 focus:ring-navy/15 disabled:bg-neutral-50";

type BaseProps = {
  id: string;
  label: string;
  hint?: string;
  /** Show "x / max" and turn red when over */
  max?: number;
  /** Field is filled automatically; show the badge and a reset button when edited */
  auto?: { on: boolean; onReset: () => void };
  error?: string;
};

function Label({ id, label, value, max, auto }: BaseProps & { value: string }) {
  const over = max !== undefined && value.length > max;
  return (
    <div className="mb-1.5 flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm font-medium text-neutral-800">
        {label}
      </label>
      <div className="flex items-center gap-2 text-xs">
        {auto &&
          (auto.on ? (
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">Automatic</span>
          ) : (
            <button
              type="button"
              onClick={auto.onReset}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              Use automatic
            </button>
          ))}
        {max !== undefined && (
          <span className={over ? "font-medium text-red-600" : "text-neutral-400"}>
            {value.length}/{max}
          </span>
        )}
      </div>
    </div>
  );
}

export function TextField(
  props: BaseProps & {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    inputMode?: "decimal" | "numeric" | "text";
    prefix?: string;
  },
) {
  const { id, value, onChange, placeholder, inputMode, prefix, hint, error } = props;
  return (
    <div>
      <Label {...props} />
      <div className="flex">
        {prefix && (
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-500">
            {prefix}
          </span>
        )}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={!!error}
          aria-describedby={hint || error ? `${id}-hint` : undefined}
          className={`${inputClass} ${prefix ? "rounded-l-none" : ""} ${error ? "border-red-400" : ""}`}
        />
      </div>
      {(error || hint) && (
        <p id={`${id}-hint`} className={`mt-1.5 text-xs ${error ? "text-red-600" : "text-neutral-500"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function TextArea(
  props: BaseProps & { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string },
) {
  const { id, value, onChange, rows = 4, placeholder, hint, error } = props;
  return (
    <div>
      <Label {...props} />
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint || error ? `${id}-hint` : undefined}
        className={`${inputClass} resize-y leading-6`}
      />
      {(error || hint) && (
        <p id={`${id}-hint`} className={`mt-1.5 text-xs ${error ? "text-red-600" : "text-neutral-500"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export { inputClass };