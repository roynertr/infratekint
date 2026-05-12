import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";

const homeMarqueeCollection = defineCollection({
  loader: glob({ pattern: "**/index.yaml", base: "./src/data/home-marquee" }),
  schema: ({ image }) =>
    z.object({
      name: z.string().optional(),
      slug: z.string(),
      imageBim: image(),
      imageCobie: image(),
      imageDigital: image(),
    }),
});

const homeTrustedByCollection = defineCollection({
  loader: glob({ pattern: "**/index.yaml", base: "./src/data/home-trusted-by" }),
  schema: () =>
    z.object({
      name: z.string().optional(),
      slug: z.string(),
      eyebrowEn: z.string(),
      titleEn: z.string(),
      summaryEn: z.string(),
      eyebrowEs: z.string(),
      titleEs: z.string(),
      summaryEs: z.string(),
    }),
});

const clientLogosCollection = defineCollection({
  loader: glob({ pattern: "**/index.yaml", base: "./src/data/client-logos" }),
  schema: ({ image }) =>
    z.object({
      name: z.string().optional(),
      slug: z.string(),
      alt: z.string(),
      logo: image(),
      order: z.number(),
      draft: z.boolean().optional(),
    }),
});

// Type-check frontmatter using a schema
const blogCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*{md,mdx}", base: "./src/data/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // reference the authors collection https://docs.astro.build/en/guides/content-collections/#defining-collection-references
      authors: z.array(reference("authors")),
      // Transform string to Date object
      pubDate: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
      updatedDate: z
        .string()
        .or(z.date())
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
      heroImage: image(),
      categories: z.array(z.string()),
      // mappingKey allows you to match entries across languages for SEO purposes
      mappingKey: z.string().optional(),
      // blog posts will be excluded from build if draft is "true"
      draft: z.boolean().optional(),
    }),
});

// authors
const authorsCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*{md,mdx}", base: "./src/data/authors" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      avatar: image(),
      about: z.string(),
      email: z.string(),
      authorLink: z.string(), // author page link. Could be a personal website, github, twitter, whatever you want
    }),
});

// services
const servicesCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*{md,mdx}", base: "./src/data/services" }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      image: z.string(),
      /** Optional darker hero for `class="dark"` (e.g. COBie dashboard night variant). */
      imageDark: z.string().optional(),
      heroAlt: z.string(),
      sourceId: z.number(),
      sourceUrl: z.string().url(),
      order: z.number(),
      features: z.array(z.string()),
      cta: z.object({
        label: z.string(),
        href: z.string(),
      }),
      seoTitle: z.string().optional(),
      // mappingKey allows you to match entries across languages for SEO purposes
      mappingKey: z.string().optional(),
      // services will be excluded from build if draft is "true"
      draft: z.boolean().optional(),
    }),
});

// portfolio
const portfolioCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*{md,mdx}", base: "./src/data/portfolio" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
      heroImage: image().optional(),
      categories: z.array(z.coerce.string()).default([]),
      tags: z.array(z.coerce.string()).default([]),
      sourceId: z.number().optional(),
      sourceUrl: z.string().url().optional(),
      mappingKey: z.string().optional(),
      draft: z.boolean().optional(),
    }),
});

// other pages
const otherPagesCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*{md,mdx}", base: "./src/data/otherPages" }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      // mappingKey allows you to match entries across languages for SEO purposes
      mappingKey: z.string().optional(),
      draft: z.boolean().optional(),
    }),
});

export const collections = {
  blog: blogCollection,
  authors: authorsCollection,
  services: servicesCollection,
  portfolio: portfolioCollection,
  otherPages: otherPagesCollection,
  homeMarquee: homeMarqueeCollection,
  homeTrustedBy: homeTrustedByCollection,
  clientLogos: clientLogosCollection,
};
