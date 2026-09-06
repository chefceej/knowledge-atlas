import { NextResponse } from "next/server";
import { addLearningEntry } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  const { title, content, nodeIds, masteryBump } = body;

  if (!title || !content || !Array.isArray(nodeIds) || nodeIds.length === 0) {
    return NextResponse.json(
      { error: "title, content, and nodeIds are required" },
      { status: 400 },
    );
  }

  const result = await addLearningEntry(
    { title, content, nodeIds },
    masteryBump ?? 1,
  );

  return NextResponse.json(result);
}
