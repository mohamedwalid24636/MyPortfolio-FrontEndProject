import type { QueryParameters } from "@/types/api";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { clearSession, getSession } from "@/lib/tokenStore";

/**
 * The single place the backend is addressed.
 *
 * `VITE_API_BASE_URL` is the only knob; no component builds a URL by hand. It defaults to "/api",
 * which the Vite dev/preview proxy forwards to the ASP.NET Core API, so development needs no CORS
 * and no self-signed-certificate handling in the browser.
 */
const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const BASE_URL = RAW_BASE.replace(/\/+$/, "");

/** Field name (camelCase) -> messages, produced from ASP.NET's ValidationProblemDetails. */
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  /** Per-field messages, present on 400 responses. Keys are camelCased. */
  readonly fieldErrors: FieldErrors;

  constructor(message: string, status: number, url: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.fieldErrors = fieldErrors;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Network / backend-down style failures. */
  get isConnectivity(): boolean {
    return this.status === 0;
  }

  get isValidation(): boolean {
    return this.status === 400 || this.status === 415 || this.status === 422;
  }

  /** The server refused the request for authentication reasons — a 401 with no token accepted. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** First message for one field, if the backend rejected it. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors[field]?.[0];
  }
}

interface RequestOptions {
  signal?: AbortSignal;
  body?: unknown;
}

/** A value a write endpoint accepts as a `multipart/form-data` field. */
type MultipartValue =
  | string
  | number
  | boolean
  | Blob
  | null
  | undefined
  | readonly (string | number)[];

/**
 * Values a write endpoint accepts as `multipart/form-data`. The file itself travels under its
 * field name; everything else is appended as a plain form field.
 */
export type MultipartFields = Record<string, MultipartValue>;

/** JSON bodies that may carry an upload slot. Files are dropped — see {@link isMultipartResource}. */
export type JsonBody = Record<string, unknown>;

function buildFormData(body: MultipartFields): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      // Repeated fields are how ASP.NET binds a List<T> from a form.
      for (const item of value) form.append(key, String(item));
    } else if (value instanceof Blob) {
      form.append(key, value, (value as File).name);
    } else if (typeof value === "boolean") {
      form.append(key, value ? "true" : "false");
    } else {
      form.append(key, String(value));
    }
  }

  return form;
}

/** "FirstName" -> "firstName", so backend field keys line up with our DTO property names. */
function toCamelCase(key: string): string {
  return key.charAt(0).toLowerCase() + key.slice(1);
}

function readFieldErrors(payload: unknown): FieldErrors {
  if (!payload || typeof payload !== "object") return {};

  const errors = (payload as { errors?: unknown }).errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return {};

  const result: FieldErrors = {};

  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    const messages = Array.isArray(value) ? value.map(String) : [String(value)];
    const camel = toCamelCase(key);
    result[camel] = [...(result[camel] ?? []), ...messages];
  }

  return result;
}

/**
 * Turns a failure response into something a person can act on.
 *
 * The backend answers with RFC 7807 `application/problem+json`. A validation problem carries the
 * useful detail in `errors`; anything else is reduced to a short, non-technical sentence so raw
 * server text (stack traces, SQL, framework messages) never reaches the UI.
 */
