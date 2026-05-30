/**
 * * Keystatic Collection definitions that can take in languages and return the correct content
 * This makes it much cleaner to work with content in different languages
 */

import {
  collection,
  fields,
  // singleton,
} from "@keystatic/core";

// components
import ComponentBlocks from "@components/KeystaticComponents/ComponentBlocks";

// utils
import { locales } from "@config/siteSettings.json";

/**
 * * Blog posts collection
 * This gets used by Astro Content Collections, so if you update this, you'll need to update the Astro Content Collections schema
 */
const Blog = (locale: (typeof locales)[number]) =>
  collection({
    label: `Blog (${locale.toUpperCase()})`,
    slugField: "title",
    path: `src/data/blog/${locale}/*/`,
    columns: ["title", "pubDate"],
    entryLayout: "content",
    format: { contentField: "content" },
    schema: {
      title: fields.slug({
        name: { label: "Title" },
        slug: {
          label: "SEO-friendly slug",
          description: "Never change the slug once a file is published!",
        },
      }),
      description: fields.text({
        label: "Description",
        validation: { isRequired: true, length: { min: 1, max: 160 } },
      }),
      draft: fields.checkbox({
        label: "Draft",
        description: "Set this post as draft to prevent it from being published.",
      }),

      authors: fields.array(
        fields.relationship({
          label: "Post author",
          collection: `authors`,
          // authors field in keystatic.config.tsx must match the collection name here (like "authorsEN" or "authorsFR")
          // collection: `authors${locale.toUpperCase()}`,
        }),
        {
          label: "Authors",
          validation: { length: { min: 1 } },
          itemLabel: (props) => props.value || "Please select an author",
        },
      ),
      pubDate: fields.date({ label: "Publish Date" }),
      updatedDate: fields.date({
        label: "Updated Date",
        description: "If you update this post at a later date, put that date here.",
      }),
      mappingKey: fields.text({
        label: "Mapping Key",
        description: "This is used to map entries between languages.",
      }),
      heroImage: fields.image({
        label: "Hero Image",
        publicPath: "../",
        description:
          "Optional. If omitted, the public portfolio uses a branded INFRATEK placeholder.",
      }),
      categories: fields.array(fields.text({ label: "Category" }), {
        label: "Categories",
        description: "This is NOT case sensitive.",
        itemLabel: (props) => props.value,
        validation: { length: { min: 1 } },
      }),
      content: fields.mdx({
        label: "Content",
        options: {
          bold: true,
          italic: true,
          strikethrough: true,
          code: true,
          heading: [2, 3, 4, 5, 6],
          blockquote: true,
          orderedList: true,
          unorderedList: true,
          table: true,
          link: true,
          image: {
            directory: `src/data/blog/${locale}/`,
            publicPath: "../",
            // schema: {
            //   title: fields.text({
            //     label: "Caption",
            //     description:
            //       "The text to display under the image in a caption.",
            //   }),
            // },
          },
          divider: true,
          codeBlock: true,
        },
        components: {
          Admonition: ComponentBlocks.Admonition,
        },
      }),
    },
  });

/**
 * * Authors collection
 * This gets used by Astro Content Collections, so if you update this, you'll need to update the Astro Content Collections schema
 */
const Authors = (locale: (typeof locales)[number] | "") =>
  collection({
    label: `Authors ${locale === "" ? "" : `(${locale.toUpperCase()})`} `,
    slugField: "name",
    path: `src/data/authors/${locale}/*/`,
    columns: ["name"],
    entryLayout: "content",
    format: { contentField: "bio" },
    schema: {
      name: fields.slug({
        name: {
          label: "Name",
          validation: {
            isRequired: true,
          },
        },
        slug: {
          label: "SEO-friendly slug",
          description: "Never change the slug once this file is published!",
        },
      }),
      avatar: fields.image({
        label: "Author avatar",
        publicPath: "../",
        validation: { isRequired: true },
      }),
      about: fields.text({
        label: "About",
        description: "A short bio about the author",
        validation: { isRequired: true },
      }),
      email: fields.text({
        label: "The author's email",
        description: "This must look something like `you@email.com`",
        validation: { isRequired: true },
      }),
      authorLink: fields.url({
        label: "Author Website or Social Media Link",
        validation: { isRequired: true },
      }),
      bio: fields.mdx({
        label: "Full Bio",
        description: "The author's full bio",
        options: {
          bold: true,
          italic: true,
          strikethrough: true,
          code: true,
          heading: [2, 3, 4],
          blockquote: true,
          orderedList: true,
          unorderedList: true,
          table: false,
          link: true,
          image: {
            directory: "src/data/authors/",
            publicPath: "../",
          },
          divider: true,
          codeBlock: false,
        },
      }),
    },
  });

/**
 * * Services collection
 * This gets used by Astro Content Collections, so if you update this, you'll need to update the Astro Content Collections schema
 */
