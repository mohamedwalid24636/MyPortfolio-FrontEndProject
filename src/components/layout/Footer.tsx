import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { HOME_SECTION_LINKS, NAV_ITEMS } from "@/lib/constants";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { useSiteData } from "@/context/SiteDataContext";
import { hasExperiences } from "@/lib/experiences";
import { getInitials } from "@/lib/format";

export function Footer() {
  const { data } = useSiteData();
  const year = new Date().getFullYear();
  const name = data.profile?.fullName?.trim() || "Portfolio";
  const title = data.profile?.professionalTitle?.trim() || "";
  const email = data.profile?.email?.trim() || "";
  const phone = data.profile?.phone?.trim() || "";
  const location = data.profile?.location?.trim() || "";
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";

  // The `#experience` section only exists when the API holds an experience record, so the footer
  // must not link to it otherwise.
  const hasEmployment = useMemo(() => hasExperiences(data.experiences), [data.experiences]);
  const sectionLinks = useMemo(
    () => HOME_SECTION_LINKS.filter((item) => item.hash !== "#experience" || hasEmployment),
    [hasEmployment],
  );

  return (
    <footer className="mt-24 border-t border-white/10 bg-ink-950/70">
      <div className="container-page py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg border border-accent-500/40 bg-accent-600/90 font-display text-sm font-bold text-white">
                {getInitials(name)}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-sm font-semibold text-fg">{name}</span>
                {title ? <span className="font-mono text-[0.65rem] text-fg-subtle">{title}</span> : null}
              </span>
            </Link>
            {data.profile?.bio ? (
              <p className="max-w-xs text-sm leading-relaxed text-fg-muted">{data.profile.bio}</p>
            ) : null}
            <SocialLinks links={data.socialLinks} size="sm" />
          </div>

          <nav aria-label="Pages">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-fg-subtle">Pages</h2>
            <ul className="space-y-2.5">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="inline-block text-sm text-fg-muted transition hover:text-accent-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Highlights">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-fg-subtle">Highlights</h2>
            <ul className="space-y-2.5">
              {sectionLinks.map((item) => (
                <li key={item.hash}>
                  <Link
                    to={{ pathname: "/", hash: item.hash }}
                    className="inline-block text-sm text-fg-muted transition hover:text-accent-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-fg-subtle">Get in touch</h2>
            <ul className="space-y-3 text-sm text-fg-muted">
              {email ? (
                <li>
                  <a href={`mailto:${email}`} className="flex items-center gap-3 transition hover:text-accent-200">
                    <Mail aria-hidden="true" className="size-4 shrink-0 text-accent-400" />
                    <span className="break-all">{email}</span>
                  </a>
                </li>
              ) : null}
              {phone ? (
                <li>
                  <a href={phoneHref} className="flex items-center gap-3 transition hover:text-accent-200">
                    <Phone aria-hidden="true" className="size-4 shrink-0 text-accent-400" />
                    <span>{phone}</span>
                  </a>
                </li>
              ) : null}
              {location ? (
                <li className="flex items-center gap-3">
                  <MapPin aria-hidden="true" className="size-4 shrink-0 text-accent-400" />
                  <span>{location}</span>
                </li>
              ) : null}
              {!email && !phone && !location ? <li className="text-fg-subtle">No contact details published.</li> : null}
            </ul>
          </div>
        </div>

        <div className="divider my-10" />

        <div className="flex flex-col items-center justify-between gap-3 text-center text-xs text-fg-subtle sm:flex-row sm:text-left">
          <p>
            © {year} {name}. All rights reserved.
          </p>
          <p className="font-mono">Built with React, TypeScript &amp; ASP.NET Core</p>
        </div>
      </div>
    </footer>
  );
}
