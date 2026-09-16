import { NextResponse } from "next/server";
import { readGraph, applyQuizResult } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get("domain");
  const categoryId = searchParams.get("category");
  const nodeId = searchParams.get("node");
  const limit = Number(searchParams.get("limit") ?? "5");

  const graph = await readGraph();
  let questions = [...graph.quizQuestions];

  if (nodeId) {
    questions = questions.filter((q) => q.nodeId === nodeId);
  }

  if (domainId) {
    const domainNodeIds = new Set(
      graph.nodes.filter((n) => n.domainId === domainId).map((n) => n.id),
    );
    questions = questions.filter((q) => domainNodeIds.has(q.nodeId));
  }

  if (categoryId) {
    const categoryNodeIds = new Set(
      graph.nodes.filter((n) => n.categoryId === categoryId).map((n) => n.id),
    );
    questions = questions.filter((q) => categoryNodeIds.has(q.nodeId));
  }

  // Prioritize questions for lower-mastery nodes
  questions.sort((a, b) => {
    const nodeA = graph.nodes.find((n) => n.id === a.nodeId);
    const nodeB = graph.nodes.find((n) => n.id === b.nodeId);
    return (nodeA?.mastery ?? 0) - (nodeB?.mastery ?? 0);
  });

  const selected = questions.slice(0, limit).map((q) => {
    const node = graph.nodes.find((n) => n.id === q.nodeId);
    return { ...q, nodeName: node?.name ?? "Unknown" };
  });

  return NextResponse.json({ questions: selected });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { nodeId, correct } = body;

  if (!nodeId || typeof correct !== "boolean") {
    return NextResponse.json(
      { error: "nodeId and correct are required" },
      { status: 400 },
    );
  }

  const node = await applyQuizResult(nodeId, correct);
  if (!node) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  return NextResponse.json({ node });
}
