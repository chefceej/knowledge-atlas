import { AppShell } from "@/components/app-shell";
import { GraphExplorer } from "@/components/graph-explorer";
import { readGraph } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const graph = await readGraph();

  return (
    <AppShell variant="canvas">
      <GraphExplorer graph={graph} focusKind="atlas" focusId={null} />
    </AppShell>
  );
}
