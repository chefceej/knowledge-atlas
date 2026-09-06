import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { masteryColor, masteryGlow, MASTERY_LABELS } from "@/lib/mastery";
import type { KnowledgeNode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SkillNodeCardProps {
  node: KnowledgeNode;
  compact?: boolean;
}

export function SkillNodeCard({ node, compact }: SkillNodeCardProps) {
  return (
    <Link
      href={`/nodes/${node.id}`}
      className={cn(
        "group relative flex flex-col rounded-xl border p-3 transition-all hover:scale-[1.02] hover:shadow-lg",
        masteryColor(node.mastery),
        masteryGlow(node.mastery),
        compact ? "min-h-[72px]" : "min-h-[96px]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{node.name}</p>
        <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
      </div>
      {!compact && (
        <p className="mt-1 line-clamp-2 text-[11px] opacity-70">{node.description}</p>
      )}
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-[10px] uppercase tracking-wider opacity-60">
          {MASTERY_LABELS[node.mastery]}
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "size-1.5 rounded-full",
                i < node.mastery ? "bg-emerald-400" : "bg-zinc-600/80",
              )}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}
