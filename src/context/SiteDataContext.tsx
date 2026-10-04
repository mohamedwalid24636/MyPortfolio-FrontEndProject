import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ApiError } from "@/lib/apiClient";
import { useAsync, type AsyncState } from "@/hooks/useAsync";
import {
  achievementService,
  certificationService,
  educationService,
  experienceService,
  profileService,
  resumeService,
  serviceService,
  skillService,
  socialLinkService,
  typeService,
  type ReadService,
} from "@/services";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { useDataVersion } from "@/context/DataVersionContext";
import type {
  AchievementDto,
  CertificationDto,
  EducationDto,
  ExperienceDto,
  ProfileDto,
  ResumeDto,
  ServiceDto,
  SkillDto,
  SocialLinkDto,
  TypeDto,
} from "@/types/api";

export interface SiteData {
  profile: ProfileDto | null;
  socialLinks: SocialLinkDto[];
  services: ServiceDto[];
  skills: SkillDto[];
  types: TypeDto[];
  experiences: ExperienceDto[];
  educations: EducationDto[];
  certifications: CertificationDto[];
  achievements: AchievementDto[];
  activeResume: ResumeDto | null;
}

interface SiteDataContextValue extends Omit<AsyncState<SiteData>, "data"> {
  /** Always populated — falls back to an empty bundle while loading or on failure. */
  data: SiteData;
  /** Labels of endpoints that failed — surfaced as a non-blocking notice. */
  failedSources: string[];
}

const EMPTY_SITE_DATA: SiteData = {
  profile: null,
  socialLinks: [],
  services: [],
  skills: [],
  types: [],
  experiences: [],
  educations: [],
  certifications: [],
  achievements: [],
  activeResume: null,
};

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Fetches one collection, degrading to an empty result if that endpoint fails.
 * A single failing endpoint must never take the whole page down.
 */
async function safeList<T>(
  service: ReadService<T>,
  signal: AbortSignal,
  failedSources: string[],
  label: string,
): Promise<T[]> {
  try {
    return (await service.listAll({ pageSize: MAX_PAGE_SIZE }, signal)) ?? [];
  } catch (error) {
    if (isAbort(error)) throw error;
    failedSources.push(label);
    return [];
  }
}

async function safeFirst<T>(
  service: ReadService<T>,
  signal: AbortSignal,
  failedSources: string[],
  label: string,
): Promise<T | null> {
  try {
    const result = await service.list({ pageSize: 1 }, signal);
    return result?.data?.[0] ?? null;
  } catch (error) {
    if (isAbort(error)) throw error;
    failedSources.push(label);
    return null;
  }
}

async function loadSiteData(signal: AbortSignal): Promise<{ data: SiteData; failedSources: string[] }> {
  const failedSources: string[] = [];

  const [profile, socialLinks, services, skills, types, experiences, educations, certifications, achievements, activeResume] =
    await Promise.all([
      safeFirst(profileService, signal, failedSources, "Profile"),
      safeList(socialLinkService, signal, failedSources, "Social links"),
      safeList(serviceService, signal, failedSources, "Services"),
      safeList(skillService, signal, failedSources, "Skills"),
      safeList(typeService, signal, failedSources, "Skill types"),
      safeList(experienceService, signal, failedSources, "Experience"),
      safeList(educationService, signal, failedSources, "Education"),
      safeList(certificationService, signal, failedSources, "Certifications"),
      safeList(achievementService, signal, failedSources, "Achievements"),
      resumeService.active(signal).catch((error: unknown) => {
        if (isAbort(error)) throw error;
        if (!(error instanceof ApiError) || !error.isNotFound) throw error;
        return null;
      }),
    ]);

  return {
    data: {
      profile,
      socialLinks,
      services,
      skills,
      types,
      experiences,
      educations,
      certifications,
      achievements,
      activeResume,
    },
    failedSources,
  };
}

/**
 * Everything the public portfolio shows, read straight from the API.
 *
 * `version` is a dependency, so any admin write re-runs the whole bundle and the public site shows
 * the new backend state without a reload.
 */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const { version } = useDataVersion();
  const { data, error, isLoading, reload } = useAsync(loadSiteData, [version]);

  const value = useMemo<SiteDataContextValue>(
    () => ({
      data: data?.data ?? EMPTY_SITE_DATA,
      failedSources: data?.failedSources ?? [],
      error,
      isLoading,
      reload,
    }),
    [data, error, isLoading, reload],
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData(): SiteDataContextValue {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error("useSiteData must be used within a <SiteDataProvider>.");
  }
  return context;
}