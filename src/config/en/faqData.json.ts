import { type FaqItem } from "../types/configDataTypes";

export const faqData: FaqItem[] = [
  {
    question: "What BIM services do you provide?",
    answer:
      "We support modeling standards, coordination, clash workflows, and documentation tied to your BIM execution plan—scaled to your project size and maturity.",
  },
  {
    question: "How does COBie fit into handover?",
    answer:
      "COBie structures facility data so owners and operators receive consistent attributes—not ad-hoc spreadsheets. We help define requirements, map data, and validate before handover.",
  },
  {
    question: "Can you build custom tools around IFC or our CDE?",
    answer:
      "Yes. We combine domain knowledge with software development to deliver viewers, integrations, and workflows that match how your teams actually work.",
  },
  {
    question: "Do you work with international projects?",
    answer:
      "We collaborate with firms across regions and align deliverables to your standards, tooling, and review cycles—remote-first where it helps the schedule.",
  },
];

export default faqData;
