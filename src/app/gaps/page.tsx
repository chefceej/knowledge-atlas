import Link from "next/link";
import { GitBranch, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SkillNodeCard } from "@/components/skill-node-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readGraph, computeGapInsights } from "@/lib/store";

export default async function GapsPage() {
  const graph = await readGraph();
  const gaps = computeGapInsights(graph);

  const unexplored = graph.nodes
    .filter((n) => n.mastery === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Knowledge gaps</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Where should you explore next? Gaps highlight unexplored blocks, uneven
          coverage within a category, and cross-domain bridges waiting to be completed.
        </p>
      </header>

      <section className="mb-10 space-y-4">
        <h2 className="text-lg font-semibold">Insights</h2>
        {gaps.map((gap) => (
          <Card key={gap.id} className="border-zinc-800 bg-zinc-900/30">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                {gap.type === "cross-domain" || gap.type === "bridge-missing" ? (
                  <GitBranch className="size-5 shrink-0 text-amber-400" />
                ) : (
                  <Sparkles className="size-5 shrink-0 text-emerald-400" />
                )}
                <div>
                  <CardTitle className="text-base">{gap.title}</CardTitle>
                  {gap.domainId && (
                    <Badge variant="outline" className="mt-2 border-zinc-700 text-zinc-500">
                      {gap.domainId.replace("-", " ")}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-zinc-400">{gap.description}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {gap.nodeIds.map((nodeId) => {
                  const node = graph.nodes.find((n) => n.id === nodeId);
                  return node ? <SkillNodeCard key={nodeId} node={node} compact /> : null;
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Unexplored blocks ({unexplored.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {unexplored.map((node) => (
            <SkillNodeCard key={node.id} node={node} compact />
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/learn"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
        >
          Start learning something new
        </Link>
        <Link
          href="/quiz"
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Quiz what you know
        </Link>
      </div>
    </AppShell>
  );
}
