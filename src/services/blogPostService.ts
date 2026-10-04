import { apiClient } from "@/lib/apiClient";
import { createWriteService } from "@/services/crud";
import type { BlogPostDto, CreateBlogPostDto, UpdateBlogPostDto } from "@/types/api";

const base = createWriteService<BlogPostDto, CreateBlogPostDto, UpdateBlogPostDto>(
  "BlogPosts",
  "form",
);

/**
 * Blog posts own a cover image, so their write contract is `multipart/form-data`. `slug`,
 * `readingTime`, `publishedAt`, `updatedAt` and `coverImageUrl` are all produced by the server and
 * are deliberately absent from the write contract.
 */
export const blogPostService = {
  ...base,

  /**
   * The backend has no "by slug" endpoint, so we resolve a slug locally from a
   * single page of posts. Falls back to a direct id lookup.
   */
  async findBySlug(slug: string, signal?: AbortSignal): Promise<BlogPostDto | null> {
    const posts = await base.listAll({ pageSize: 100 }, signal);
    const match = posts.find((post) => post.slug === slug);
    if (match) return match;

    if (/^\d+$/.test(slug)) {
      try {
        return await base.getById(Number(slug), signal);
      } catch {
        return null;
      }
    }
    return null;
  },

  /** GET /BlogPosts — published posts only, ordered by publish date. */
  async findPublished(signal?: AbortSignal): Promise<BlogPostDto[]> {
    const posts = await base.listAll({ pageSize: 100 }, signal);
    return posts.filter((post) => post.status?.toLowerCase() === "published");
  },

  /** Direct read, exposed so admin forms can reload one row. */
  getById: (id: number, signal?: AbortSignal) => apiClient.get<BlogPostDto>(`/BlogPosts/${id}`, signal),
};