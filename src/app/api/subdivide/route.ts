import { NextResponse } from "next/server";
import { createCategory, createNode, readGraph } from "@/lib/store";
import type { FocusKind } from "@/lib/graph-model";

export async function POST(request: Request) {
  const body = await request.json();
  const focusKind = body.focusKind as FocusKind;
  const focusId = typeof body.focusId === "string" ? body.focusId : null;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!name || !description) {
    return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
  }

  const graph = await readGraph();

  try {
    if (focusKind === "domain" && focusId) {
      const domain = graph.domains.find((d) => d.id === focusId);
      if (!domain) {
        return NextResponse.json({ error: "Domain not found" }, { status: 404 });
      }
      const category = await createCategory({
        name,
        description,
        domainId: focusId,
      });
      return NextResponse.json({ kind: "category", entity: category });
    }

    if (focusKind === "category" && focusId) {
      const category = graph.categories.find((c) => c.id === focusId);
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      const node = await createNode({
        name,
        description,
        domainId: category.domainId,
        categoryId: category.id,
      });
      return NextResponse.json({ kind: "node", entity: node });
    }

    if (focusKind === "node" && focusId) {
      const parent = graph.nodes.find((n) => n.id === focusId);
      if (!parent) {
        return NextResponse.json({ error: "Node not found" }, { status: 404 });
      }
      const node = await createNode({
        name,
        description,
        domainId: parent.domainId,
        categoryId: parent.categoryId,
        parentId: parent.id,
      });
      return NextResponse.json({ kind: "node", entity: node });
    }

    return NextResponse.json(
      { error: "Can only subdivide a domain, category, or topic" },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to subdivide";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
