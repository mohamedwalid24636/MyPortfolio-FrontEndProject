import { useMemo } from "react";
import { AboutSection } from "@/components/sections/AboutSection";
import { CertificationsSection } from "@/components/sections/CertificationsSection";
import { ContactCTASection } from "@/components/sections/ContactCTASection";
import { EducationSection } from "@/components/sections/EducationSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { FeaturedProjectsSection } from "@/components/sections/FeaturedProjectsSection";
import { HeroSection, type HeroStat } from "@/components/sections/HeroSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { useAllProjects, useFeaturedProjects } from "@/hooks/usePortfolioData";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSiteData } from "@/context/SiteDataContext";

/**
 * Home page is a guided tour, not a database dump: identity → who I am → what I shipped → where I
 * worked → where I studied → what is proven → what I offer → contact. The experience block only
 * appears when the API actually holds an employment record. Technical skills, achievements and
 * writing are deliberately left to the resume and blog pages so the home page stays focused.
 */
export default function HomePage() {
  const { data } = useSiteData();
  const featured = useFeaturedProjects();
  const allProjects = useAllProjects();

  usePageMeta(
    data.profile ? `${data.profile.fullName} | ${data.profile.professionalTitle}` : "Portfolio",
    data.profile?.bio || "Portfolio",
  );

  const showcaseProjects = useMemo(() => {
    if (featured.data && featured.data.length > 0) return featured.data.slice(0, 3);
    return (allProjects.data ?? []).slice(0, 3);
  }, [featured.data, allProjects.data]);

  const projects = useMemo(() => allProjects.data ?? featured.data ?? [], [allProjects.data, featured.data]);

  const stats = useMemo<HeroStat[]>(() => {
    const technologyCount = new Set(
      projects.flatMap((project) => (project.technologies ?? []).map((technology) => technology.id)),
    ).size;

    const years = data.profile?.yearsOfExperience ?? 0;

    return [
      ...(years > 0 ? [{ label: "Years of experience", value: String(years) }] : []),
      { label: "Projects", value: String(projects.length) },
      { label: "Technologies", value: String(technologyCount) },
      { label: "Skills", value: String(data.skills.length) },
    ];
  }, [projects, data.profile?.yearsOfExperience, data.skills.length]);

  /** Most-used technologies across the portfolio — a five-second answer to "what does he use?". */
  const stack = useMemo(() => {
    const counts = new Map<string, number>();

    projects.forEach((project) => {
      (project.technologies ?? []).forEach((technology) => {
        const name = technology.name?.trim();
        if (!name) return;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 6)
      .map(([name]) => name);
  }, [projects]);

  return (
    <>
      <HeroSection stats={stats} stack={stack} />
      <AboutSection />
      <FeaturedProjectsSection
        projects={showcaseProjects}
        isLoading={featured.isLoading || allProjects.isLoading}
        error={featured.error ?? allProjects.error}
        onRetry={() => {
          featured.reload();
          allProjects.reload();
        }}
      />
      <ExperienceSection />
      <EducationSection />
      <CertificationsSection />
      <ServicesSection />
      <ContactCTASection />
    </>
  );
}
