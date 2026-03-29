import { type TestimonialItem } from "../types/configDataTypes";

import BowTiedFocus from "@images/BowTiedFocus.jpg";
import TravisB from "@images/travis-b.png";
import David from "@images/david-g-davedev.png";

export const testimonialData: TestimonialItem[] = [
  {
    avatar: BowTiedFocus,
    name: "Líder de programa AEC",
    title: "Norteamérica",
    testimonial:
      "InfraTek nos ayudó a pasar de coordinación solo en planos a un ritmo BIM disciplinado—menos sorpresas en obra y datos de entrega más claros.",
  },
  {
    avatar: David,
    name: "Gestor de entrega digital",
    title: "Infraestructura",
    testimonial:
      "Prácticos, no teóricos. Hablaron nuestro idioma—CDE, IFC, COBie—y dejaron flujos que el equipo pudo mantener.",
  },
  {
    avatar: TravisB,
    name: "Director VDC",
    title: "Comercial",
    testimonial:
      "Un socio sólido cuando se necesita calidad de modelo y datos estructurados sin sumar burocracia al proyecto.",
  },
];

export default testimonialData;
