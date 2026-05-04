import { Globe2, GraduationCap, Building2 } from "lucide-react";
import type { Program } from "./ProgramCard";

export const programs: Program[] = [
  {
    id: "ai-frontier",
    title: "AI Frontier Program",
    tagline: "Kickstart your AI career with industry-ready knowledge in neural networks and deep learning.",
    icon: Globe2,
    features: [
      "AI expert devised curriculum",
      "Live program delivered by industry experts",
      "Project-based learning approach",
      "Continuous mentor guidance",
      "6 months virtual comprehensive program",
    ],
  },
  {
    id: "ai-frontier-plus",
    title: "AI Frontier Plus Program",
    tagline: "Hybrid learning with corporate experience component",
    icon: GraduationCap,
    features: [
      "All the benefits of AI Frontier Program",
      "2 months of hands-on corporate experience",
      "Personalized guidance with industry experts",
      "Fast-track your career with advanced skills",
    ],
  },
  {
    id: "elite-ai-residency",
    title: "Elite AI Residency",
    tagline: "Full-time corporate experience for advanced learners",
    icon: Building2,
    features: [
      "All the benefits of AI Frontier Program",
      "6 months on-site corporate engagement",
      "Full time real project responsibilities",
      "Work alongside corporate employees",
      "Fast paced learning experience",
    ],
  },
];
