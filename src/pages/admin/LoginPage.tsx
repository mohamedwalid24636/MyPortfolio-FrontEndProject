import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, KeyRound, Loader2, LogIn, Server, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ApiError } from "@/lib/apiClient";
import { Reveal } from "@/components/ui/Reveal";

interface Form {
  email: string;
  password: string;
}

type FieldErrors = Partial<Record<keyof Form, string>>;
type SubmitState = "idle" | "submitting" | "error";

const EMPTY_FORM: Form = { email: "", password: "" };

/**
 * Mirrors what the server enforces, so an obviously empty field is caught before a round trip. The
 * server remains the authority — this only saves a pointless request.
 */
function validate(form: Form): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.email.trim()) {
    errors.email = "Enter the email address for the admin account.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "That does not look like an email address.";
  }

  if (!form.password) {
    errors.password = "Enter the password.";
  }

  return errors;
}

/**
 * The way into the admin panel.
 *
 * It only ever asks the backend who you are: on success the returned token is stored and every later
 * request carries it, and on failure nothing is stored. There is no way to reach the panel from here
 * that the server would not also have to agree to.
 */
export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");

  usePageMeta("Admin sign in", "Sign in to manage the portfolio content.");

  // Someone who is already signed in has no business here.
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  function updateField(field: keyof Form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitState("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitState("submitting");
    setSubmitError("");

    try {
      await login(form.email.trim(), form.password);

      // Straight back to whatever was asked for before the guard bounced us here.
      const destination = searchParams.get("from");
      navigate(destination && destination.startsWith("/admin") ? destination : "/admin", { replace: true });
    } catch (error) {
      setSubmitState("error");
      setSubmitError(
        error instanceof ApiError && error.isUnauthorized
          ? "That email and password combination was not accepted."
          : error instanceof Error
            ? error.message
            : "Sign in failed. Please try again.",
      );
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink-950 text-fg">
      <div className="container-page flex flex-1 items-center justify-center py-16">
        <Reveal className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-300">
              <Server aria-hidden="true" className="size-6" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Content manager</h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-fg-muted">
              Sign in to edit the portfolio. Every change is written straight to the database.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="card mt-8 space-y-5 p-6 sm:p-8">
            <div>
              <label htmlFor="login-email" className="field-label">
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                autoFocus
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className="field"
                placeholder="admin@example.com"
              />
              {errors.email ? (
                <p id="login-email-error" className="mt-1.5 text-xs text-rose-300">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="login-password" className="field-label">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                className="field"
                placeholder="••••••••"
              />
              {errors.password ? (
                <p id="login-password-error" className="mt-1.5 text-xs text-rose-300">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div aria-live="polite">
              {submitState === "error" ? (
                <div className="rounded-xl border border-rose-400/25 bg-rose-500/[0.08] p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-rose-100">
                    <XCircle aria-hidden="true" className="size-4 shrink-0" />
                    Sign in failed
                  </p>
                  <p className="mt-0.5 text-sm text-rose-100/80">{submitError}</p>
                </div>
              ) : null}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitState === "submitting"}>
              {submitState === "submitting" ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn aria-hidden="true" className="size-4" />
                  Sign in
                </>
              )}
            </button>

            <p className="flex items-start gap-2 border-t border-white/8 pt-5 text-xs leading-relaxed text-fg-subtle">
              <KeyRound aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              The account is created by the API on first run. There is no sign-up — see the seeded
              credentials in the server configuration.
            </p>
          </form>

          <p className="mt-6 text-center text-sm">
            <Link to="/" className="inline-flex items-center gap-1.5 text-fg-muted transition hover:text-accent-200">
              Back to the portfolio
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  );
}
