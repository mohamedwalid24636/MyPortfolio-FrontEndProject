import { ProjectCard } from "@/components/project/ProjectCard";
import { CardRail } from "@/components/ui/CardRail";
import type { ProjectDto } from "@/types/api";

interface ProjectCarouselProps {
  projects: ProjectDto[];
  className?: string;
}

/**
 * Horizontal project rail for the resume. Built on the shared `CardRail` so projects scroll and
 * snap exactly like the Education, Experience, Certifications and Achievements rails.
 */
export function ProjectCarousel({ projects, className = "" }: ProjectCarouselProps) {
  return (
    <CardRail
      items={projects}
      getKey={(project) => project.id}
      label="Projects"
      slideClassName="w-[80%] sm:w-72"
      className={className}
      renderItem={(project) => <ProjectCard project={project} />}
    />
  );
}
