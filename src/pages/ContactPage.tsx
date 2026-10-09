import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSiteData } from "@/context/SiteDataContext";
import { contactService } from "@/services";
import type { CreateContactMessageDto } from "@/types/api";

type FieldErrors = Partial<Record<keyof CreateContactMessageDto, string>>;
type SubmitState = "idle" | "submitting" | "success" | "error";

const EMPTY_FORM: CreateContactMessageDto = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(form: CreateContactMessageDto): FieldErrors {
  const errors: FieldErrors = {};

  if (form.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Please enter a valid email address.";
  if (form.subject.trim().length < 3) errors.subject = "Please add a short subject.";
  if (form.message.trim().length < 10) errors.message = "Please write at least 10 characters.";

  return errors;
}

export default function ContactPage() {
  const { data } = useSiteData();
  const profile = data.profile;

  usePageMeta(
    profile ? `Contact | ${profile.fullName}` : "Contact",
    "Get in touch through the portfolio contact form.",
  );

  const [form, setForm] = useState<CreateContactMessageDto>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  /*
   * Contact details come only from the API. Nothing is duplicated in the frontend, and a value the
   * database does not hold is simply left out rather than replaced by a stale hardcoded copy.
   */
  const email = profile?.email.trim() ?? "";
  const phone = profile?.phone.trim() ?? "";
  const location = profile?.location.trim() ?? "";
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  const updateField = (field: keyof CreateContactMessageDto, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (submitState !== "idle") setSubmitState("idle");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitState("submitting");
    setSubmitError(null);

    try {
      await contactService.create({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setSubmitState("success");
      setForm(EMPTY_FORM);
    } catch (error) {
      setSubmitState("error");
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not send your message. Please try again or email me directly.",
      );
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            Let’s <span className="heading-gradient">talk</span>
          </>
        }
        description="Questions about a role, a project or an architecture? Send a message and I will reply as soon as I can."
      />

      <section className="section pt-10 sm:pt-14">
        <div className="container-page grid gap-8 sm:gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
          <Reveal className="card min-w-0 p-5 sm:p-8">
            <h2 className="font-display text-xl font-bold">Send a message</h2>
            <p className="mt-2 text-sm text-fg-muted">
              All fields are required. Your message is stored securely and never shared.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="field-label">
                    Full name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "contact-name-error" : undefined}
                    className="field"
                    placeholder="Jane Doe"
                  />
                  {errors.name ? (
                    <p id="contact-name-error" className="mt-1.5 text-xs text-rose-300">
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="contact-email" className="field-label">
                    Email address
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "contact-email-error" : undefined}
                    className="field"
                    placeholder="jane@company.com"
                  />
                  {errors.email ? (
                    <p id="contact-email-error" className="mt-1.5 text-xs text-rose-300">
                      {errors.email}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="field-label">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  value={form.subject}
                  onChange={(event) => updateField("subject", event.target.value)}
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                  className="field"
                  placeholder="Backend role — your company"
                />
                {errors.subject ? (
                  <p id="contact-subject-error" className="mt-1.5 text-xs text-rose-300">
                    {errors.subject}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="contact-message" className="field-label">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "contact-message-error" : undefined}
                  className="field resize-y"
                  placeholder="Tell me about the role, the product or the problem you would like help with…"
                />
                {errors.message ? (
                  <p id="contact-message-error" className="mt-1.5 text-xs text-rose-300">
                    {errors.message}
                  </p>
                ) : null}
              </div>

              <div aria-live="polite">
                {submitState === "success" ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] p-4">
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-100">Message sent — thank you.</p>
                      <p className="mt-0.5 text-sm text-emerald-100/80">
                        I usually reply within a day. You can also email me directly.
                      </p>
                    </div>
                  </div>
                ) : null}

                {submitState === "error" ? (
                  <div className="rounded-xl border border-rose-400/25 bg-rose-500/[0.08] p-4">
                    <p className="text-sm font-semibold text-rose-100">Message could not be sent</p>
                    <p className="mt-0.5 text-sm text-rose-100/80">{submitError}</p>
                  </div>
                ) : null}
              </div>

              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitState === "submitting"}>
                {submitState === "submitting" ? (
                  <>
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send aria-hidden="true" className="size-4" />
                    Send message
                  </>
                )}
              </button>
            </form>
          </Reveal>

          <div className="min-w-0 space-y-6">
            <Reveal delay={0.06} className="card p-5 sm:p-6">
              <h2 className="font-display text-sm uppercase tracking-[0.16em] text-fg-subtle">Direct contact</h2>
              <ul className="mt-5 space-y-4">
                {email ? (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      className="group flex items-center gap-4 rounded-xl border border-white/10 px-4 py-3.5 transition hover:border-accent-500/40"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-300">
                        <Mail aria-hidden="true" className="size-4.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-[0.14em] text-fg-subtle">Email</span>
                        <span className="block truncate text-sm font-medium text-fg group-hover:text-accent-200">
                          {email}
                        </span>
                      </span>
                    </a>
                  </li>
                ) : null}

                {phone && phoneHref ? (
                  <li>
                    <a
                      href={phoneHref}
                      className="group flex items-center gap-4 rounded-xl border border-white/10 px-4 py-3.5 transition hover:border-accent-500/40"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-300">
                        <Phone aria-hidden="true" className="size-4.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-[0.14em] text-fg-subtle">Phone</span>
                        <span className="block truncate text-sm font-medium text-fg group-hover:text-accent-200">
                          {phone}
                        </span>
                      </span>
                    </a>
                  </li>
                ) : null}

                {location ? (
                  <li className="flex items-center gap-4 rounded-xl border border-white/10 px-4 py-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-300">
                      <MapPin aria-hidden="true" className="size-4.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs uppercase tracking-[0.14em] text-fg-subtle">Location</span>
                      <span className="block truncate text-sm font-medium text-fg">{location}</span>
                    </span>
                  </li>
                ) : null}

                {!email && !phone && !location ? (
                  <li className="rounded-xl border border-white/10 px-4 py-3.5 text-sm text-fg-subtle">
                    No contact details have been published yet.
                  </li>
                ) : null}
              </ul>

              <div className="mt-6 border-t border-white/8 pt-5">
                <p className="mb-3 text-xs uppercase tracking-[0.14em] text-fg-subtle">Elsewhere</p>
                <SocialLinks links={data.socialLinks} withLabels />
              </div>
            </Reveal>

            <Reveal delay={0.1} className="card p-5 sm:p-6">
              <h2 className="font-display text-sm uppercase tracking-[0.16em] text-fg-subtle">Availability</h2>
              <p className="mt-3 flex items-center gap-2.5 text-sm font-medium text-fg">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                Open to junior backend roles
              </p>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                {location ? `Based in ${location}, ` : ""}open to remote work and on-site roles. Typical reply
                time is under 24 hours.
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
