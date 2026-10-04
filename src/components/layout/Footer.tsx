import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { useSiteData } from "@/context/SiteDataContext";

export function Footer() {
  const { data } = useSiteData();
  const year = new Date().getFullYear();
  const name = data.profile?.fullName?.trim() || "Portfolio";
  const email = data.profile?.email?.trim() || "";
  const phone = data.profile?.phone?.trim() || "";
  const location = data.profile?.location?.trim() || "";
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";

  return (
    <footer className="relative mt-24 border-t border-white/8 bg-ink-950/60">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1.2fr]">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-600 via-accent-500 to-cyan-400 font-display text-sm font-bold text-white">
                {name.slice(0, 2).toUpperCase()}
              </span>
              <span className="font-display text-base font-semibold text-fg">{name}</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-fg-muted">{data.profile?.bio || ""}</p>
            <SocialLinks links={data.socialLinks} size="sm" />
          </div>

          <nav aria-label="Footer">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-fg-subtle">Navigate</h2>
            <ul className="space-y-2.5">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-fg-muted transition hover:translate-x-0.5 hover:text-accent-200 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/resume" className="text-sm text-fg-muted transition hover:translate-x-0.5 hover:text-accent-200 inline-block">
                  View resume
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-fg-subtle">Get in touch</h2>
            <ul className="space-y-3 text-sm text-fg-muted">
              {email ? <li>
                <a href={`mailto:${email}`} className="flex items-center gap-3 transition hover:text-accent-200">
                  <Mail aria-hidden="true" className="size-4 shrink-0 text-accent-400" />
                  <span className="break-all">{email}</span>
                </a>
              </li> : null}
              {phone ? <li>
                <a href={phoneHref} className="flex items-center gap-3 transition hover:text-accent-200">
                  <Phone aria-hidden="true" className="size-4 shrink-0 text-accent-400" />
                  <span>{phone}</span>
                </a>
              </li> : null}
              {location ? <li className="flex items-center gap-3">
                <MapPin aria-hidden="true" className="size-4 shrink-0 text-accent-400" />
                <span>{location}</span>
              </li> : null}
            </ul>
          </div>
        </div>

        <div className="divider my-10" />

        <div className="flex flex-col items-center justify-between gap-3 text-center text-xs text-fg-subtle sm:flex-row sm:text-left">
          <p>© {year} {name}. All rights reserved.</p>
          <p className="font-mono">
            Built with React, TypeScript &amp; ASP.NET Core
          </p>
        </div>
      </div>
    </footer>
  );
}
