import { AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  score: number;
  label: string;
  className?: string;
}

export function SeverityBadge({ score, label, className }: SeverityBadgeProps) {
  let colorClass = "";
  let Icon = Info;
  
  if (score === 0) {
    colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
    Icon = CheckCircle;
  } else if (score <= 2) {
    colorClass = "bg-amber-100 text-amber-800 border-amber-200";
    Icon = Info;
  } else if (score <= 4) {
    colorClass = "bg-orange-100 text-orange-800 border-orange-200";
    Icon = AlertTriangle;
  } else {
    colorClass = "bg-rose-100 text-rose-800 border-rose-200";
    Icon = ShieldAlert;
  }

  return (
    <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border font-medium", colorClass, className)}>
      <Icon className="w-5 h-5" />
      <span className="text-sm font-bold uppercase tracking-wider">
        Score: {score}/5 — {label}
      </span>
    </div>
  );
}
