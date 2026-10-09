import { motion } from "framer-motion";
import { ArrowRight, Download, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { SmartImage } from "@/components/ui/SmartImage";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { useSiteData } from "@/context/SiteDataContext";
import type { SocialLinkDto } from "@/types/api";

export interface HeroStat {
  label: string;
  value: string;
}

interface HeroSectionProps {
  stats: HeroStat[];
  /** Most-used technologies across the portfolio, most frequent first. */
  stack: string[];
}

/**
 * Positioning copy for the hero. Deliberately hardcoded — it is branding, not data.
 * Everything the visitor can verify (title, bio, location, links) still comes from the API.
 */
const HERO_SPECIALISM =
  "I build backend systems with ASP.NET Core — REST APIs, relational data and code other developers can maintain.";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

export function HeroSection({ stats, stack }: HeroSectionProps) {
  const { data } = useSiteData();
  const profile = data.profile;

  const name = profile?.fullName?.trim() || "Portfolio";
  const role = profile?.professionalTitle?.trim() || "";
  const location = profile?.location?.trim() || "";
  const portrait = profile?.profileImageUrl;
  const socialLinks: SocialLinkDto[] = data.socialLinks;

  const resumeHref = data.activeResume?.fileUrl ? `${data.activeResume.fileUrl}#view=FitH` : "/resume";

  return (
    <section className="relative overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-14 lg:pt-32 lg:pb-20">
      {/* Decorative grid — a quiet backdrop, not a focal point. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(70%_60%_at_50%_35%,#000,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="container-page">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <motion.div variants={container} initial="hidden" animate="show">
            {role ? (
              <motion.p variants={item}>
                <span className="eyebrow">{role}</span>
              </motion.p>
            ) : null}

            <motion.h1
              variants={item}
              className="mt-4 font-display text-[2rem] leading-[1.08] font-bold sm:text-5xl lg:text-6xl"
            >
              <span className="heading-gradient">{name}</span>
            </motion.h1>

            <motion.p variants={item} className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
              {HERO_SPECIALISM}
            </motion.p>

            {location ? (
              <motion.p variants={item} className="mt-4 flex items-center gap-2 text-sm text-fg-subtle">
                <MapPin aria-hidden="true" className="size-4 text-accent-400" />
                {location}
              </motion.p>
            ) : null}

            <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/projects" className="btn-primary">
                View projects
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a
                href={resumeHref}
                target={data.activeResume ? "_blank" : undefined}
                rel={data.activeResume ? "noreferrer noopener" : undefined}
                className="btn-outline"
              >
                {data.activeResume ? (
                  <Download aria-hidden="true" className="size-4" />
                ) : (
                  <ArrowRight aria-hidden="true" className="size-4" />
                )}
                {data.activeResume ? "Download CV" : "View resume"}
              </a>
              <Link to="/contact" className="btn-ghost">
                <Mail aria-hidden="true" className="size-4" />
                Contact me
              </Link>
            </motion.div>

            <motion.div variants={item} className="mt-8">
              <SocialLinks links={socialLinks} />
            </motion.div>
          </motion.div>

          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="relative mx-auto w-full max-w-sm lg:max-w-sm"
          >
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-850 shadow-lift">
              <SmartImage
                src={portrait}
                alt={`${name}, ${role}`}
                eager
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-center gap-2.5 rounded-xl border border-white/10 bg-ink-950/75 px-3.5 py-2.5 backdrop-blur-md">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-fg">Open to opportunities</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* At-a-glance strip: numbers a recruiter can read in one pass. */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-10 border-t border-white/10 pt-7 sm:mt-12 sm:pt-8"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-14">
            <motion.ul variants={item} className="flex flex-wrap gap-x-10 gap-y-5">
              {stats.map((stat) => (
                <li key={stat.label}>
                  <p className="font-display text-2xl font-bold text-fg sm:text-3xl">{stat.value}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-fg-subtle">{stat.label}</p>
                </li>
              ))}
            </motion.ul>

            {stack.length > 0 ? (
              <motion.div variants={item} className="max-w-xl lg:text-right">
                <p className="eyebrow">Core stack</p>
                <ScrollRow as="ul" fadeFrom="from-ink-950" className="mt-3 lg:justify-end">
                  {stack.map((technology) => (
                    <li key={technology} className="chip">
                      {technology}
                    </li>
                  ))}
                </ScrollRow>
              </motion.div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
