import type { MasteryLevel } from "./types";

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  0: "Unexplored",
  1: "Aware",
  2: "Familiar",
  3: "Competent",
  4: "Proficient",
  5: "Mastered",
};

export function masteryPercent(level: MasteryLevel): number {
  return (level / 5) * 100;
}

export function masteryColor(level: MasteryLevel): string {
  switch (level) {
    case 0:
      return "bg-zinc-700/80 border-zinc-600 text-zinc-400";
    case 1:
      return "bg-zinc-600/80 border-zinc-500 text-zinc-300";
    case 2:
      return "bg-emerald-950/80 border-emerald-800 text-emerald-300";
    case 3:
      return "bg-emerald-900/80 border-emerald-700 text-emerald-200";
    case 4:
      return "bg-emerald-800/80 border-emerald-600 text-emerald-100";
    case 5:
      return "bg-emerald-600/90 border-emerald-400 text-white shadow-[0_0_20px_rgba(52,211,153,0.35)]";
    default:
      return "bg-zinc-700/80 border-zinc-600 text-zinc-400";
  }
}

export function masteryGlow(level: MasteryLevel): string {
  if (level >= 5) return "ring-2 ring-emerald-400/50";
  if (level >= 3) return "ring-1 ring-emerald-700/40";
  return "";
}

export function bumpMastery(current: MasteryLevel, amount = 1): MasteryLevel {
  return Math.min(5, current + amount) as MasteryLevel;
}
