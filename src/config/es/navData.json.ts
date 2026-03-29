/**
 * InfraTek — navegación principal (Español)
 */

import { type navItem } from "../types/configDataTypes";

const navConfig: navItem[] = [
  { text: "Inicio", link: "/" },
  { text: "Nosotros", link: "/sobre-nosotros" },
  {
    text: "Servicios",
    dropdown: [
      { text: "Servicios BIM", link: "/services/bim-services" },
      { text: "Consultoría COBie", link: "/services/cobie-consultancy" },
      { text: "Gemelos digitales y software", link: "/services/digital-twins-software" },
      { text: "Captura de realidad", link: "/services/reality-capture" },
    ],
  },
  { text: "Portafolio", link: "/portfolio" },
  { text: "Blog", link: "/blog" },
  { text: "Contacto", link: "/contact" },
];

export default navConfig;
