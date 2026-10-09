import { ExternalLink, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DataSection } from "@/components/ui/DataSection";
import { formatFullDate } from "@/lib/format";
import { hasLink, resolveImageUrl } from "@/lib/media";
import { useSiteData } from "@/context/SiteDataContext";
import type { CertificationDto } from "@/types/api";

function CertificationCard({ certification }: { certification: CertificationDto }) {
  const issued = formatFullDate(certification.issueDate);
  const certificateHref = hasLink(certification.credentialUrl)
    ? certification.credentialUrl
    : hasLink(certification.certificateUrl)
      ? resolveImageUrl(certification.certificateUrl)
      : null;
  const certificateLabel = hasLink(certification.credentialUrl) ? "Verify credential" : "View certificate";

  const content = (
    <>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent-500/25 bg-accent-500/10 text-accent-200">
          <ShieldCheck aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-fg">{certification.name}</h3>
          <p className="mt-0.5 text-sm text-accent-300">{certification.issuingOrganization}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-fg-subtle">
        {issued ? `Issued ${issued}` : "Issue date unavailable"}
        {certification.doesNotExpire ? " · No expiry" : ""}
      </p>

      {certificateHref ? (
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300 transition group-hover:text-accent-200">
          {certificateLabel}
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </span>
      ) : null}
    </>
  );

  return (
    <article className="card card-hover group h-full p-5">
      {certificateHref ? (
        <a
          href={certificateHref}
          target="_blank"
          rel="noreferrer noopener"
          className="block h-full focus-visible:outline-none"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </article>
  );
}

/**
 * Verified credentials, on their own. Achievements used to be stacked here too, but they are kept
 * to the resume page so the home page stays focused on what was built and what is proven by a
 * certificate.
 */
export function CertificationsSection() {
  const { data, isLoading, error, reload } = useSiteData();

  return (
    <section id="certifications" className="section scroll-mt-24 border-t border-white/[0.06]">
      <div className="container-page">
        <SectionHeading
          eyebrow="Credentials"
          title="Certifications"
          description="Certificates and diplomas, with verification links where available."
        />

        <div className="mt-8 sm:mt-10">
          <DataSection
            items={data.certifications}
            isLoading={isLoading}
            error={error}
            onRetry={reload}
            skeleton={
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="card space-y-3 p-5">
                    <div className="skeleton h-5 w-2/3" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                ))}
              </div>
            }
            empty={
              <EmptyState
                icon={ShieldCheck}
                title="No certifications listed yet"
                description="Certificates added through the API will appear here."
                compact
              />
            }
          >
            {(items) => (
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {items.map((certification) => (
                  <Reveal key={certification.id} className="h-full">
                    <CertificationCard certification={certification} />
                  </Reveal>
                ))}
              </div>
            )}
          </DataSection>
        </div>
      </div>
    </section>
  );
}