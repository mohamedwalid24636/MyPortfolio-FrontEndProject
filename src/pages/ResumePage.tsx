import { useState } from "react";
import {
  Award,
  Briefcase,
  Download,
  ExternalLink,
  FileText,
  FolderGit2,
  GraduationCap,
  MapPin,
  Printer,
} from "lucide-react";
import { ProjectGrid } from "@/components/project/ProjectCard";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { DataSection } from "@/components/ui/DataSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSiteData } from "@/context/SiteDataContext";
import { useAllProjects } from "@/hooks/usePortfolioData";
import { formatDateRange, formatFullDate, toBulletList } from "@/lib/format";
import { hasLink, resolveImageUrl } from "@/lib/media";
import { groupSkillsByType, parseProficiency } from "@/lib/skills";

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-fg-subtle">{label}</dt>
      <dd className="text-right font-medium break-words text-fg">{children}</dd>
    </div>
  );
}

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Award;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="border-t border-white/8 pt-8">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-bold">
        <span className="flex size-9 items-center justify-center rounded-xl border border-accent-500/25 bg-accent-500/10 text-accent-200">
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </Reveal>
  );
}

export default function ResumePage() {
  const { data, isLoading, error, reload } = useSiteData();
  const projects = useAllProjects();
  const [showPreview, setShowPreview] = useState(false);

  usePageMeta(
    data.profile ? `Resume / CV | ${data.profile.fullName}` : "Resume / CV",
    "Curriculum vitae — experience, education, skills and certifications.",
  );

  const profile = data.profile;
  const resume = data.activeResume;

  /*
   * Every value here is read from the API. The CV file, the name and the contact details are only
   * rendered when the database actually holds them — no bundled copy of the CV is kept in the
   * frontend, because a stale file next to the real one is worse than no file at all.
   */
  const cvUrl = hasLink(resume?.fileUrl) ? resolveImageUrl(resume.fileUrl) : null;
  const downloadName = resume?.fileName || "Curriculum Vitae";

  const email = profile?.email.trim() ?? "";
  const phone = profile?.phone.trim() ?? "";
  const location = profile?.location.trim() ?? "";
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const name = profile?.fullName ?? "";
  const title = profile?.professionalTitle ?? "";

  const skillGroups = groupSkillsByType(data.skills, data.types);

  return (
    <>
      <PageHeader
        eyebrow="Curriculum vitae"
        title={
          <>
            My <span className="heading-gradient">resume</span>
          </>
        }
        description="A single, printable view of everything above: what I have studied, what I have built and what I am good at."
        actions={
          <>
            {cvUrl ? (
              <a href={cvUrl} download={downloadName} className="btn-primary">
                <Download aria-hidden="true" className="size-4" />
                Download CV
              </a>
            ) : null}
            {cvUrl ? (
              <button
                type="button"
                onClick={() => setShowPreview((value) => !value)}
                className="btn-outline"
              >
                <FileText aria-hidden="true" className="size-4" />
                {showPreview ? "Hide preview" : "Preview CV"}
              </button>
            ) : null}
            <button type="button" onClick={() => window.print()} className="btn-ghost">
              <Printer aria-hidden="true" className="size-4" />
              Print
            </button>
          </>
        }
      />

      {!cvUrl && !isLoading && !error ? (
        <div className="container-page pt-8">
          <p className="rounded-2xl border border-white/10 bg-ink-850/70 px-4 py-3 text-sm text-fg-muted">
            No CV has been published yet. Everything else on this page is up to date.
          </p>
        </div>
      ) : null}

      {showPreview && cvUrl ? (
        <Reveal className="container-page pt-10">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-850">
            <iframe
              src={`${cvUrl}#view=FitH`}
              title="Curriculum vitae preview"
              className="h-[70vh] w-full"
              loading="lazy"
            />
          </div>
        </Reveal>
      ) : null}

      <section className="section pt-14">
        <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Reveal className="card overflow-hidden">
              <div className="relative">
                <SmartImage
                  src={profile?.profileImageUrl}
                  alt={name}
                  eager
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
                <div className="absolute inset-x-5 bottom-4">
                  <h1 className="font-display text-xl font-bold text-fg">{name}</h1>
                  {title ? <p className="text-sm text-accent-300">{title}</p> : null}
                </div>
              </div>

              <dl className="divide-y divide-white/8 px-5 py-2">
                {email ? (
                  <Line label="Email">
                    <a href={`mailto:${email}`} className="break-all hover:text-accent-200">
                      {email}
                    </a>
                  </Line>
                ) : null}
                {phone && phoneHref ? (
                  <Line label="Phone">
                    <a href={phoneHref} className="hover:text-accent-200">
                      {phone}
                    </a>
                  </Line>
                ) : null}
                {location ? (
                  <Line label="Location">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin aria-hidden="true" className="size-3.5 text-accent-400" />
                      {location}
                    </span>
                  </Line>
                ) : null}
              </dl>
            </Reveal>

            <Reveal delay={0.06} className="card p-6">
              <h2 className="font-display text-sm uppercase tracking-[0.16em] text-fg-subtle">Skills</h2>

              <div className="mt-4 space-y-5">
                <DataSection
                  items={data.skills}
                  isLoading={isLoading}
                  error={error}
                  onRetry={reload}
                  skeleton={
                    <div className="space-y-2" aria-busy="true">
                      {Array.from({ length: 6 }, (_, index) => (
                        <Skeleton key={index} className="h-4 w-full" />
                      ))}
                    </div>
                  }
                  empty={<p className="text-sm text-fg-muted">No skills recorded yet.</p>}
                >
                  {() =>
                    skillGroups.map((group) => (
                      <div key={group.key}>
                        <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-accent-300">
                          {group.title}
                        </p>
                        <ul className="space-y-1.5">
                          {group.skills.map((skill) => {
                            const percentage = parseProficiency(skill.proficiencyLevel);
                            return (
                              <li key={`${group.key}-${skill.id}`} className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-fg-muted">{skill.name}</span>
                                <span className="flex shrink-0 items-center gap-2">
                                  {percentage !== null ? (
                                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                                      <span
                                        className="block h-full rounded-full bg-gradient-to-r from-accent-500 to-cyan-400"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </span>
                                  ) : null}
                                  {skill.proficiencyLevel ? (
                                    <span className="text-xs text-fg-subtle">{skill.proficiencyLevel}</span>
                                  ) : null}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  }
                </DataSection>
              </div>
            </Reveal>

            <Reveal delay={0.1} className="card p-6">
              <h2 className="font-display text-sm uppercase tracking-[0.16em] text-fg-subtle">References</h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                Available on request.
              </p>
              {cvUrl ? (
                <a href={cvUrl} download={downloadName} className="btn-outline mt-5 w-full">
                  <Download aria-hidden="true" className="size-4" />
                  Download full CV
                </a>
              ) : null}
            </Reveal>
          </aside>

          {/* Main column */}
          <div className="space-y-10">
            <Reveal className="card p-6 sm:p-7">
              <h2 className="font-display text-xl font-bold">Professional summary</h2>
              {profile?.bio ? (
                <p className="mt-4 text-base leading-relaxed text-fg-muted">{profile.bio}</p>
              ) : null}
            </Reveal>

            <Block icon={Briefcase} title="Experience">
              <DataSection
                items={data.experiences}
                isLoading={isLoading}
                error={error}
                onRetry={reload}
                skeleton={
                  <div className="space-y-4" aria-busy="true">
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                  </div>
                }
                empty={
                  <EmptyState
                    icon={Briefcase}
                    title="No experience recorded yet"
                    description="Roles will appear here as soon as they are published."
                    compact
                  />
                }
              >
                {(items) => (
                  <div className="space-y-5">
                    {items.map((experience) => {
                      const bullets = toBulletList(experience.description);
                      return (
                        <article key={experience.id} className="card p-5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-display text-base font-semibold text-fg">{experience.jobTitle}</h3>
                              <p className="mt-0.5 text-sm text-accent-300">{experience.companyName}</p>
                            </div>
                            <span className="chip">
                              {formatDateRange(experience.startDate, experience.endDate, experience.isCurrent)}
                            </span>
                          </div>

                          {bullets.length > 0 ? (
                            <ul className="mt-3.5 space-y-1.5">
                              {bullets.map((bullet, index) => (
                                <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-fg-muted">
                                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent-500/70" />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </DataSection>
            </Block>

            <Block icon={FolderGit2} title="Projects">
              <DataSection
                items={projects.data ?? []}
                isLoading={projects.isLoading}
                error={projects.error}
                onRetry={projects.reload}
                skeleton={<Skeleton className="h-56 w-full rounded-2xl" />}
                empty={
                  <EmptyState
                    icon={FolderGit2}
                    title="No projects recorded yet"
                    description="Projects published through the API will appear here."
                    compact
                  />
                }
              >
                {(items) => <ProjectGrid projects={items} />}
              </DataSection>
            </Block>

            <Block icon={GraduationCap} title="Education">
              <DataSection
                items={data.educations}
                isLoading={isLoading}
                error={error}
                onRetry={reload}
                skeleton={<Skeleton className="h-24 w-full rounded-2xl" />}
                empty={
                  <EmptyState
                    icon={GraduationCap}
                    title="No education recorded yet"
                    compact
                  />
                }
              >
                {(items) => (
                  <div className="space-y-5">
                    {items.map((education) => (
                      <article key={education.id} className="card p-5">
                        <h3 className="font-display text-base font-semibold text-fg">{education.degree}</h3>
                        <p className="mt-0.5 text-sm text-accent-300">{education.institutionName}</p>
                        <p className="mt-1 text-xs text-fg-subtle">
                          {formatDateRange(education.startDate, education.endDate, education.isCurrent)}
                          {education.fieldOfStudy ? ` · ${education.fieldOfStudy}` : ""}
                        </p>
                        {education.description ? (
                          <p className="mt-3 text-sm leading-relaxed text-fg-muted">{education.description}</p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </DataSection>
            </Block>

            <Block icon={Award} title="Certifications">
              <DataSection
                items={data.certifications}
                isLoading={isLoading}
                error={error}
                onRetry={reload}
                skeleton={<Skeleton className="h-20 w-full rounded-2xl" />}
                empty={
                  <EmptyState
                    icon={Award}
                    title="No certifications listed yet"
                    description="Certificates and diplomas will be shown here."
                    compact
                  />
                }
              >
                {(items) => (
                  <ul className="space-y-4">
                    {items.map((certification) => {
                      const issued = formatFullDate(certification.issueDate);
                      const certificateHref = hasLink(certification.credentialUrl)
                        ? certification.credentialUrl
                        : hasLink(certification.certificateUrl)
                          ? resolveImageUrl(certification.certificateUrl)
                          : null;
                      const certificateLabel = hasLink(certification.credentialUrl)
                        ? "Verify credential"
                        : "View certificate";
                      const content = (
                        <>
                          <h3 className="font-display text-base font-semibold text-fg">{certification.name}</h3>
                          <p className="mt-0.5 text-sm text-accent-300">{certification.issuingOrganization}</p>
                          <p className="mt-1 text-xs text-fg-subtle">
                            {issued ? `Issued ${issued}` : "Issue date unavailable"}
                            {certification.doesNotExpire ? " · No expiry" : ""}
                          </p>
                        </>
                      );

                      return (
                        <li key={certification.id} className="card p-5">
                          {certificateHref ? (
                            <a
                              href={certificateHref}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="group block"
                            >
                              {content}
                              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300">
                                {certificateLabel}
                                <ExternalLink aria-hidden="true" className="size-3.5" />
                              </span>
                            </a>
                          ) : (
                            content
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </DataSection>
            </Block>

            <Block icon={Award} title="Achievements">
              <DataSection
                items={data.achievements}
                isLoading={isLoading}
                error={error}
                onRetry={reload}
                skeleton={<Skeleton className="h-20 w-full rounded-2xl" />}
                empty={<EmptyState icon={Award} title="No achievements listed yet" compact />}
              >
                {(items) => (
                  <ul className="space-y-4">
                    {items.map((achievement) => (
                      <li key={achievement.id} className="card flex flex-wrap items-start justify-between gap-3 p-5">
                        {hasLink(achievement.imageUrl) ? (
                          <SmartImage
                            src={achievement.imageUrl}
                            alt={achievement.title}
                            className="size-20 shrink-0 rounded-xl object-cover"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <h3 className="font-display text-base font-semibold text-fg">{achievement.title}</h3>
                          {achievement.description ? (
                            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{achievement.description}</p>
                          ) : null}
                          {achievement.date ? (
                            <p className="mt-1.5 text-xs text-fg-subtle">{formatFullDate(achievement.date)}</p>
                          ) : null}
                        </div>
                        {hasLink(achievement.url) ? (
                          <a
                            href={achievement.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="btn-outline !px-3.5 !py-2 text-xs"
                          >
                            View
                            <ExternalLink aria-hidden="true" className="size-3.5" />
                          </a>
                        ) : (
                          <Chip>Verified</Chip>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </DataSection>
            </Block>
          </div>
        </div>
      </section>
    </>
  );
}