function toUserMessage(status: number, payload: unknown, fallbackDetail?: string): string {
  const fieldErrors = readFieldErrors(payload);
  const firstFieldMessage = Object.values(fieldErrors)[0]?.[0];
  if (firstFieldMessage) return firstFieldMessage;

  const detail =
    payload && typeof payload === "object" && typeof (payload as { detail?: unknown }).detail === "string"
      ? ((payload as { detail: string }).detail.trim())
      : "";
  const title =
    payload && typeof payload === "object" && typeof (payload as { title?: unknown }).title === "string"
      ? ((payload as { title: string }).title.trim())
      : "";

  switch (status) {
    case 0:
      return "Unable to reach the server. Check that the API is running and try again.";
    case 400:
      return detail || title || "Some of the values sent were rejected. Please review the form.";
    case 401:
    case 403:
      return "You are not allowed to perform this action.";
    case 404:
      return "That record no longer exists. It may already have been deleted.";
    case 405:
      return "That action is not supported by the server.";
    case 409:
      return detail || "That change conflicts with the current data. Refresh and try again.";
    case 413:
      return fallbackDetail || "That file is larger than the server accepts.";
    case 415:
      return "The server rejected the format of the request. This usually means an unsupported file type.";
    case 422:
      return detail || title || "Some of the values sent could not be processed.";
    case 429:
      return "Too many requests. Wait a moment and try again.";
    default:
      if (status >= 500) return "The server ran into a problem. Please try again in a moment.";
      return fallbackDetail || "The request could not be completed.";
  }
}

async function readBody(response: Response): Promise<{ payload: unknown; text: string }> {
  let text = "";
  try {
    text = await response.text();
  } catch {
    return { payload: null, text: "" };
  }

  if (!text) return { payload: null, text: "" };

  try {
    return { payload: JSON.parse(text), text };
  } catch {
    return { payload: null, text };
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const isMultipart = options.body instanceof FormData;

  // Multipart bodies must not carry a Content-Type: the runtime has to add the boundary.
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.body !== undefined && !isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  // Read per request rather than captured once, so logging in or out takes effect immediately.
  // getSession() already drops an expired token, so a dead session never reaches the API.
  const session = getSession();
  if (session) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: options.signal,
      headers,
      ...(options.body === undefined
        ? {}
        : isMultipart
          ? { body: options.body as FormData }
          : { body: JSON.stringify(options.body) }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(toUserMessage(0, null), 0, url);
  }

  if (!response.ok) {
    const { payload } = await readBody(response);

    // The server refused the token: expired, revoked, or signed with a key it no longer trusts.
    // Dropping it here is what turns a dead session into a redirect to /login. Guarded by `session`
    // so a rejected login attempt — which also answers 401 — is not mistaken for an expired one.
    if (response.status === 401 && session) {
      clearSession();
    }

    // 413 is raised by the server before the attachment service runs, so the size rule it quotes
    // is the only useful detail available.
    const hint = response.status === 413 ? "That file is larger than the server accepts." : undefined;
    throw new ApiError(
      toUserMessage(response.status, payload, hint),
      response.status,
      url,
      readFieldErrors(payload),
    );
  }

  if (response.status === 204) return undefined as T;

  const { payload, text } = await readBody(response);
  if (!text) return undefined as T;
  if (payload === null) {
    throw new ApiError("The server returned a response that could not be read.", response.status, url);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, { signal }),
  post: <T>(path: string, body: unknown, signal?: AbortSignal) => request<T>("POST", path, { body, signal }),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>("PUT", path, { body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>("PATCH", path, { body, signal }),
  delete: <T>(path: string, signal?: AbortSignal) => request<T>("DELETE", path, { signal }),
  /** POST as multipart/form-data — required by every endpoint that accepts an upload. */
  postForm: <T>(path: string, fields: MultipartFields, signal?: AbortSignal) =>
    request<T>("POST", path, { body: buildFormData(fields), signal }),
  /** PUT as multipart/form-data — required by every endpoint that accepts an upload. */
  putForm: <T>(path: string, fields: MultipartFields, signal?: AbortSignal) =>
    request<T>("PUT", path, { body: buildFormData(fields), signal }),
};

export function buildQuery(params?: QueryParameters): string {
  if (!params) return "";

  const search = new URLSearchParams();

  if (params.search?.trim()) {
    search.set("search", params.search.trim());
  }
  if (params.pageIndex != null) {
    search.set("pageIndex", String(params.pageIndex));
  }
  if (params.pageSize != null) {
    search.set("pageSize", String(Math.min(Math.max(params.pageSize, 1), MAX_PAGE_SIZE)));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

/** True when the browser aborted the request, so callers can ignore it instead of showing an error. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}