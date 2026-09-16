import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { GraphExplorer } from "@/components/graph-explorer";
import { readGraph } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const graph = await readGraph();
  const category = graph.categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <AppShell variant="canvas">
      <GraphExplorer graph={graph} focusKind="category" focusId={id} />
    </AppShell>
  );
}
