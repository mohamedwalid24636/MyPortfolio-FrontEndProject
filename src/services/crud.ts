import { apiClient, buildQuery, type MultipartFields } from "@/lib/apiClient";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import type { PaginationResult, QueryParameters } from "@/types/api";

/**
 * Read access to a backend resource. Every list endpoint is paginated by the API, so `list` always
 * receives an envelope rather than a bare array.
 */
export interface ReadService<TDto> {
  /** GET /{resource} — always paginated by the backend. */
  list(params?: QueryParameters, signal?: AbortSignal): Promise<PaginationResult<TDto>>;
  /** GET /{resource} across every backend page. */
  listAll(params?: QueryParameters, signal?: AbortSignal): Promise<TDto[]>;
  /** GET /{resource}/{id} */
  getById(id: number, signal?: AbortSignal): Promise<TDto>;
}

/** How a resource's write contract is bound by the backend. */
export type WriteTransport =
  /** `[FromBody]` — plain JSON. */
  | "json"
  /** `[FromForm]` — multipart/form-data, required whenever the entity owns an upload. */
  | "form";

export interface WriteService<TDto, TCreate, TUpdate = TCreate> extends ReadService<TDto> {
  /** POST /{resource} — returns 201 with the created entity. */
  create(payload: TCreate, signal?: AbortSignal): Promise<TDto>;
  /** PUT /{resource}/{id} — returns 204. */
  update(id: number, payload: TUpdate, signal?: AbortSignal): Promise<void>;
  /** DELETE /{resource}/{id} — returns 204. */
  remove(id: number, signal?: AbortSignal): Promise<void>;
}

/** Builds a read-only service for a backend resource ("Projects", "Skills", ...). */
export function createReadService<TDto>(resource: string): ReadService<TDto> {
  return {
    list: (params, signal) =>
      apiClient.get<PaginationResult<TDto>>(`/${resource}${buildQuery(params)}`, signal),
    listAll: async (params, signal) => {
      const firstPage = await apiClient.get<PaginationResult<TDto>>(
        `/${resource}${buildQuery({ ...params, pageIndex: 1, pageSize: MAX_PAGE_SIZE })}`,
        signal,
      );

      // `data` is nullable in the backend contract, so an empty page arrives as null rather than [].
      const firstBatch = firstPage?.data ?? [];
      if ((firstPage?.totalPages ?? 0) <= 1) return firstBatch;

      const remainingPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
          apiClient.get<PaginationResult<TDto>>(
            `/${resource}${buildQuery({ ...params, pageIndex: index + 2, pageSize: MAX_PAGE_SIZE })}`,
            signal,
          ),
        ),
      );

      return [firstPage, ...remainingPages].flatMap((page) => page?.data ?? []);
    },
    getById: (id, signal) => apiClient.get<TDto>(`/${resource}/${id}`, signal),
  };
}

/**
 * Builds a full CRUD service for a backend resource.
 *
 * `transport` mirrors the controller's binding: `"form"` sends `multipart/form-data` so a picked
 * file travels to the backend, which owns validation, storage, replacement and deletion. `"json"`
 * sends a JSON body and is only correct for resources whose write DTOs hold no `IFormFile`
 * (Types, Tags, Categories, ContactMessages).
 */
export function createWriteService<TDto, TCreate, TUpdate = TCreate>(
  resource: string,
  transport: WriteTransport = "form",
): WriteService<TDto, TCreate, TUpdate> {
  const read = createReadService<TDto>(resource);
  const isForm = transport === "form";

  return {
    ...read,
    create: (payload, signal) =>
      isForm
        ? apiClient.postForm<TDto>(`/${resource}`, payload as MultipartFields, signal)
        : apiClient.post<TDto>(`/${resource}`, payload, signal),
    update: (id, payload, signal) =>
      isForm
        ? apiClient.putForm<void>(`/${resource}/${id}`, payload as MultipartFields, signal)
        : apiClient.put<void>(`/${resource}/${id}`, payload, signal),
    remove: (id, signal) => apiClient.delete<void>(`/${resource}/${id}`, signal),
  };
}

/**
 * Drops `undefined`/`null` entries before a JSON write so an omitted optional field reaches the
 * API as absent rather than as an explicit null, which some validators treat as "provided but empty".
 */
export function stripEmpty<T extends Record<string, unknown>>(payload: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) result[key] = value;
  }
  return result as T;
}