import { Boxes, Code2, Database, Gauge, Layers, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DataSection } from "@/components/ui/DataSection";
import { SmartImage } from "@/components/ui/SmartImage";
import { useSiteData } from "@/context/SiteDataContext";
import type { ServiceDto } from "@/types/api";
import { hasLink } from "@/lib/media";

/** Icon fallbacks used when a service has no iconUrl configured. */
const ICON_FALLBACKS: LucideIcon[] = [Code2, Database, Workflow, Layers, Gauge, Boxes];

function ServiceCard({ service, index }: { service: ServiceDto; index: number }) {
  const Icon = ICON_FALLBACKS[index % ICON_FALLBACKS.length];

  return (
    <Reveal delay={index * 0.07} className="h-full">
      <article className="card card-hover group flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <span className="flex size-12 items-center justify-center rounded-2xl border border-accent-500/25 bg-accent-500/10 text-accent-200 transition duration-300 group-hover:scale-105 group-hover:border-accent-500/50 group-hover:bg-accent-500/20">
            {hasLink(service.iconUrl) ? (
              <SmartImage src={service.iconUrl} alt="" className="size-5 rounded object-contain" />
            ) : (
              <Icon aria-hidden="true" className="size-5" />
            )}
          </span>
          <span className="font-mono text-xs text-fg-subtle">
            {String(service.displayOrder || index + 1).padStart(2, "0")}
          </span>
        </div>

        <h3 className="mt-5 font-display text-lg font-semibold text-fg transition-colors group-hover:text-accent-200">
          {service.title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{service.description}</p>
      </article>
    </Reveal>
  );
}

export function ServicesSection() {
  const { data, isLoading, error, reload } = useSiteData();
  const services = [...data.services].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <section id="services" className="section scroll-mt-24 border-t border-white/[0.06]">
      <div className="container-page">
        <SectionHeading
          eyebrow="What I do"
          title="Services I bring to a team"
          description="Everything below is grounded in hands-on project work — from schema design to the last API endpoint."
        />

        <div className="mt-8 sm:mt-10">
          <DataSection
            items={services}
            isLoading={isLoading}
            error={error}
            onRetry={reload}
            skeleton={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="card space-y-4 p-6">
                    <div className="skeleton size-12 rounded-2xl" />
                    <div className="skeleton h-5 w-2/3" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-4/5" />
                  </div>
                ))}
              </div>
            }
            empty={
              <EmptyState
                title="No services published yet"
                description="Services added through the API will appear here automatically."
              />
            }
          >
            {(items) => (
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {items.map((service, index) => (
                  <ServiceCard key={service.id} service={service} index={index} />
                ))}
              </div>
            )}
          </DataSection>
        </div>

        <Reveal delay={0.1} className="mt-10 text-center">
          <Link to="/projects" className="btn-outline">
            See the projects behind these services
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