const Services = (locale: (typeof locales)[number]) =>
  collection({
    label: `Services (${locale.toUpperCase()})`,
    slugField: "title",
    path: `src/data/services/${locale}/*/`,
    columns: ["title"],
    entryLayout: "content",
    format: { contentField: "content" },
    schema: {
      title: fields.slug({
        name: { label: "Title" },
        slug: {
          label: "SEO-friendly slug",
          description: "Never change the slug once a file is published!",
        },
      }),
      description: fields.text({
        label: "Description",
        validation: { isRequired: true, length: { min: 1, max: 160 } },
      }),
      image: fields.image({
        label: "Main Image",
        publicPath: "../",
        validation: { isRequired: true },
      }),
      draft: fields.checkbox({
        label: "Draft",
        description: "Set this page as draft to prevent it from being published.",
      }),
      mappingKey: fields.text({
        label: "Mapping Key",
        description: "This is used to map entries between languages.",
      }),
      content: fields.mdx({
        label: "Page Contents",
        options: {
          bold: true,
          italic: true,
          strikethrough: true,
          code: false,
          heading: [2, 3, 4],
          blockquote: true,
          orderedList: true,
          unorderedList: true,
          table: true,
          link: true,
          image: {
            directory: `src/data/services/${locale}/`,
            publicPath: "../",
          },
          divider: true,
          codeBlock: false,
        },
        // components: {
        //   Admonition: ComponentBlocks.Admonition,
        // },
      }),
    },
  });

/**
 * * Portfolio / case studies collection
 * This gets used by Astro Content Collections, so if you update this, you'll need to update the Astro Content Collections schema
 */
const Portfolio = (locale: (typeof locales)[number]) =>
  collection({
    label: `Portfolio (${locale.toUpperCase()})`,
    slugField: "title",
    path: `src/data/portfolio/${locale}/*/`,
    columns: ["title", "pubDate"],
    entryLayout: "content",
    format: { contentField: "content" },
    schema: {
      title: fields.slug({
        name: { label: "Title" },
        slug: {
          label: "SEO-friendly slug",
          description: "Never change the slug once a project is published!",
        },
      }),
      description: fields.text({
        label: "Description",
        validation: { isRequired: true, length: { min: 1, max: 300 } },
      }),
      draft: fields.checkbox({
        label: "Draft",
        description: "Hide this project from the public portfolio until unchecked.",
      }),
      pubDate: fields.date({ label: "Publish Date" }),
      heroImage: fields.image({
        label: "Hero Image",
        publicPath: "../",
        validation: { isRequired: true },
      }),
      categories: fields.array(fields.text({ label: "Category" }), {
        label: "Categories",
        description: "Optional filters on the portfolio index.",
        itemLabel: (props) => props.value || "Category",
      }),
      tags: fields.array(fields.text({ label: "Tag" }), {
        label: "Tags",
        itemLabel: (props) => props.value || "Tag",
      }),
      sourceId: fields.integer({
        label: "Source ID",
        description:
          "Legacy ID from the original CMS if migrated. Use 0 for new INFRATEK-only case studies.",
      }),
      sourceUrl: fields.url({
        label: "Source URL",
        description:
          "Public URL for “original source” / reference (e.g. archived case study or live page).",
      }),
      mappingKey: fields.text({
        label: "Mapping Key",
        description: "Same key on EN and ES entries links them for SEO / alternates.",
      }),
      content: fields.mdx({
        label: "Project narrative",
        description:
          "Full case study body. Use headings, lists, and links (e.g. to Contact) like blog posts.",
        options: {
          bold: true,
          italic: true,
          strikethrough: true,
          code: true,
          heading: [2, 3, 4, 5, 6],
          blockquote: true,
          orderedList: true,
          unorderedList: true,
          table: true,
          link: true,
          image: {
            directory: `src/data/portfolio/${locale}/`,
            publicPath: "../",
          },
          divider: true,
          codeBlock: true,
        },
        components: {
          Admonition: ComponentBlocks.Admonition,
        },
      }),
    },
  });

/**
 * * Other Pages collection
 * For items like legal pages, about pages, etc.
 * This gets used by Astro Content Collections, so if you update this, you'll need to update the Astro Content Collections schema
 */
/**
 * Home page marquee gallery (three images, duplicated in rows by the component).
 * Edit in Keystatic under “Home — Marquee gallery”.
 */
