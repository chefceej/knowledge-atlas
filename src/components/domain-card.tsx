import Link from "next/link";
import { ArrowRight, Atom, Scroll } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Domain, DomainStats } from "@/lib/types";

const iconMap = {
  scroll: Scroll,
  atom: Atom,
};

interface DomainCardProps {
  domain: Domain;
  stats: DomainStats;
}

export function DomainCard({ domain, stats }: DomainCardProps) {
  const Icon = iconMap[domain.icon as keyof typeof iconMap] ?? Scroll;

  return (
    <Link
      href={`/domains/${domain.id}`}
      className="group block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex size-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${domain.color}22`, color: domain.color }}
        >
          <Icon className="size-6" />
        </div>
        <ArrowRight className="size-5 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
      </div>

      <h2 className="mt-4 text-xl font-semibold">{domain.name}</h2>
      <p className="mt-1 text-sm text-zinc-400">{domain.description}</p>

      <div className="mt-5 space-y-2">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{stats.percentComplete}% illuminated</span>
          <span>
            {stats.masteredNodes}/{stats.totalNodes} mastered
          </span>
        </div>
        <Progress value={stats.percentComplete} className="h-2 bg-zinc-800" />
      </div>
    </Link>
  );
}
