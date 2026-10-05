import { motion } from "framer-motion";
import { ArrowRight, Download, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { SmartImage } from "@/components/ui/SmartImage";
import { useSiteData } from "@/context/SiteDataContext";
import type { SocialLinkDto } from "@/types/api";

export interface HeroStat {
  label: string;
  value: string;
}

interface HeroSectionProps {
  stats: HeroStat[];
}

/**
 * Copy for the "Focus" overlay that sits over the portrait.
 *
 * Deliberately hardcoded. This was previously the first three skills joined with a separator, but
 * the skills endpoint orders alphabetically, so it always surfaced whichever skill names happened to
 * sort first ("2D Tilemaps & Physics", "Animator & Audio", "ASP.NET Core Identity") rather than
 * anything chosen. Change this value to change the overlay.
 */
const HERO_FOCUS = "Junior .Net Developer";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};

export function HeroSection({ stats }: HeroSectionProps) {
  const { data } = useSiteData();
  const profile = data.profile;

  const name = profile?.fullName?.trim() || "Portfolio";
  const role = profile?.professionalTitle?.trim() || "Portfolio";
  const summary = profile?.bio?.trim() || "";
  const location = profile?.location?.trim() || "";
  const portrait = profile?.profileImageUrl;
  const socialLinks: SocialLinkDto[] = data.socialLinks;

  const resumeHref = data.activeResume?.fileUrl ? `${data.activeResume.fileUrl}#view=FitH` : "/resume";

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-36 lg:pt-40 lg:pb-28">
      {/* Decorative grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [mask-image:radial-gradient(70%_60%_at_50%_35%,#000,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.09) 1px, transparent 1px)",
          backgroundSize: "58px 58px",
        }}
      />

      <div className="container-page">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.p variants={item} className="mt-7 font-mono text-sm text-fg-subtle">
              <span className="text-accent-300">const</span> developer = &#123;
            </motion.p>

            <motion.h1
              variants={item}
              className="mt-2 font-display text-4xl leading-[1.08] font-extrabold sm:text-5xl lg:text-6xl"
            >
              <span className="heading-gradient">{name}</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-4 font-display text-lg font-semibold text-fg sm:text-xl lg:text-2xl"
            >
              {role}
            </motion.p>

            <motion.p variants={item} className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
              {summary}
            </motion.p>

            <motion.p variants={item} className="mt-5 flex items-center gap-2 text-sm text-fg-subtle">
              <MapPin aria-hidden="true" className="size-4 text-accent-400" />
              {location}
            </motion.p>

            <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/projects" className="btn-primary">
                View my work
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a href={resumeHref} target="_blank" rel="noreferrer noopener" className="btn-outline">
                <Download aria-hidden="true" className="size-4" />
                Download CV
              </a>
            </motion.div>

            <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-5">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-bold text-fg sm:text-3xl">{stat.value}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-fg-subtle">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={item} className="mt-9">
              <SocialLinks links={socialLinks} />
            </motion.div>

            <motion.p variants={item} className="mt-9 font-mono text-xs text-fg-subtle">
              &#125; <span className="text-accent-300">//</span> building reliable systems, one API at a time.
            </motion.p>
          </motion.div>

          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-accent-600/25 via-fuchsia-500/10 to-cyan-400/25 blur-2xl"
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-850 shadow-2xl">
              <SmartImage
                src={portrait}
                alt={`${name}, ${role}`}
                eager
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />

              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-ink-950/70 p-4 backdrop-blur-md">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-300">Focus</p>
                <p className="mt-1 text-sm leading-relaxed text-fg">{HERO_FOCUS}</p>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
