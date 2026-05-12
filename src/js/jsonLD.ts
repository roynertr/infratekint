import { type CollectionEntry } from "astro:content";

// utils
import { getTranslatedData } from "@/js/translationUtils";
import { defaultLocale } from "@/config/siteSettings.json";
import { normalizeImportedExcerpt } from "@/js/textUtils";

// data - defaultLocale siteData for stable org name in schema
const siteData = getTranslatedData("siteData", defaultLocale);

interface GeneralProps {
  type: "general";
}

export interface BlogProps {
  type: "blog";
  postFrontmatter: CollectionEntry<"blog">["data"];
  image: ImageMetadata; // result of getImage() from Seo.astro
  authors: CollectionEntry<"authors">[];
  canonicalUrl: URL;
}

export type JsonLDProps = BlogProps | GeneralProps;

const siteUrl = (import.meta.env.SITE as string | undefined) || "https://infratekint.com";

export default function jsonLDGenerator(props: JsonLDProps) {
  const { type } = props;
  if (type === "blog") {
    const { postFrontmatter, image, authors, canonicalUrl } = props as BlogProps;

    const authorsJsonLdArray = authors.map((author) => {
      return {
        "@type": "Person",
        name: author.data.name,
        url: author.data.authorLink,
      };
    });

    let authorsJsonLd;

    if (authorsJsonLdArray.length === 1) {
      authorsJsonLd = authorsJsonLdArray[0];
    } else {
      authorsJsonLd = authorsJsonLdArray;
    }

    const toIso = (d: Date | string) => (d instanceof Date ? d.toISOString() : String(d));
    const datePublished = toIso(postFrontmatter.pubDate);
    const dateModified = postFrontmatter.updatedDate
      ? toIso(postFrontmatter.updatedDate)
      : datePublished;

    return `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl.toString(),
      },
      headline: postFrontmatter.title,
      description: normalizeImportedExcerpt(postFrontmatter.description),
      image: image.src,
      author: authorsJsonLd,
      datePublished,
      dateModified,
    })}</script>`;
  }

  const graph = [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: siteData.name,
      url: siteUrl,
      description: siteData.description,
    },
    {
      "@type": "ProfessionalService",
      "@id": `${siteUrl}/#organization`,
      name: siteData.name,
      url: siteUrl,
      email: siteData.contact.email,
      telephone: siteData.contact.phone,
      description: siteData.description,
      areaServed: ["US", "DO"],
    },
  ];

  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  })}</script>`;
}
