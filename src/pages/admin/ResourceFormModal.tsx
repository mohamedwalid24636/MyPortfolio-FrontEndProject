import { useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { ApiError, isAbortError } from "@/lib/apiClient";
import {
  FormErrorBanner,
  FormSection,
  FileField,
  MultiSelectField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/FormFields";
import { Modal } from "@/components/admin/Modal";
import { ProjectManagementExperience } from "@/pages/admin/ProjectManagementExperience";
import {
  buildInitialFiles,
  buildInitialValues,
  buildPayload,
  currentFileUrl,
  type FieldSpec,
  type FormFiles,
  type FormValues,
  type Option,
  type ResourceSpec,
} from "@/pages/admin/adminConfig";

interface ResourceFormModalProps {
  spec: ResourceSpec<never>;
  /** null creates a new record; an object edits that row. */
  dto: unknown;
  relations: Record<string, Option[]>;
  onClose: () => void;
  onSaved: (message: string) => void;
  onChanged?: () => void;
}

/**
 * The single editor for every resource.
 *
 * It renders the fields a spec declares, converts the state into the payload that spec's controller
 * binds, and reports the backend's per-field rejections back onto the inputs that caused them.
 */
export function ResourceFormModal({ spec, dto, relations, onClose, onSaved, onChanged }: ResourceFormModalProps) {
  const isEdit = dto !== null;
  const entityId = isEdit ? (dto as { id: number }).id : null;

  const [values, setValues] = useState<FormValues>(() => buildInitialValues(spec, dto));
  const [files, setFiles] = useState<FormFiles>(() => buildInitialFiles(spec, dto));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const setValue = (name: string, value: unknown) => {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const visibleFields = useMemo(
    () => spec.fields.filter((field) => (field.visibleWhen ? field.visibleWhen(values) : true)),
    [spec.fields, values],
  );

  const handleSubmit = async () => {
    const validationErrors: Record<string, string> = {};
    for (const field of spec.fields) {
      if (!field.required || field.kind === "file") continue;

      const value = values[field.name];
      const isEmpty = Array.isArray(value)
        ? value.length === 0
        : value === undefined || value === null || String(value).trim().length === 0;

      if (isEmpty) validationErrors[field.name] = `${field.label} is required.`;
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFormError("Some fields need attention before this can be saved.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setFieldErrors({});

    const payload = buildPayload(spec, values, files);

    try {
      if (entityId === null) {
        await spec.service.create(payload);
        onSaved(`${spec.singular} created`);
      } else {
        await spec.service.update(entityId, payload);
        onSaved(`${spec.singular} updated`);
      }
    } catch (error) {
      if (isAbortError(error)) return;

      if (error instanceof ApiError) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(error.fieldErrors)) {
          if (messages[0]) mapped[key] = messages[0];
        }
        setFieldErrors(mapped);
        setFormError(
          Object.keys(mapped).length > 0
            ? "Some fields need attention before this can be saved."
            : error.message,
        );
      } else {
        setFormError("Something went wrong while saving. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      busy={isSaving}
      title={isEdit ? `Edit ${spec.singular.toLowerCase()}` : `New ${spec.singular.toLowerCase()}`}
      description={
        isEdit
          ? "Changes are written straight to the database."
          : "Saved immediately — the record appears on the public site as soon as the list refreshes."
      }
      footer={
        <>
          <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <FormErrorBanner message={formError} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {visibleFields.map((field) => (
            <div key={field.name} className={field.wide ? "sm:col-span-2" : undefined}>
              <FieldControl
                field={field}
                value={values[field.name]}
                file={files[field.name]}
                currentUrl={field.kind === "file" ? currentFileUrl(dto, field) : undefined}
                options={resolveOptions(field, relations, values[field.name])}
                error={fieldErrors[field.name]}
                onChange={(next) => setValue(field.name, next)}
                onFileChange={(next) => {
                  setFiles((current) => ({ ...current, [field.name]: next }));
                }}
              />
            </div>
          ))}
        </div>

        {spec.key === "projects" ? (
          <ProjectManagementExperience
            project={dto as import("@/types/api").ProjectDto | null}
            onChanged={onChanged ?? (() => undefined)}
          />
        ) : null}

        <FormSection title="Transport" description="How this record is persisted.">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
            <span className="chip">{isEdit ? `PUT /${spec.endpoint}/{id}` : `POST /${spec.endpoint}`}</span>
            <span className="chip">
              {spec.fields.some((field) => field.kind === "file") ? "multipart/form-data" : "application/json"}
            </span>
          </div>
        </FormSection>
      </div>
    </Modal>
  );
}

/**
 * Static options, or a loaded relation list.
 *
 * The row's current value is kept selectable even when it is not in the curated list — status and
 * platform fields are free text in the database, so a value stored earlier must not silently
 * disappear when editing.
 */
function resolveOptions(field: FieldSpec, relations: Record<string, Option[]>, currentValue: unknown): Option[] {
  if (field.kind !== "select") return [];

  const base = field.relation ? (relations[field.relation] ?? []) : (field.options ?? []);
  const options = base.map((option) => ({ value: String(option.value), label: option.label }));

  const current = asString(currentValue);
  if (current && !options.some((option) => option.value === current)) {
    options.unshift({ value: current, label: `${current} (stored value)` });
  }

  return options;
}

interface FieldControlProps {
  field: FieldSpec;
  value: unknown;
  file: FormFiles[string] | undefined;
  currentUrl: string | undefined;
  options: Option[];
  error: string | undefined;
  onChange: (value: unknown) => void;
  onFileChange: (value: NonNullable<FormFiles[string]>) => void;
}

function FieldControl({ field, value, file, currentUrl, options, error, onChange, onFileChange }: FieldControlProps) {
  switch (field.kind) {
    case "toggle":
      return (
        <ToggleField
          name={field.name}
          label={field.label}
          hint={field.hint}
          checked={Boolean(value)}
          onChange={onChange}
        />
      );

    case "multiselect":
      return (
        <MultiSelectField
          name={field.name}
          label={field.label}
          hint={field.hint}
          values={Array.isArray(value) ? (value as number[]) : []}
          options={options.map((option) => ({ value: Number(option.value), label: option.label }))}
          emptyLabel={field.emptyLabel}
          error={error}
          onChange={onChange}
        />
      );

    case "file":
      return (
        <FileField
          name={field.name}
          label={field.label}
          hint={field.hint}
          accept={field.accept}
          kind={field.fileKind}
          currentUrl={currentUrl}
          value={file ?? { file: null, removeExisting: false }}
          error={error}
          onChange={onFileChange}
        />
      );

    case "textarea":
      return (
        <TextAreaField
          name={field.name}
          label={field.label}
          hint={field.hint}
          rows={field.rows ?? 4}
          required={field.required}
          value={asString(value)}
          error={error}
          onChange={onChange}
        />
      );

    case "select":
      return (
        <SelectField
          name={field.name}
          label={field.label}
          hint={field.hint}
          required={field.required}
          value={asString(value)}
          options={options}
          error={error}
          placeholder={field.required ? undefined : "Select…"}
          onChange={onChange}
        />
      );

    case "number":
      return (
        <TextField
          name={field.name}
          label={field.label}
          hint={field.hint}
          type="number"
          required={field.required}
          min={field.min}
          max={field.max}
          value={asString(value)}
          error={error}
          onChange={onChange}
        />
      );

    default:
      return (
        <TextField
          name={field.name}
          label={field.label}
          hint={field.hint}
          placeholder={field.placeholder}
          required={field.required}
          slugFrom={field.slugFrom}
          type={field.kind === "email" ? "email" : field.kind === "url" ? "url" : field.kind === "date" ? "date" : "text"}
          value={asString(value)}
          error={error}
          onChange={onChange}
        />
      );
  }
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}