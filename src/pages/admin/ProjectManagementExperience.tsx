import { useState } from "react";
import { Edit3, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { FormSection, FileField, type FileFieldValue } from "@/components/admin/FormFields";
import { useToast } from "@/components/admin/ToastProvider";
import { projectImageService } from "@/services";
import { isAbortError } from "@/lib/apiClient";
import { SmartMedia } from "@/components/ui/SmartMedia";
import type { ProjectDto, ProjectImageDto } from "@/types/api";

interface ProjectManagementExperienceProps {
  project: ProjectDto | null;
  onChanged: () => void;
}

interface ImageDraft {
  caption: string;
  displayOrder: string;
  file: FileFieldValue;
}

const emptyDraft = (): ImageDraft => ({
  caption: "",
  displayOrder: "",
  file: { file: null, removeExisting: false },
});

/**
 * Gallery entries are screenshots or screen recordings, so the picker has to offer both. The API
 * enforces the real ceiling per extension (200 MB for `.mp4`, 10 MB otherwise) and rejects anything
 * else with a message naming the limit.
 */
const GALLERY_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.svg,.mp4,.webm,.ogv,.mov";

/** Project-only relations editor. The project must exist before gallery records can be persisted. */
export function ProjectManagementExperience({ project, onChanged }: ProjectManagementExperienceProps) {
  const toast = useToast();
  const [images, setImages] = useState<ProjectImageDto[]>(() => project?.images ?? []);
  const [draft, setDraft] = useState<ImageDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const startEdit = (image: ProjectImageDto) => {
    setEditingId(image.id);
    setDraft({
      caption: image.caption ?? "",
      displayOrder: image.displayOrder ?? "",
      file: { file: null, removeExisting: false },
    });
  };

  const resetDraft = () => {
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const saveImage = async () => {
    if (!project) return;
    if (!editingId && !draft.file.file) {
      toast.error("Media required", "Choose a screenshot or video before adding it to the gallery.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        projectId: project.id,
        caption: draft.caption.trim(),
        displayOrder: draft.displayOrder.trim(),
        image: draft.file.file,
        isDelete: draft.file.removeExisting,
      };

      if (editingId) {
        await projectImageService.update(editingId, payload);
        toast.success("Project image updated");
      } else {
        const created = await projectImageService.create(payload);
        setImages((current) => [...current, created]);
        toast.success("Project image added");
      }

      if (editingId) {
        setImages((current) =>
          current.map((image) =>
            image.id === editingId
              ? { ...image, caption: payload.caption, displayOrder: payload.displayOrder }
              : image,
          ),
        );
      }
      resetDraft();
      onChanged();
    } catch (cause) {
      if (!isAbortError(cause)) {
        toast.error("Project image could not be saved", cause instanceof Error ? cause.message : undefined);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const deleteImage = async (image: ProjectImageDto) => {
    setDeletingId(image.id);
    try {
      await projectImageService.remove(image.id);
      setImages((current) => current.filter((item) => item.id !== image.id));
      if (editingId === image.id) resetDraft();
      toast.success("Project image deleted");
      onChanged();
    } catch (cause) {
      if (!isAbortError(cause)) {
        toast.error("Project image could not be deleted", cause instanceof Error ? cause.message : undefined);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5 border-t border-white/8 pt-6">
      <FormSection
        title="Project gallery"
        description={project ? "Upload, preview, reorder with display order, replace, or remove gallery screenshots and videos." : "Save the project first, then add its gallery media here."}
      >
        {project ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images
                .slice()
                .sort((left, right) => String(left.displayOrder).localeCompare(String(right.displayOrder), undefined, { numeric: true }))
                .map((image) => (
                  <article key={image.id} className="group overflow-hidden rounded-xl border border-white/10 bg-ink-900/60">
                    <div className="aspect-[4/3] overflow-hidden bg-ink-850">
                      <SmartMedia src={image.imageUrl} alt={image.caption || "Project gallery"} className="size-full object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                    <div className="space-y-2 p-3">
                      <p className="truncate text-xs font-medium text-fg">{image.caption || "Untitled item"}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[0.7rem] text-fg-subtle">Order {image.displayOrder || "—"}</span>
                        <div className="flex gap-1">
                          <button type="button" className="btn-icon !size-7" onClick={() => startEdit(image)} aria-label={`Edit ${image.caption || "image"}`}>
                            <Edit3 aria-hidden="true" className="size-3.5" />
                          </button>
                          <button type="button" className="btn-icon !size-7 !text-rose-200" onClick={() => deleteImage(image)} disabled={deletingId === image.id} aria-label={`Delete ${image.caption || "image"}`}>
                            {deletingId === image.id ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : <Trash2 aria-hidden="true" className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
            </div>

            <div className="mt-5 rounded-xl border border-white/8 bg-ink-900/40 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-fg">{editingId ? "Edit gallery media" : "Add gallery media"}</p>
                  <p className="mt-1 text-xs text-fg-subtle">The file is previewed locally before the multipart request is sent.</p>
                </div>
                {editingId ? <button type="button" className="btn-ghost !px-2" onClick={resetDraft}><X aria-hidden="true" className="size-4" /> Cancel</button> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-shell">
                  <span className="field-label">Caption</span>
                  <input className="field-input" value={draft.caption} onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))} placeholder="e.g. Dashboard overview" />
                </label>
                <label className="field-shell">
                  <span className="field-label">Display order</span>
                  <input className="field-input" value={draft.displayOrder} onChange={(event) => setDraft((current) => ({ ...current, displayOrder: event.target.value }))} placeholder="1" inputMode="numeric" />
                </label>
              </div>
              <div className="mt-4">
                <FileField
                  name="project-gallery-image"
                  label={editingId ? "Replace media" : "Media"}
                  hint="Screenshot or screen recording. Video is capped at 200 MB by the API."
                  accept={GALLERY_ACCEPT}
                  value={draft.file}
                  currentUrl={editingId ? images.find((image) => image.id === editingId)?.imageUrl : undefined}
                  onChange={(file) => setDraft((current) => ({ ...current, file }))}
                />
              </div>
              <button type="button" className="btn-primary mt-4" onClick={saveImage} disabled={isSaving}>
                {isSaving ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : editingId ? <Save aria-hidden="true" className="size-4" /> : <ImagePlus aria-hidden="true" className="size-4" />}
                {isSaving ? "Saving…" : editingId ? "Save media" : "Add media"}
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-white/12 p-5 text-sm text-fg-muted">
            <Plus aria-hidden="true" className="mb-2 size-5 text-accent-300" />
            Create the project to unlock its image gallery.
          </div>
        )}
      </FormSection>
    </div>
  );
}
