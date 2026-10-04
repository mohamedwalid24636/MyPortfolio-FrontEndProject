import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError } from "@/lib/apiClient";
import { clearSession, getSession, storeSession, subscribe, type Session } from "@/lib/tokenStore";
import { authService } from "@/services";

/**
 * Who is signed in, as far as this browser is concerned.
 *
 * The backend is the authority: a token only counts as good once a request carrying it has come
 * back 200. Nothing here decides that someone may edit the portfolio — it only decides which pages
 * to show. Every write still fails with 401 without a valid token, whether or not this provider
 * believes the user is signed in.
 */
interface AuthContextValue {
  /** Null when nobody is signed in, or when the stored token has expired. */
  session: Session | null;
  isAuthenticated: boolean;
  /**
   * Exchanges credentials for a token and stores it.
   *
   * Throws when the credentials are refused, so the caller can tell the difference between "wrong
   * password" and "the API is not running" and say something useful about each.
   */
  login: (email: string, password: string) => Promise<void>;
  /** Forgets the token. The server keeps no session to revoke, so this is all that is needed. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read straight from storage on first render so a refresh does not flash the login page for
  // someone who is already signed in.
  const [session, setSession] = useState<Session | null>(() => getSession());

  // The token store outlives React, so it is the one that tells us when a 401 killed the session.
  useEffect(() => subscribe(setSession), []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });

    const expiresAt = Date.parse(response.expiresAtUtc);

    if (!response.token || Number.isNaN(expiresAt)) {
      throw new ApiError("The server returned a session that could not be used.", 0, "/auth/login");
    }

    const next: Session = { token: response.token, expiresAt, email: response.email };

    setSession(next);
    storeSession(next);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, isAuthenticated: session !== null, login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return context;
}
