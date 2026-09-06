import { NextResponse } from "next/server";
import { readGraph, updateNodeMastery, addNodeNote } from "@/lib/store";
import type { MasteryLevel } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const graph = await readGraph();
  const node = graph.nodes.find((n) => n.id === id);

  if (!node) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  const category = graph.categories.find((c) => c.id === node.categoryId);
  const domain = graph.domains.find((d) => d.id === node.domainId);
  const linkedNodes = node.linkedNodeIds
    .map((nid) => graph.nodes.find((n) => n.id === nid))
    .filter(Boolean);
  const questions = graph.quizQuestions.filter((q) => q.nodeId === id);

  return NextResponse.json({ node, category, domain, linkedNodes, questions });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  if (typeof body.mastery === "number") {
    const mastery = Math.min(5, Math.max(0, body.mastery)) as MasteryLevel;
    const node = await updateNodeMastery(id, mastery);
    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }
    return NextResponse.json({ node });
  }

  if (typeof body.note === "string" && body.note.trim()) {
    const node = await addNodeNote(id, body.note.trim());
    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }
    return NextResponse.json({ node });
  }

  return NextResponse.json({ error: "Invalid update" }, { status: 400 });
}
