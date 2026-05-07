import { LucideIcon, Globe2, GraduationCap, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Program {
  id: string | number;
  title: string;
  tagline: string;
  features: string[];
  icon?: LucideIcon;
}

interface ProgramCardProps {
  program: Program;
  onView: (program: Program) => void;
  ctaLabel?: string;
}

export const programIconByIndex: LucideIcon[] = [Globe2, GraduationCap, Building2];

const ProgramCard = ({ program, onView, ctaLabel = "Start" }: ProgramCardProps) => {
  const Icon = program.icon ?? Globe2;
  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-white p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
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
        onClick={() => onView(program)}
        className="mt-auto w-44 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 text-white hover:from-emerald-600 hover:to-emerald-800 border-0"
      >
        {ctaLabel}
      </Button>
    </div>
  );
};

export default ProgramCard;
