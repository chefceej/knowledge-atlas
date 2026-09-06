import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SkillNodeCard } from "@/components/skill-node-card";
import { Progress } from "@/components/ui/progress";
import { readGraph, getDomainStats } from "@/lib/store";

export default async function DomainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const graph = await readGraph();
  const domain = graph.domains.find((d) => d.id === id);
  if (!domain) notFound();

  const stats = getDomainStats(graph, id);
  const categories = graph.categories.filter((c) => c.domainId === id);

  return (
    <AppShell>
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" /> Back to atlas
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: domain.color }}>
          {domain.name}
        </h1>
        <p className="mt-2 text-zinc-400">{domain.description}</p>
        <div className="mt-4 max-w-md space-y-2">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{stats.percentComplete}% illuminated</span>
            <span>
              {stats.masteredNodes}/{stats.totalNodes} mastered
            </span>
          </div>
          <Progress value={stats.percentComplete} className="h-2 bg-zinc-800" />
        </div>
      </header>

      <div className="space-y-10">
        {categories.map((category) => {
          const nodes = graph.nodes.filter((n) => n.categoryId === category.id);
          const catProgress = Math.round(
            nodes.reduce((s, n) => s + (n.mastery / 5) * 100, 0) / (nodes.length || 1),
          );

          return (
            <section key={category.id}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold">{category.name}</h2>
                  <p className="text-sm text-zinc-500">{category.description}</p>
                </div>
                <span className="text-xs text-zinc-600">{catProgress}% · {nodes.length} blocks</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {nodes.map((node) => (
                  <SkillNodeCard key={node.id} node={node} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/quiz?domain=${id}`}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
        >
          Quiz this domain
        </Link>
        <Link
          href="/learn"
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Capture new learning
        </Link>
      </div>
    </AppShell>
  );
}
