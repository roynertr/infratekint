/**
 * * Configuration of the i18n system data files and text translations
 */

/**
 * * Data file configuration for the i18n system
 * Every {Data} key must exist in the below object
 */
import siteDataEn from "./en/siteData.json";
import siteDataEs from "./es/siteData.json";
import navDataEn from "./en/navData.json";
import navDataEs from "./es/navData.json";
import faqDataEn from "./en/faqData.json";
import faqDataEs from "./es/faqData.json";
import teamDataEn from "./en/teamData.json";
import teamDataEs from "./es/teamData.json";
import testimonialDataEn from "./en/testimonialData.json";
import testimonialDataEs from "./es/testimonialData.json";

export const dataTranslations = {
  en: {
    siteData: siteDataEn,
    navData: navDataEn,
    faqData: faqDataEn,
    teamData: teamDataEn,
    testimonialData: testimonialDataEn,
  },
  es: {
    siteData: siteDataEs,
    navData: navDataEs,
    faqData: faqDataEs,
    teamData: teamDataEs,
    testimonialData: testimonialDataEs,
  },
} as const;

/**
 * * Text translations are used with the `useTranslation` function from src/js/i18nUtils.ts to translate various strings on your site.
 */
export const textTranslations = {
  en: {
    hero_text: "Driving digital transformation in the built environment",
    hero_description:
      "Advanced BIM, COBie, digital twins, and reality capture—so your data works as hard as your team.",
    back_to_all_posts: "Back to all posts",
    updated: "Updated",
  },
  es: {
    hero_text: "Transformación digital en el entorno construido",
    hero_description:
      "BIM avanzado, COBie, gemelos digitales y captura de realidad—datos precisos para decisiones mejores.",
    back_to_all_posts: "Volver a todas las entradas",
    updated: "Actualizado",
  },
} as const;

/**
 * * Route translations are used to translate route names for the language switcher component
 */
export const routeTranslations = {
  en: {
    aboutKey: "about",
    categoryKey: "categories",
    categoryKey2: "categories/*",
    categoryKey3: "categories",
    blogKey: "blog",
    servicesKey: "services",
  },
  es: {
    aboutKey: "sobre-nosotros",
    categoryKey: "categories",
    categoryKey2: "categories/*",
    categoryKey3: "categories",
    blogKey: "blog",
    servicesKey: "services",
  },
} as const;

/**
 * * Content collection translations used by the language switcher and hreflang generator
 */
export const localizedCollections = {
  blog: {
    en: "blog",
    es: "blog",
  },
  services: {
    en: "services",
    es: "services",
  },
} as const;
