import { LucideIcon, Globe2, GraduationCap, Building2, Rocket, BookOpen, Brain, Briefcase, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Map the icon NAME string stored on the program (admin picks it in the program
// form) to the actual lucide component. Falls back to Globe2 for unknown/empty.
const ICON_BY_NAME: Record<string, LucideIcon> = {
  Globe2, GraduationCap, Building2, Rocket, BookOpen, Brain, Briefcase, Award,
};

export interface Program {
  id: string | number;
  title: string;
  tagline: string;
  features: string[];
  // The API returns the icon NAME (string). A LucideIcon component is also
  // accepted for callers that pass one directly.
  icon?: LucideIcon | string;
}

interface ProgramCardProps {
  program: Program;
  onView: (program: Program) => void;
  ctaLabel?: string;
  // When true the card is locked: button disabled and card dimmed. Used to
  // restrict students to only the program they were granted/accepted.
  disabled?: boolean;
  disabledLabel?: string;
}

export const programIconByIndex: LucideIcon[] = [Globe2, GraduationCap, Building2];

const ProgramCard = ({ program, onView, ctaLabel = "Start", disabled = false, disabledLabel }: ProgramCardProps) => {
  // icon may be a NAME string (from the API) or a component (direct callers).
  const Icon: LucideIcon =
    typeof program.icon === "string"
      ? (ICON_BY_NAME[program.icon] ?? Globe2)
      : (program.icon ?? Globe2);
  return (
    <div className={`rounded-2xl border-2 border-emerald-200 bg-white p-8 flex flex-col items-center text-center shadow-sm transition-shadow ${disabled ? "opacity-50 grayscale" : "hover:shadow-md"}`}>
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center mb-5">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">{program.title}</h3>
      <p className="text-gray-600 text-sm mb-6 min-h-[3rem]">{program.tagline}</p>

      <ul className="w-full space-y-3 mb-8 text-left">
        {program.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => !disabled && onView(program)}
        disabled={disabled}
        className="mt-auto w-44 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 text-white hover:from-emerald-600 hover:to-emerald-800 border-0 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {disabled ? (disabledLabel ?? "Locked") : ctaLabel}
      </Button>
    </div>
  );
};

export default ProgramCard;
