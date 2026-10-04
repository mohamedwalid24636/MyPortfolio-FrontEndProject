import { Download, GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import { DataSection } from "@/components/ui/DataSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { useSiteData } from "@/context/SiteDataContext";
import { formatYear } from "@/lib/format";

export function AboutSection() {
  const { data, isLoading, error, reload } = useSiteData();
  const profile = data.profile;
  const education = data.educations[0];

  const resumeHref = data.activeResume?.fileUrl ? `${data.activeResume.fileUrl}#view=FitH` : null;

  const facts = [
    { icon: MapPin, label: "Location", value: profile?.location },
    { icon: Mail, label: "Email", value: profile?.email, href: profile?.email ? `mailto:${profile.email}` : undefined },
    { icon: Phone, label: "Phone", value: profile?.phone, href: profile?.phone ? `tel:${profile.phone}` : undefined },
    {
      icon: GraduationCap,
      label: "Education",
      value: education ? `${education.degree} · ${education.institutionName}` : undefined,
    },
  ].filter((fact) => fact.value);

  return (
    <section id="about" className="section scroll-mt-24">
      <div className="container-page">
        <DataSection
          items={profile ? [profile] : []}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          skeleton={<div className="skeleton h-96 w-full rounded-[2rem]" aria-busy="true" />}
          empty={<EmptyState title="Profile not published yet" description="Profile details added through the portfolio API will appear here." />}
        >
          {() => (
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-accent-600/20 to-cyan-400/10 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-850">
              <SmartImage
                src={profile?.aboutImageUrl}
                alt={`${profile?.fullName || "Profile"} About photo`}
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
              <div className="absolute inset-x-5 bottom-5">
                <p className="font-display text-lg font-semibold text-fg">{profile?.fullName}</p>
                <p className="text-sm text-fg-muted">
                  {education?.fieldOfStudy}
                  {education?.endDate ? ` · ${formatYear(education.endDate) ?? ""}` : ""}
                </p>
              </div>
            </div>
          </Reveal>

          <div>
            <SectionHeading
              eyebrow="About me"
              title={
                <>
                  I build <span className="heading-gradient">backends that stay maintainable</span>
                </>
              }
              description="From relational schema to REST endpoint, I care about the parts of a system other developers have to live with."
            />

            <Reveal delay={0.08} className="mt-7 space-y-4 text-base leading-relaxed text-fg-muted">
              {profile?.bio
                .split(/(?<=[.!?])\s+/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </Reveal>

            <Reveal delay={0.16} className="mt-9">
              <dl className="grid gap-x-8 gap-y-5 border-t border-white/8 pt-7 sm:grid-cols-2">
                {facts.map((fact) => {
                  const Icon = fact.icon;
                  const content = (
                    <>
                      <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                        <Icon aria-hidden="true" className="size-3.5" />
                        {fact.label}
                      </dt>
                      <dd className="mt-1.5 text-sm font-medium break-words text-fg">{fact.value}</dd>
                    </>
                  );

                  return fact.href ? (
                    <a key={fact.label} href={fact.href} className="group block transition hover:text-accent-200">
                      {content}
                    </a>
                  ) : (
                    <div key={fact.label}>{content}</div>
                  );
                })}
              </dl>
            </Reveal>

            {resumeHref ? (
              <Reveal delay={0.2} className="mt-9">
                <a href={resumeHref} target="_blank" rel="noreferrer noopener" className="btn-primary">
                  <Download aria-hidden="true" className="size-4" />
                  View full CV
                </a>
              </Reveal>
            ) : null}
          </div>
        </div>
          )}
        </DataSection>
      </div>
    </section>
  );
}
