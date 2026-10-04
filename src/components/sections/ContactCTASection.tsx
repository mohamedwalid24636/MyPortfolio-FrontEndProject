import { ArrowRight, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/ui/Reveal";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { useSiteData } from "@/context/SiteDataContext";

export function ContactCTASection() {
  const { data } = useSiteData();
  const profile = data.profile;
  const email = profile?.email?.trim();
  const resumeUrl = data.activeResume?.fileUrl;

  return (
    <section className="section scroll-mt-24">
      <div className="container-page">
        <Reveal className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-ink-850 via-ink-800 to-ink-850 p-8 shadow-2xl sm:p-10 lg:p-14">
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-16 size-64 rounded-full bg-accent-600/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 -left-20 size-64 rounded-full bg-cyan-400/15 blur-3xl"
          />

          <div className="relative">
            <h2 className="font-display text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">
              Let’s <span className="heading-gradient">build something reliable</span> together
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
              If you're hiring a junior .NET backend developer, I'd be happy to talk through your API, database or architecture goals.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/contact" className="btn-primary">
                Start a conversation
                <MessageSquare aria-hidden="true" className="size-4" />
              </Link>
              {email ? (
                <a href={`mailto:${email}`} className="btn-outline">
                  <Mail aria-hidden="true" className="size-4" />
                  Email me directly
                </a>
              ) : null}
              {resumeUrl ? (
                <a href={resumeUrl} download className="btn-ghost">
                  Download CV
                  <ArrowRight aria-hidden="true" className="size-4" />
                </a>
              ) : null}
            </div>

            <dl className="mt-9 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                  <MapPin aria-hidden="true" className="size-3.5" />
                  Location
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-fg">{profile?.location || "—"}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                  <Mail aria-hidden="true" className="size-3.5" />
                  Email
                </dt>
                <dd className="mt-1.5 break-all text-sm font-medium text-fg">{email || "—"}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                  <Phone aria-hidden="true" className="size-3.5" />
                  Phone
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-fg">{profile?.phone || "—"}</dd>
              </div>
            </dl>

            <div className="mt-8">
              <SocialLinks links={data.socialLinks} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
