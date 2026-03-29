import { type TestimonialItem } from "../types/configDataTypes";

import BowTiedFocus from "@images/BowTiedFocus.jpg";
import TravisB from "@images/travis-b.png";
import David from "@images/david-g-davedev.png";

export const testimonialData: TestimonialItem[] = [
  {
    avatar: BowTiedFocus,
    name: "AEC Program Lead",
    title: "North America",
    testimonial:
      "InfraTek helped us move from drawings-only coordination to a disciplined BIM rhythm—fewer surprises on site and cleaner handover data.",
  },
  {
    avatar: David,
    name: "Digital Delivery Manager",
    title: "Infrastructure",
    testimonial:
      "Practical, not theoretical. They spoke our language—CDE, IFC, COBie—and shipped workflows our teams could sustain.",
  },
  {
    avatar: TravisB,
    name: "Head of VDC",
    title: "Commercial",
    testimonial:
      "Strong partner for owners who need model quality and structured data without adding bureaucracy to the project.",
  },
];

export default testimonialData;
