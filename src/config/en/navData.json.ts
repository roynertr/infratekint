/**
 * InfraTek — main navigation (English)
 */

import { type navItem } from "../types/configDataTypes";

const navConfig: navItem[] = [
  { text: "Home", link: "/" },
  { text: "About", link: "/about" },
  {
    text: "Services",
    dropdown: [
      { text: "BIM Services", link: "/services/bim-services" },
      { text: "COBie Consultancy", link: "/services/cobie-consultancy" },
      { text: "Digital Twins & Software", link: "/services/digital-twins-software" },
      { text: "Reality Capture", link: "/services/reality-capture" },
    ],
  },
  { text: "Portfolio", link: "/portfolio" },
  { text: "Blog", link: "/blog" },
  { text: "Contact", link: "/contact" },
];

export default navConfig;
