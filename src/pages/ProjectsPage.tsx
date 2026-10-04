import { useEffect, useMemo, useState } from "react";
import { FolderGit2, Search, SlidersHorizontal, X } from "lucide-react";
import { DataSection } from "@/components/ui/DataSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ProjectGridSkeleton } from "@/components/ui/Skeleton";
import { ProjectGrid } from "@/components/project/ProjectCard";
import { useAllProjects } from "@/hooks/usePortfolioData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSiteData } from "@/context/SiteDataContext";
import type { CategoryDto, ProjectDto, TechnologyDto } from "@/types/api";

const PAGE_SIZE = 6;

type FilterValue = number | "all";

export default function ProjectsPage() {
  const { data: siteData } = useSiteData();
  usePageMeta(
    siteData.profile?.fullName ? `Projects | ${siteData.profile.fullName}` : "Projects",
    "Selected backend and full-stack projects built with ASP.NET Core, Entity Framework Core and SQL Server.",
  );

  const { data, isLoading, error, reload } = useAllProjects();
  const projects = data ?? [];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FilterValue>("all");
  const [technology, setTechnology] = useState<FilterValue>("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 250);

  const { categories, technologies } = useMemo(() => {
    const categoryMap = new Map<number, CategoryDto>();
    const technologyMap = new Map<number, TechnologyDto>();

    projects.forEach((project) => {
      (project.categories ?? []).forEach((item) => categoryMap.set(item.id, item));
      (project.technologies ?? []).forEach((item) => technologyMap.set(item.id, item));
    });

    return {
      categories: [...categoryMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
      technologies: [...technologyMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();

    return projects.filter((project) => {
      if (category !== "all" && !(project.categories ?? []).some((item) => item.id === category)) return false;
      if (technology !== "all" && !(project.technologies ?? []).some((item) => item.id === technology)) {
        return false;
      }
      if (!term) return true;

      const haystack = [
        project.title,
        project.shortDescription,
        project.description,
        ...(project.tags ?? []).map((tag) => tag.name),
        ...(project.technologies ?? []).map((item) => item.name),
        ...(project.categories ?? []).map((item) => item.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [projects, debouncedSearch, category, technology]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, technology]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const hasActiveFilters = debouncedSearch.trim().length > 0 || category !== "all" || technology !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setTechnology("all");
  };

  const visibleProjects: ProjectDto[] = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title={
          <>
            Projects I have <span className="heading-gradient">built and shipped</span>
          </>
        }
        description="Filter by category, technology or keyword to find the work that matters to you."
      />

      <section className="section pt-14">
        <div className="container-page">
          <div className="surface mb-10 flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <label htmlFor="project-search" className="sr-only">
                Search projects
              </label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
              />
              <input
                id="project-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects, tags, technologies…"
                className="field pl-11"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <SlidersHorizontal aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />
                <label htmlFor="category-filter" className="sr-only">
                  Filter by category
                </label>
                <select
                  id="category-filter"
                  value={category}
                  onChange={(event) => setCategory(event.target.value === "all" ? "all" : Number(event.target.value))}
                  className="field !w-auto min-w-40 !py-2.5"
                >
                  <option value="all">All categories</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <label htmlFor="technology-filter" className="sr-only">
                  Filter by technology
                </label>
                <select
                  id="technology-filter"
                  value={technology}
                  onChange={(event) =>
                    setTechnology(event.target.value === "all" ? "all" : Number(event.target.value))
                  }
                  className="field !w-auto min-w-40 !py-2.5"
                >
                  <option value="all">All technologies</option>
                  {technologies.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters ? (
                <button type="button" onClick={clearFilters} className="btn-ghost !px-3 !py-2 text-sm">
                  <X aria-hidden="true" className="size-4" />
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {!isLoading && !error ? (
            <p aria-live="polite" className="mb-6 text-sm text-fg-muted">
              Showing <span className="font-semibold text-fg">{filteredProjects.length}</span>{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}
              {hasActiveFilters ? " matching your filters" : " in total"}
            </p>
          ) : null}

          <DataSection
            items={projects}
            isLoading={isLoading}
            error={error}
            onRetry={reload}
            skeleton={<ProjectGridSkeleton count={6} />}
            empty={
              <EmptyState
                icon={FolderGit2}
                title="No projects published yet"
                description="Projects added through the portfolio API will appear here."
              />
            }
          >
            {() =>
              filteredProjects.length === 0 ? (
                <EmptyState
                  title="No projects match those filters"
                  description="Try a different keyword, category or technology."
                  action={
                    <button type="button" onClick={clearFilters} className="btn-outline">
                      <X aria-hidden="true" className="size-4" />
                      Clear filters
                    </button>
                  }
                />
              ) : (
                <>
                  <ProjectGrid projects={visibleProjects} />
                  <Pagination
                    pageIndex={page}
                    totalPages={totalPages}
                    onPageChange={(next) => {
                      setPage(next);
                      document.getElementById("project-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  />
                </>
              )
            }
          </DataSection>

          <div id="project-results" />
        </div>
      </section>
    </>
  );
}
