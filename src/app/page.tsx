import Link from "next/link";
import { ArrowRight, GitBranch, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DomainCard } from "@/components/domain-card";
import { SkillNodeCard } from "@/components/skill-node-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readGraph, getDomainStats, computeGapInsights } from "@/lib/store";
import { masteryPercent } from "@/lib/mastery";

export default async function HomePage() {
  const graph = await readGraph();
  const domainStats = graph.domains.map((d) => getDomainStats(graph, d.id));
  const gaps = computeGapInsights(graph).slice(0, 3);
  const recentEntries = graph.learningEntries.slice(0, 3);

  const totalNodes = graph.nodes.length;
  const avgMastery =
    graph.nodes.reduce((s, n) => s + masteryPercent(n.mastery), 0) / totalNodes;

  return (
    <AppShell>
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Your personal knowledge atlas
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Track what you know across history and hard sciences. Blocks light up
          from gray to green as you learn, quiz, and connect ideas.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
            {Math.round(avgMastery)}% overall illumination
          </Badge>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            {totalNodes} knowledge blocks
          </Badge>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            {graph.learningEntries.length} learning captures
          </Badge>
        </div>
      </section>

      <section className="mb-10 grid gap-4 sm:grid-cols-2">
        {graph.domains.map((domain) => {
          const stats = domainStats.find((s) => s.domainId === domain.id)!;
          return <DomainCard key={domain.id} domain={domain} stats={stats} />;
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/30 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Knowledge gaps</CardTitle>
            <Link
              href="/gaps"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {gaps.length === 0 ? (
              <p className="text-sm text-zinc-500">No gaps detected yet — keep exploring!</p>
            ) : (
              gaps.map((gap) => (
                <div
                  key={gap.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex items-start gap-2">
                    {gap.type === "cross-domain" ? (
                      <GitBranch className="mt-0.5 size-4 shrink-0 text-amber-400" />
                    ) : (
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{gap.title}</p>
                      <p className="mt-1 text-xs text-zinc-400">{gap.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent learning</CardTitle>
            <Link
              href="/learn"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
            >
              Capture <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="border-b border-zinc-800 pb-3 last:border-0">
                <p className="text-sm font-medium">{entry.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{entry.content}</p>
                <p className="mt-1 text-[10px] text-zinc-600">
                  {new Date(entry.timestamp).toLocaleDateString()} · {entry.nodeIds.length}{" "}
                  blocks updated
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Cross-domain bridges</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Nodes that connect history and science — deepen both sides to unlock the full graph.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {graph.nodes
            .filter((n) => n.id === "manhattan-project" || n.linkedNodeIds.length >= 3)
            .slice(0, 6)
            .map((node) => (
              <SkillNodeCard key={node.id} node={node} compact />
            ))}
        </div>
      </section>
    </AppShell>
  );
}
