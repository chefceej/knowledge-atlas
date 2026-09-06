import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitBranch } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MasterySlider } from "@/components/mastery-slider";
import { SkillNodeCard } from "@/components/skill-node-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readGraph, getLinkedNodes } from "@/lib/store";
import { MASTERY_LABELS, masteryColor } from "@/lib/mastery";
import { cn } from "@/lib/utils";

export default async function NodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const graph = await readGraph();
  const node = graph.nodes.find((n) => n.id === id);
  if (!node) notFound();

  const category = graph.categories.find((c) => c.id === node.categoryId);
  const domain = graph.domains.find((d) => d.id === node.domainId);
  const linkedNodes = getLinkedNodes(graph, node);
  const questions = graph.quizQuestions.filter((q) => q.nodeId === id);

  return (
    <AppShell>
      <Link
        href={`/domains/${node.domainId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" /> Back to {domain?.name}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div
            className={cn(
              "rounded-2xl border p-6",
              masteryColor(node.mastery),
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider opacity-60">
                  {category?.name}
                </p>
                <h1 className="mt-1 text-3xl font-bold">{node.name}</h1>
                <p className="mt-2 opacity-80">{node.description}</p>
              </div>
              <Badge className="bg-black/20 text-inherit">
                {MASTERY_LABELS[node.mastery]}
              </Badge>
            </div>
          </div>

          <MasterySlider nodeId={node.id} initialMastery={node.mastery} />

          {node.notes.length > 0 && (
            <Card className="border-zinc-800 bg-zinc-900/30">
              <CardHeader>
                <CardTitle className="text-base">Learning journal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {node.notes.map((note, i) => (
                  <p key={i} className="rounded-lg bg-zinc-900/80 p-3 text-sm text-zinc-300">
                    {note}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {linkedNodes.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <GitBranch className="size-4 text-amber-400" />
                <h2 className="font-semibold">Connected blocks</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {linkedNodes.map((linked) => (
                  <SkillNodeCard key={linked.id} node={linked} compact />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900/30">
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/quiz?node=${node.id}`}
                className="block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-medium hover:bg-emerald-500"
              >
                Quiz this block
              </Link>
              <Link
                href="/learn"
                className="block rounded-lg border border-zinc-700 px-4 py-2.5 text-center text-sm hover:bg-zinc-900"
              >
                Log new learning
              </Link>
            </CardContent>
          </Card>

          {questions.length > 0 && (
            <Card className="border-zinc-800 bg-zinc-900/30">
              <CardHeader>
                <CardTitle className="text-base">Sample questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {questions.slice(0, 2).map((q) => (
                  <p key={q.id} className="text-sm text-zinc-400">
                    {q.question}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
