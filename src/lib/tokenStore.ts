/**
 * Where the admin token lives between requests.
 *
 * This is a plain module rather than React state because `apiClient` needs the token synchronously
 * while a request is being built, and a hook cannot be called from there. Everything that reads it
 * goes through {@link getSession}, so there is exactly one answer to "is this token still good?".
 *
 * On storage: a token in `localStorage` is readable by any script that manages to run on the page,
 * so the one thing that must never happen is putting it somewhere the UI can render it or a URL can
 * carry it. It is only ever sent in an `Authorization` header. An httpOnly cookie plus refresh
 * tokens would close the XSS gap properly, at the cost of CSRF handling — see the notes in the
 * handover docs.
 */

export interface Session {
  token: string;
  /** Epoch milliseconds, taken from the server so the client never guesses the lifetime. */
  expiresAt: number;
  email: string;
}

const STORAGE_KEY = "portofolio.admin.session";

type Listener = (session: Session | null) => void;

const listeners = new Set<Listener>();

/**
 * `window.localStorage` throws outright when storage is blocked (private windows, strict cookie
 * policies), so the property access itself is guarded rather than assumed.
 */
function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<Session>;

  return (
    typeof candidate.token === "string" &&
    candidate.token.length > 0 &&
    typeof candidate.expiresAt === "number" &&
    typeof candidate.email === "string"
  );
}

/**
 * The current session, or `null` when there is none.
 *
 * An expired entry is treated as no session and deleted on the spot, so a stale token is never sent
 * and never flashes a signed-in header before the first request fails.
 */
export function getSession(): Session | null {
  const store = storage();
  if (!store) return null;

  let raw: string | null;

  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return null;
  }

  if (!raw) return null;

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    // Anything unreadable is discarded rather than guessed at.
    clearSession();
    return null;
  }

  if (!isSession(parsed) || parsed.expiresAt <= Date.now()) {
    clearSession();
    return null;
  }

  return parsed;
}

/** Stores a freshly issued session and tells every listener about it. */
export function storeSession(session: Session): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // A session that cannot be persisted still works for this tab, so this is not fatal.
  }

  listeners.forEach((listener) => listener(session));
}

/** Forgets the session. Safe to call when there was nothing stored. */
export function clearSession(): void {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: there is no session left either way.
  }

  listeners.forEach((listener) => listener(null));
}

/**
 * Observes session changes.
 *
 * `apiClient` calls {@link clearSession} when the server rejects a token, and this is how that turns
 * into the UI signing the user out instead of the panel quietly filling up with errors.
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
