import { useMemo } from "react";
import { AchievementsSection } from "@/components/sections/AchievementsSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactCTASection } from "@/components/sections/ContactCTASection";
import { EducationSection } from "@/components/sections/EducationSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { FeaturedProjectsSection } from "@/components/sections/FeaturedProjectsSection";
import { HeroSection, type HeroStat } from "@/components/sections/HeroSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { useAllProjects, useFeaturedProjects } from "@/hooks/usePortfolioData";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSiteData } from "@/context/SiteDataContext";

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

  const stats = useMemo<HeroStat[]>(() => {
    const projects = allProjects.data ?? featured.data ?? [];
    const technologyCount = new Set(
      projects.flatMap((project) => (project.technologies ?? []).map((technology) => technology.id)),
    ).size;

    return [
      { label: "Projects", value: String(projects.length) },
      { label: "Technologies", value: String(technologyCount) },
      { label: "Skills tracked", value: String(data.skills.length) },
    ];
  }, [allProjects.data, featured.data, data.skills.length]);

  return (
    <>
      <HeroSection stats={stats} />
      <AboutSection />
      <ServicesSection />
      <SkillsSection />
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
      <AchievementsSection />
      <ContactCTASection />
    </>
  );
}
