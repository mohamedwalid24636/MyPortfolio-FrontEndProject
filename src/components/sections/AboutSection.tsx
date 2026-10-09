import { Download, GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import { DataSection } from "@/components/ui/DataSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { useSiteData } from "@/context/SiteDataContext";
import { formatYear, toParagraphs } from "@/lib/format";

/**
 * The About portrait is intentionally hidden for now. Flip this single flag back to `true` to
 * restore the two-column layout and the `aboutImageUrl` image — nothing is deleted from the API,
 * the profile record or the component.
 */
const SHOW_ABOUT_IMAGE = false;

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

  const paragraphs = toParagraphs(profile?.bio);

  return (
    <section id="about" className="section scroll-mt-24 border-t border-white/[0.06]">
      <div className="container-page">
        <DataSection
          items={profile ? [profile] : []}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          skeleton={<div className="skeleton h-96 w-full rounded-[2rem]" aria-busy="true" />}
          empty={
            <EmptyState
              title="Profile not published yet"
              description="Profile details added through the portfolio API will appear here."
            />
          }
        >
          {() => (
            <div className={SHOW_ABOUT_IMAGE ? "grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16" : "max-w-3xl"}>
              {SHOW_ABOUT_IMAGE ? (
                <Reveal className="relative">
                  <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-850 shadow-card">
                    <SmartImage
                      src={profile?.aboutImageUrl}
                      alt={`${profile?.fullName || "Profile"} about photo`}
                      className="aspect-[4/5] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-transparent" />
                    <div className="absolute inset-x-5 bottom-4">
                      <p className="font-display text-base font-semibold text-fg">{profile?.fullName}</p>
                      {education?.fieldOfStudy ? (
                        <p className="text-sm text-fg-muted">
                          {education.fieldOfStudy}
                          {education.endDate ? ` · ${formatYear(education.endDate) ?? ""}` : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Reveal>
              ) : null}

              <div>
                <SectionHeading
                  eyebrow="About me"
                  title={
                    <>
                      I build <span className="heading-gradient">backends that stay maintainable</span>
                    </>
                  }
                  description="From relational schema to the last REST endpoint, I care about the parts of a system other developers have to live with."
                />

                <Reveal delay={0.08} className="mt-6 space-y-4 text-base leading-relaxed text-fg-muted">
                  {paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </Reveal>

                <Reveal delay={0.16} className="mt-8">
                  <ul className="grid gap-x-8 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-2">
                    {facts.map((fact) => {
                      const Icon = fact.icon;
                      const content = (
                        <>
                          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                            <Icon aria-hidden="true" className="size-3.5" />
                            {fact.label}
                          </span>
                          <span className="mt-1.5 block text-sm font-medium break-words text-fg">{fact.value}</span>
                        </>
                      );

                      return (
                        <li key={fact.label}>
                          {fact.href ? (
                            <a href={fact.href} className="block transition hover:text-accent-200">
                              {content}
                            </a>
                          ) : (
                            <div>{content}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Reveal>

                <Reveal delay={0.2} className="mt-8 flex flex-wrap gap-3">
                  {resumeHref ? (
                    <a href={resumeHref} target="_blank" rel="noreferrer noopener" className="btn-primary">
                      <Download aria-hidden="true" className="size-4" />
                      View full CV
                    </a>
                  ) : null}
                </Reveal>
              </div>
            </div>
          )}
        </DataSection>
      </div>
    </section>
  );
}
