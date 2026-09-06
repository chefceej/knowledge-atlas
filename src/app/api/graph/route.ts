import { NextResponse } from "next/server";
import { readGraph } from "@/lib/store";
import { getDomainStats } from "@/lib/store";
import { computeGapInsights } from "@/lib/store";

export async function GET() {
  const graph = await readGraph();
  const domainStats = graph.domains.map((d) => getDomainStats(graph, d.id));
  const gaps = computeGapInsights(graph);

  return NextResponse.json({
    ...graph,
    domainStats,
    gaps,
  });
}
