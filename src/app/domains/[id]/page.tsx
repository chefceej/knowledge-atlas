import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { GraphExplorer } from "@/components/graph-explorer";
import { readGraph } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DomainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const graph = await readGraph();
  const domain = graph.domains.find((d) => d.id === id);
  if (!domain) notFound();

  return (
    <AppShell variant="canvas">
      <GraphExplorer graph={graph} focusKind="domain" focusId={id} />
    </AppShell>
  );
}
