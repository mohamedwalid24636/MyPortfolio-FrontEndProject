import { ArrowRight, Mail, MessageSquare } from "lucide-react";
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
        <Reveal className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-850/70 p-6 shadow-card sm:p-10 lg:p-14">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-accent-500/60" />

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
            <div className="max-w-2xl">
              <span className="eyebrow">Contact</span>
              <h2 className="mt-4 font-display text-3xl leading-tight font-bold sm:text-4xl">
                Let’s <span className="heading-gradient">build something reliable</span> together
              </h2>
              <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">
                If you are hiring a backend developer, I would be happy to talk through your API, database or
                architecture goals.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
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
            </div>

            <div className="shrink-0 lg:text-right">
              <p className="eyebrow">Find me online</p>
              <div className="mt-4">
                <SocialLinks links={data.socialLinks} className="lg:justify-end" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
