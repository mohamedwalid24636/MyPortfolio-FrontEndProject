import { ArrowRight, FolderGit2 } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DataSection } from "@/components/ui/DataSection";
import { ProjectGridSkeleton } from "@/components/ui/Skeleton";
import { ProjectGrid } from "@/components/project/ProjectCard";
import type { ProjectDto } from "@/types/api";

interface FeaturedProjectsSectionProps {
  projects: ProjectDto[] | null;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function FeaturedProjectsSection({ projects, isLoading, error, onRetry }: FeaturedProjectsSectionProps) {
  return (
    <section id="projects" className="section scroll-mt-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Selected work"
            title="Projects I have shipped"
            description="Academic and training projects, each one built to solve a concrete problem end to end."
          />
          <Reveal delay={0.1}>
            <Link to="/projects" className="btn-outline shrink-0">
              All projects
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-12">
          <DataSection
            items={projects}
            isLoading={isLoading}
            error={error}
            onRetry={onRetry}
            skeleton={<ProjectGridSkeleton count={3} />}
            empty={
              <EmptyState
                icon={FolderGit2}
                title="No projects yet"
                description="Projects published through the API will appear here."
              />
            }
          >
            {(items) => <ProjectGrid projects={items} />}
          </DataSection>
        </div>
      </div>
    </section>
  );
}
