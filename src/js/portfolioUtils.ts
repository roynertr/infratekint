import { type CollectionEntry, getCollection } from "astro:content";

// utils
import { filterCollectionByLanguage, removeLocaleFromSlug } from "@/js/localeUtils";

// data
import { locales } from "@/config/siteSettings.json";

interface FormatPortfolioOptions {
  filterOutFutureProjects?: boolean;
  sortByDate?: boolean;
  removeLocale?: boolean;
}

export async function getAllPortfolio(
  lang?: (typeof locales)[number],
): Promise<CollectionEntry<"portfolio">[]> {
  const projects = await getCollection("portfolio", ({ data }) => {
    return data.draft !== true;
  });

  const filteredProjects = lang
    ? (filterCollectionByLanguage(projects, lang) as CollectionEntry<"portfolio">[])
    : projects;

  return formatPortfolio(filteredProjects, {
    filterOutFutureProjects: true,
    sortByDate: true,
    removeLocale: true,
  });
}

export function formatPortfolio(
  projects: CollectionEntry<"portfolio">[],
  {
    filterOutFutureProjects = true,
    sortByDate = true,
    removeLocale = true,
  }: FormatPortfolioOptions = {},
): CollectionEntry<"portfolio">[] {
  const filteredProjects = projects.reduce((acc: CollectionEntry<"portfolio">[], project) => {
    const { pubDate } = project.data;

    if (filterOutFutureProjects && new Date(pubDate) > new Date()) return acc;

    acc.push(project);

    return acc;
  }, []);

  if (sortByDate) {
    filteredProjects.sort(
      (a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime(),
    );
  }

  if (removeLocale) {
    filteredProjects.forEach((project) => {
      project.id = removeLocaleFromSlug(project.id);
    });
  }

  return filteredProjects;
}