const HomeMarquee = () =>
  collection({
    label: "Home — Marquee gallery",
    slugField: "slug",
    path: "src/data/home-marquee/*/",
    columns: ["slug"],
    format: { data: "yaml" },
    schema: {
      // Flat name + slug match src/data/**/index.yaml and Astro content.config.ts;
      // fields.slug() would nest under `slug:` in YAML and broke this entry in the CMS.
      name: fields.text({
        label: "Entry name",
        validation: { isRequired: true },
      }),
      slug: fields.text({
        label: "Slug",
        description: "Keep this as home-marquee — single entry for the home page strip.",
        validation: { isRequired: true },
      }),
      // Keep images under src/data so Astro `image()` resolves them; publicPath must not
      // point at `public/` or YAML gets broken paths and the home marquee shows old assets.
      imageBim: fields.image({
        label: "Image 1 — BIM / coordination",
        directory: "src/data/home-marquee/images",
        publicPath: "../images/",
        validation: { isRequired: true },
      }),
      imageCobie: fields.image({
        label: "Image 2 — COBie / data",
        directory: "src/data/home-marquee/images",
        publicPath: "../images/",
        validation: { isRequired: true },
      }),
      imageDigital: fields.image({
        label: "Image 3 — Digital delivery",
        directory: "src/data/home-marquee/images",
        publicPath: "../images/",
        validation: { isRequired: true },
      }),
      imageDigitalTwin: fields.image({
        label: "Image 4 — Digital twin / BIM model",
        directory: "src/data/home-marquee/images",
        publicPath: "../images/",
        validation: { isRequired: true },
      }),
      imageProjectDelivery: fields.image({
        label: "Image 5 — Project delivery dashboard",
        directory: "src/data/home-marquee/images",
        publicPath: "../images/",
        validation: { isRequired: true },
      }),
      imageDataIntegration: fields.image({
        label: "Image 6 — Data integration",
        directory: "src/data/home-marquee/images",
        publicPath: "../images/",
        validation: { isRequired: true },
      }),
    },
  });

/**
 * Home — Trusted by: eyebrow, title, and summary for EN / ES (single entry).
 */
const HomeTrustedBy = () =>
  collection({
    label: "Home — Trusted by (copy)",
    slugField: "slug",
    path: "src/data/home-trusted-by/*/",
    columns: ["slug"],
    format: { data: "yaml" },
    schema: {
      name: fields.text({
        label: "Entry name",
        validation: { isRequired: true },
      }),
      slug: fields.text({
        label: "Slug",
        description: "Keep as home-trusted-by — one entry for this section.",
        validation: { isRequired: true },
      }),
      eyebrowEn: fields.text({
        label: "Eyebrow (English)",
        validation: { isRequired: true },
      }),
      titleEn: fields.text({
        label: "Title (English)",
        validation: { isRequired: true },
      }),
      summaryEn: fields.text({
        label: "Summary (English)",
        multiline: true,
        validation: { isRequired: true },
      }),
      eyebrowEs: fields.text({
        label: "Eyebrow (Spanish)",
        validation: { isRequired: true },
      }),
      titleEs: fields.text({
        label: "Title (Spanish)",
        validation: { isRequired: true },
      }),
      summaryEs: fields.text({
        label: "Summary (Spanish)",
        multiline: true,
        validation: { isRequired: true },
      }),
    },
  });

/**
 * Home — Client logos: one entry per brand; order controls display sequence.
 */
const ClientLogos = () =>
  collection({
    label: "Home — Client logos",
    slugField: "slug",
    path: "src/data/client-logos/*/",
    columns: ["slug", "order"],
    format: { data: "yaml" },
    schema: {
      name: fields.text({
        label: "Brand name",
        validation: { isRequired: true },
      }),
      slug: fields.text({
        label: "Folder slug",
        description: "Short ID for this entry (folder name). Do not change after publish if possible.",
        validation: { isRequired: true },
      }),
      alt: fields.text({
        label: "Image alt text",
        description: "Accessibility, e.g. Fenwal logo",
        validation: { isRequired: true },
      }),
      logo: fields.image({
        label: "Logo image",
        description: "PNG or SVG with clear space; original colors preferred.",
        publicPath: "../",
        validation: { isRequired: true },
      }),
      order: fields.integer({
        label: "Sort order",
        description: "Lower numbers appear first (e.g. 10, 20, 30).",
        validation: { isRequired: true },
      }),
      draft: fields.checkbox({
        label: "Draft",
        description: "When checked, this logo is hidden on the home page.",
      }),
    },
  });

const OtherPages = (locale: (typeof locales)[number]) =>
  collection({
    label: `Other Pages (${locale.toUpperCase()})`,
    slugField: "title",
    path: `src/data/otherPages/${locale}/*/`,
    columns: ["title"],
    entryLayout: "content",
    format: { contentField: "content" },
    schema: {
      title: fields.slug({
        name: { label: "Title" },
        slug: {
          label: "SEO-friendly slug",
          description: "Never change the slug once a file is published!",
        },
      }),
      description: fields.text({
        label: "Description",
        validation: { isRequired: true, length: { min: 1, max: 160 } },
      }),
      draft: fields.checkbox({
        label: "Draft",
        description: "Set this page as draft to prevent it from being published.",
      }),
      mappingKey: fields.text({
        label: "Mapping Key",
        description: "This is used to map entries between languages.",
      }),
      content: fields.mdx({
        label: "Page Contents",
        options: {
          bold: true,
          italic: true,
          strikethrough: true,
          code: true,
          heading: [2, 3, 4, 5, 6],
          blockquote: true,
          orderedList: true,
          unorderedList: true,
          table: true,
          link: true,
          image: {
            directory: `src/data/otherPages/${locale}/`,
            publicPath: "../",
          },
          divider: true,
          codeBlock: true,
        },
        components: {
          Admonition: ComponentBlocks.Admonition,
        },
      }),
    },
  });

export default {
  Blog,
  Authors,
  Services,
  Portfolio,
  OtherPages,
  HomeMarquee,
  HomeTrustedBy,
  ClientLogos,
};
