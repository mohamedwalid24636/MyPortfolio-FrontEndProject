import { ApiError } from "@/lib/apiClient";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { useAsync } from "@/hooks/useAsync";
import { useDataVersion } from "@/context/DataVersionContext";
import { blogPostService, projectService } from "@/services";
import type { BlogPostDto, ProjectDto } from "@/types/api";

/** Featured projects for the home page. Resolves to `[]` when none are flagged. */
export function useFeaturedProjects() {
  const { version } = useDataVersion();
  return useAsync<ProjectDto[]>((signal) => projectService.featured(signal), [version]);
}

/**
 * Full project collection.
 *
 * The backend exposes search + pagination but no category/technology filters, so the
 * projects page fetches the whole catalogue once (capped at the API maximum)
 * and filters/paginates locally. That keeps filter counts honest and the UI
 * instant, which matters far more here than round-tripping per filter change.
 */
export function useAllProjects() {
  const { version } = useDataVersion();
  return useAsync<ProjectDto[]>(async (signal) => {
    return (await projectService.listAll({ pageSize: MAX_PAGE_SIZE }, signal)) ?? [];
  }, [version]);
}

/** A single project. Resolves to `null` for a missing id or a 404 response. */
export function useProject(id: number | null) {
  const { version } = useDataVersion();
  return useAsync<ProjectDto | null>(async (signal) => {
    if (id === null) return null;

    try {
      return await projectService.getById(id, signal);
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) return null;
      throw error;
    }
  }, [id, version]);
}

export function useAllBlogPosts() {
  const { version } = useDataVersion();
  return useAsync<BlogPostDto[]>((signal) => blogPostService.findPublished(signal), [version]);
}

/** A single post resolved by slug (falls back to numeric id). `null` when absent. */
export function useBlogPost(slug: string | null) {
  const { version } = useDataVersion();
  return useAsync<BlogPostDto | null>(async (signal) => {
    if (!slug) return null;

    try {
      const posts = await blogPostService.findPublished(signal);
      const match = posts.find((post) => post.slug === slug || String(post.id) === slug);
      if (match) return match;

      if (/^\d+$/.test(slug)) {
        const post = await blogPostService.getById(Number(slug), signal);
        return post.status?.toLowerCase() === "published" ? post : null;
      }

      return null;
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) return null;
      throw error;
    }
  }, [slug, version]);
}