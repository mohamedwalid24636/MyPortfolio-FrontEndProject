import { Globe, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon, XIcon, type IconLike } from "@/components/ui/BrandIcons";
import { hasLink } from "@/lib/media";
import { SmartImage } from "@/components/ui/SmartImage";
import type { SocialLinkDto } from "@/types/api";

interface SocialEntry {
  label: string;
  href: string;
  icon: IconLike;
  iconUrl: string | null | undefined;
}

const ICONS: Record<string, IconLike> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  twitter: XIcon,
  x: XIcon,
  email: Mail,
  mail: Mail,
  website: Globe,
  web: Globe,
};

/** Normalises a backend social link into a display entry. */
function toEntry(link: SocialLinkDto): SocialEntry | null {
  if (!hasLink(link.url)) return null;

  const platform = (link.platform || "").trim().toLowerCase();
  return {
    label: link.username?.trim() || link.platform || "Link",
    href: link.url,
    icon: ICONS[platform] ?? Globe,
    iconUrl: link.iconUrl,
  };
}

interface SocialLinksProps {
  links: SocialLinkDto[];
  className?: string;
  size?: "sm" | "md";
  /** Show the platform name next to the icon. */
  withLabels?: boolean;
}

/**
 * Renders social links from the API. An empty endpoint stays empty so the backend remains the
 * single source of truth for public contact links.
 */
export function SocialLinks({ links, className = "", size = "md", withLabels = false }: SocialLinksProps) {
  const entries = links.length > 0 ? links.map(toEntry).filter((entry): entry is SocialEntry => entry !== null) : [];

  if (entries.length === 0) return null;
  const resolved = entries;
  const iconSize = size === "sm" ? "size-4" : "size-[1.1rem]";

  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {resolved.map((entry) => {
        const Icon = entry.icon;
        return (
          <li key={`${entry.label}-${entry.href}`}>
            <a
              href={entry.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={entry.label}
              title={entry.label}
              className={`group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] text-fg-muted transition hover:-translate-y-0.5 hover:border-accent-500/40 hover:text-accent-200 ${
                withLabels ? "px-3.5 py-2 text-sm font-medium" : "size-10 justify-center"
              }`}
            >
              {hasLink(entry.iconUrl) ? (
                <SmartImage src={entry.iconUrl} alt="" className={`${iconSize} rounded object-contain`} />
              ) : (
                <Icon className={iconSize} />
              )}
              {withLabels ? <span>{entry.label}</span> : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
