import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { FileText, ImageIcon, Loader2, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { SmartMedia } from "@/components/ui/SmartMedia";
import { slugify } from "@/lib/format";
import { hasLink } from "@/lib/media";

/* ------------------------------------------------------------------ layout */

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** Label + control + validation message, so every admin field reports errors identically. */
export function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  className = "",
}: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required ? <span className="ml-1 text-rose-300">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-rose-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ inputs */

interface TextFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "url" | "number" | "date" | "datetime-local";
  autoComplete?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  /** Derive the value from the label field as the user types (slug-style fields). */
  slugFrom?: string;
}

export function TextField({
  name,
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  required = false,
  type = "text",
  autoComplete,
  disabled = false,
  min,
  max,
  slugFrom,
}: TextFieldProps) {
  const id = useId();
  const autoId = `field-${id}`;

  return (
    <FieldShell label={label} htmlFor={autoId} error={error} hint={hint} required={required}>
      <input
        id={autoId}
        name={name}
        type={type}
        value={value}
        min={min}
        max={max}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${autoId}-error` : hint ? `${autoId}-hint` : undefined}
        onChange={(event) => {
          const next = event.target.value;
          onChange(slugFrom ? slugify(next) : next);
        }}
        className={`field ${error ? "field-invalid" : ""}`}
      />
      {slugFrom ? <p className="mt-1.5 text-xs text-fg-subtle">Generated from “{slugFrom}”.</p> : null}
    </FieldShell>
  );
}

interface TextAreaFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  disabled?: boolean;
}

export function TextAreaField({
  name,
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  required = false,
  rows = 4,
  disabled = false,
}: TextAreaFieldProps) {
  const id = useId();
  const autoId = `field-${id}`;

  return (
    <FieldShell label={label} htmlFor={autoId} error={error} hint={hint} required={required}>
      <textarea
        id={autoId}
        name={name}
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${autoId}-error` : hint ? `${autoId}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`field resize-y ${error ? "field-invalid" : ""}`}
      />
    </FieldShell>
  );
}

interface SelectFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Option values may be numeric (id pickers) or strings (curated enums). */
  options: { value: string | number; label: string }[];
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function SelectField({
  name,
  label,
  value,
  onChange,
  options,
  error,
  hint,
  required = false,
  disabled = false,
  placeholder,
}: SelectFieldProps) {
  const id = useId();
  const autoId = `field-${id}`;

  return (
    <FieldShell label={label} htmlFor={autoId} error={error} hint={hint} required={required}>
      <select
        id={autoId}
        name={name}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={`field ${error ? "field-invalid" : ""}`}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface ToggleFieldProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: ReactNode;
  disabled?: boolean;
}

export function ToggleField({ name, label, checked, onChange, hint, disabled = false }: ToggleFieldProps) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-xs leading-relaxed text-fg-subtle">{hint}</p> : null}
      </div>
      <button
        id={id}
        name={name}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          checked ? "bg-accent-500" : "bg-white/12"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-5.5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

interface MultiSelectFieldProps {
  name: string;
  label: string;
  values: number[];
  onChange: (values: number[]) => void;
  options: { value: number; label: string }[];
  error?: string;
  hint?: ReactNode;
  disabled?: boolean;
  emptyLabel?: string;
}

/** Checkbox picker for the `List<int>` relations (project categories/tags/technologies, skill types). */
export function MultiSelectField({
  name,
  label,
  values,
  onChange,
  options,
  error,
  hint,
  disabled = false,
  emptyLabel = "Nothing available yet.",
}: MultiSelectFieldProps) {
  const selected = useMemo(() => new Set(values), [values]);

  const toggle = (value: number) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange([...next]);
  };

  return (
    <FieldShell label={label} htmlFor={`${name}-search`} error={error} hint={hint}>
      <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-3">
        {options.length === 0 ? (
          <p className="px-1 py-2 text-sm text-fg-subtle">{emptyLabel}</p>
        ) : (
          <ul className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
            {options.map((option) => {
              const isSelected = selected.has(option.value);
              return (
                <li key={option.value}>
                  <label
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition ${
                      isSelected
                        ? "border-accent-500/60 bg-accent-500/15 text-accent-100"
                        : "border-white/10 bg-white/[0.03] text-fg-muted hover:border-accent-500/30"
                    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      name={name}
                      value={option.value}
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() => toggle(option.value)}
                      className="size-3.5 accent-[#6366f1]"
                    />
                    {option.label}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}

/* --------------------------------------------------------- attachment field */

export interface FileFieldValue {
  /** A file chosen in this session, not yet uploaded. */
  file: File | null;
  /** Replace the stored attachment (and retire the old one) on the next write. */
  removeExisting: boolean;
}

export const EMPTY_FILE_VALUE: FileFieldValue = { file: null, removeExisting: false };

export function createFileValue(entity: { [key: string]: unknown }, urlKey: string): FileFieldValue {
  return { file: null, removeExisting: !hasLink(entity[urlKey] as string | null | undefined) };
}

interface FileFieldProps {
  name: string;
  label: string;
  /** URL the backend currently serves this attachment from, if any. */
  currentUrl?: string | null;
  value: FileFieldValue;
  onChange: (value: FileFieldValue) => void;
  kind?: "image" | "document";
  error?: string;
  hint?: ReactNode;
  disabled?: boolean;
  accept?: string;
}

const DEFAULT_ACCEPT: Record<NonNullable<FileFieldProps["kind"]>, string> = {
  image: ".jpg,.jpeg,.png,.webp,.gif,.svg",
  document: ".pdf,.jpg,.jpeg,.png,.webp",
};

/**
 * The only place a file is chosen in the whole app.
 *
 * The browser never learns a server path: the field only ever carries the bytes, which are posted
 * to the backend as `multipart/form-data`. The backend validates the type and size, chooses the
 * folder and stored name, replaces the old file when a new one arrives, and hands back the URL.
 * "Remove" is expressed through the same request (`isDelete`), never by editing a path.
 */
export function FileField({
  name,
  label,
  currentUrl,
  value,
  onChange,
  kind = "image",
  error,
  hint,
  disabled = false,
  accept = DEFAULT_ACCEPT[kind],
}: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value.file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.file]);

  const hasStored = hasLink(currentUrl) && !value.removeExisting;
  const displayUrl = previewUrl ?? (hasStored ? currentUrl! : null);

  return (
    <FieldShell
      label={label}
      htmlFor={`${name}-file`}
      error={error}
      hint={hint ?? "Sent to the server as multipart/form-data. The server validates, stores and names the file."}
      required={false}
    >
      <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {kind === "image" ? (
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-ink-850">
              {displayUrl ? (
                <img
                  src={displayUrl}
                  alt=""
                  className="size-full object-contain"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
              ) : (
                <ImageIcon aria-hidden="true" className="size-6 text-fg-subtle" />
              )}
            </div>
          ) : displayUrl ? (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-ink-850 text-accent-300">
              <FileText aria-hidden="true" className="size-7" />
            </div>
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-ink-850 text-fg-subtle">
              <FileText aria-hidden="true" className="size-7" />
            </div>
          )}

          <div className="min-w-[12rem] flex-1 space-y-2">
            <p className="text-sm font-medium break-words text-fg">
              {value.file ? value.file.name : hasStored ? "Stored file" : "No file selected"}
            </p>
            <p className="text-xs text-fg-subtle">
              {value.file
                ? `${(value.file.size / 1024).toFixed(0)} KB · ready to upload`
                : hasStored
                  ? "Leave as-is to keep it, or pick a replacement."
                  : "Pick a file to attach one."}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="btn-outline !px-3 !py-1.5 text-xs"
              >
                {value.file || !hasStored ? (
                  <Upload aria-hidden="true" className="size-3.5" />
                ) : (
                  <RefreshCw aria-hidden="true" className="size-3.5" />
                )}
                {value.file ? "Choose another" : hasStored ? "Replace file" : "Choose file"}
              </button>

              {hasStored ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ file: null, removeExisting: true })}
                  className="btn-outline !px-3 !py-1.5 text-xs !text-rose-200 hover:!border-rose-400/50"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  Remove
                </button>
              ) : null}

              {value.file || value.removeExisting ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(EMPTY_FILE_VALUE)}
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                >
                  <X aria-hidden="true" className="size-3.5" />
                  Undo
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {hasStored && kind === "image" ? (
          <div className="mt-3 border-t border-white/8 pt-3">
            <SmartMedia src={currentUrl} alt="Currently stored file" className="h-24 w-full rounded-lg object-contain" />
          </div>
        ) : null}

        <input
          ref={inputRef}
          id={`${name}-file`}
          name={name}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            // A new file always supersedes the stored one, so removal is implied.
            onChange({ file, removeExisting: false });
            event.target.value = "";
          }}
        />
      </div>
    </FieldShell>
  );
}

/* ------------------------------------------------------------------- misc */

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-white/8 pt-6 first:border-0 first:pt-0">
      <div>
        <h3 className="font-display text-sm font-semibold tracking-wide text-fg">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-relaxed text-fg-subtle">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Inline, non-blocking submission error. The raw API message is never shown. */
export function FormErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.08] px-4 py-3">
      <p className="text-sm font-semibold text-rose-100">The change was not saved</p>
      <p className="mt-0.5 text-sm leading-relaxed text-rose-100/80">{message}</p>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-fg-muted">
      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      {label ?? "Loading…"}
    </span>
  );
}