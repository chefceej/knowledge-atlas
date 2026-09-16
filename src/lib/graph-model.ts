import type { Category, Domain, KnowledgeGraph, KnowledgeNode } from "./types";
import { masteryPercent } from "./mastery";

export type FocusKind = "atlas" | "domain" | "category" | "node";

export type VertexKind = "hub" | "domain" | "category" | "topic";

export interface GraphVertex {
  id: string;
  kind: VertexKind;
  label: string;
  description: string;
  color: string;
  mastery: number | null;
  childCount: number;
  href: string;
  enterable: boolean;
  isFocus: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: "hierarchy" | "link" | "bridge";
}

export interface Breadcrumb {
  label: string;
  href: string;
}

export interface GraphSlice {
  focus: {
    kind: FocusKind;
    id: string | null;
    label: string;
    description: string;
    color: string;
    mastery: number | null;
    href: string;
  };
  breadcrumbs: Breadcrumb[];
  vertices: GraphVertex[];
  edges: GraphEdge[];
}

export function focusHref(kind: FocusKind, id?: string | null): string {
  if (kind === "atlas" || !id) return "/";
  if (kind === "domain") return `/domains/${id}`;
  if (kind === "category") return `/categories/${id}`;
  return `/nodes/${id}`;
}

export function isTopLevelNode(node: KnowledgeNode): boolean {
  return !node.parentId;
}

export function childNodesOf(graph: KnowledgeGraph, parentId: string): KnowledgeNode[] {
  return graph.nodes.filter((n) => n.parentId === parentId);
}

export function categoryTopNodes(graph: KnowledgeGraph, categoryId: string): KnowledgeNode[] {
  return graph.nodes.filter((n) => n.categoryId === categoryId && isTopLevelNode(n));
}

export function nodeColor(graph: KnowledgeGraph, node: KnowledgeNode): string {
  const domain = graph.domains.find((d) => d.id === node.domainId);
  return domain?.color ?? "#71717a";
}

function averageMastery(nodes: KnowledgeNode[]): number | null {
  if (nodes.length === 0) return null;
  const avg = nodes.reduce((sum, n) => sum + n.mastery, 0) / nodes.length;
  return Math.round(avg * 10) / 10;
}

function domainChildCount(graph: KnowledgeGraph, domainId: string): number {
  return graph.categories.filter((c) => c.domainId === domainId && !c.parentCategoryId).length;
}

function categoryChildCount(graph: KnowledgeGraph, categoryId: string): number {
  return categoryTopNodes(graph, categoryId).length;
}

function makeVertex(input: Omit<GraphVertex, "enterable"> & { enterable?: boolean }): GraphVertex {
  return {
    ...input,
    enterable: input.enterable ?? (input.kind !== "hub" || input.childCount > 0),
  };
}

export function buildGraphSlice(
  graph: KnowledgeGraph,
  kind: FocusKind,
  id: string | null,
): GraphSlice {
  if (kind === "domain" && id) return buildDomainSlice(graph, id);
  if (kind === "category" && id) return buildCategorySlice(graph, id);
  if (kind === "node" && id) return buildNodeSlice(graph, id);
  return buildAtlasSlice(graph);
}

function buildAtlasSlice(graph: KnowledgeGraph): GraphSlice {
  const vertices: GraphVertex[] = [
    makeVertex({
      id: "atlas",
      kind: "hub",
      label: "Knowledge Atlas",
      description: "Click a domain to dive in. Double-click any node to enter it.",
      color: "#34d399",
      mastery: averageMastery(graph.nodes),
      childCount: graph.domains.length,
      href: "/",
      isFocus: true,
    }),
  ];

  const edges: GraphEdge[] = [];

  for (const domain of graph.domains) {
    vertices.push(
      makeVertex({
        id: domain.id,
        kind: "domain",
        label: domain.name,
        description: domain.description,
        color: domain.color,
        mastery: averageMastery(graph.nodes.filter((n) => n.domainId === domain.id)),
        childCount: domainChildCount(graph, domain.id),
        href: focusHref("domain", domain.id),
        isFocus: false,
        enterable: true,
      }),
    );
    edges.push({
      id: `atlas-${domain.id}`,
      source: "atlas",
      target: domain.id,
      kind: "hierarchy",
    });
  }

  const bridges = findCrossDomainBridges(graph);
  for (const bridge of bridges) {
    if (!vertices.some((v) => v.id === bridge.id)) {
      vertices.push(
        makeVertex({
          id: bridge.id,
          kind: "topic",
          label: bridge.name,
          description: bridge.description,
          color: "#f59e0b",
          mastery: bridge.mastery,
          childCount: childNodesOf(graph, bridge.id).length,
          href: focusHref("node", bridge.id),
          isFocus: false,
          enterable: true,
        }),
      );
    }
    const historyDomain = graph.domains.find((d) => d.id === "history");
    const scienceDomain = graph.domains.find((d) => d.id === "hard-sciences");
    if (historyDomain) {
      edges.push({
        id: `${bridge.id}-${historyDomain.id}`,
        source: bridge.id,
        target: historyDomain.id,
        kind: "bridge",
      });
    }
    if (scienceDomain) {
      edges.push({
        id: `${bridge.id}-${scienceDomain.id}`,
        source: bridge.id,
        target: scienceDomain.id,
        kind: "bridge",
      });
    }
  }

  return {
    focus: {
      kind: "atlas",
      id: null,
      label: "Knowledge Atlas",
      description: "Your personal web of knowledge. Enter a node to subdivide it.",
      color: "#34d399",
      mastery: averageMastery(graph.nodes),
      href: "/",
    },
    breadcrumbs: [{ label: "Atlas", href: "/" }],
    vertices,
    edges,
  };
}

function buildDomainSlice(graph: KnowledgeGraph, domainId: string): GraphSlice {
  const domain = graph.domains.find((d) => d.id === domainId);
  if (!domain) return buildAtlasSlice(graph);

  const categories = graph.categories.filter(
    (c) => c.domainId === domainId && !c.parentCategoryId,
  );

  const vertices: GraphVertex[] = [
    makeVertex({
      id: domain.id,
      kind: "hub",
      label: domain.name,
      description: domain.description,
      color: domain.color,
      mastery: averageMastery(graph.nodes.filter((n) => n.domainId === domain.id)),
      childCount: categories.length,
      href: focusHref("domain", domain.id),
      isFocus: true,
    }),
  ];
  const edges: GraphEdge[] = [];

  for (const category of categories) {
    vertices.push(categoryVertex(graph, category, domain, false));
    edges.push({
      id: `${domain.id}-${category.id}`,
      source: domain.id,
      target: category.id,
      kind: "hierarchy",
    });
  }

  return {
    focus: {
      kind: "domain",
      id: domain.id,
      label: domain.name,
      description: domain.description,
      color: domain.color,
      mastery: averageMastery(graph.nodes.filter((n) => n.domainId === domain.id)),
      href: focusHref("domain", domain.id),
    },
    breadcrumbs: [
      { label: "Atlas", href: "/" },
      { label: domain.name, href: focusHref("domain", domain.id) },
    ],
    vertices,
    edges,
  };
}

function buildCategorySlice(graph: KnowledgeGraph, categoryId: string): GraphSlice {
  const category = graph.categories.find((c) => c.id === categoryId);
  if (!category) return buildAtlasSlice(graph);
  const domain = graph.domains.find((d) => d.id === category.domainId);

  const topics = categoryTopNodes(graph, categoryId);
  const vertices: GraphVertex[] = [
    makeVertex({
      id: category.id,
      kind: "hub",
      label: category.name,
      description: category.description,
      color: domain?.color ?? "#71717a",
      mastery: averageMastery(graph.nodes.filter((n) => n.categoryId === categoryId)),
      childCount: topics.length,
      href: focusHref("category", category.id),
      isFocus: true,
    }),
  ];
  const edges: GraphEdge[] = [];
  const visible = new Set(topics.map((t) => t.id));

  for (const topic of topics) {
    vertices.push(topicVertex(graph, topic, false));
    edges.push({
      id: `${category.id}-${topic.id}`,
      source: category.id,
      target: topic.id,
      kind: "hierarchy",
    });
  }

  addLinkEdges(topics, visible, edges);

  return {
    focus: {
      kind: "category",
      id: category.id,
      label: category.name,
      description: category.description,
      color: domain?.color ?? "#71717a",
      mastery: averageMastery(graph.nodes.filter((n) => n.categoryId === categoryId)),
      href: focusHref("category", category.id),
    },
    breadcrumbs: [
      { label: "Atlas", href: "/" },
      ...(domain
        ? [{ label: domain.name, href: focusHref("domain", domain.id) }]
        : []),
      { label: category.name, href: focusHref("category", category.id) },
    ],
    vertices,
    edges,
  };
}

function nodeAncestry(graph: KnowledgeGraph, node: KnowledgeNode): KnowledgeNode[] {
  const chain: KnowledgeNode[] = [];
  let current: KnowledgeNode | undefined = node;
  const seen = new Set<string>();
  while (current?.parentId && !seen.has(current.parentId)) {
    seen.add(current.parentId);
    const parent = graph.nodes.find((n) => n.id === current?.parentId);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

function buildNodeSlice(graph: KnowledgeGraph, nodeId: string): GraphSlice {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return buildAtlasSlice(graph);

  const category = graph.categories.find((c) => c.id === node.categoryId);
  const domain = graph.domains.find((d) => d.id === node.domainId);
  const children = childNodesOf(graph, node.id);
  const linked = node.linkedNodeIds
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter((n): n is KnowledgeNode => Boolean(n));

  const vertices: GraphVertex[] = [topicVertex(graph, node, true)];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>([node.id]);

  for (const child of children) {
    if (seen.has(child.id)) continue;
    seen.add(child.id);
    vertices.push(topicVertex(graph, child, false));
    edges.push({
      id: `${node.id}-child-${child.id}`,
      source: node.id,
      target: child.id,
      kind: "hierarchy",
    });
  }

  for (const related of linked) {
    if (!seen.has(related.id)) {
      seen.add(related.id);
      vertices.push(topicVertex(graph, related, false));
    }
    edges.push({
      id: `${node.id}-link-${related.id}`,
      source: node.id,
      target: related.id,
      kind: related.domainId !== node.domainId ? "bridge" : "link",
    });
  }

  const ancestors = nodeAncestry(graph, node);
  const crumbs: Breadcrumb[] = [
    { label: "Atlas", href: "/" },
    ...(domain ? [{ label: domain.name, href: focusHref("domain", domain.id) }] : []),
    ...(category
      ? [{ label: category.name, href: focusHref("category", category.id) }]
      : []),
    ...ancestors.map((a) => ({ label: a.name, href: focusHref("node", a.id) })),
    { label: node.name, href: focusHref("node", node.id) },
  ];

  return {
    focus: {
      kind: "node",
      id: node.id,
      label: node.name,
      description: node.description,
      color: nodeColor(graph, node),
      mastery: node.mastery,
      href: focusHref("node", node.id),
    },
    breadcrumbs: crumbs,
    vertices,
    edges,
  };
}

function categoryVertex(
  graph: KnowledgeGraph,
  category: Category,
  domain: Domain,
  isFocus: boolean,
): GraphVertex {
  const nodes = graph.nodes.filter((n) => n.categoryId === category.id);
  return makeVertex({
    id: category.id,
    kind: isFocus ? "hub" : "category",
    label: category.name,
    description: category.description,
    color: domain.color,
    mastery: averageMastery(nodes),
    childCount: categoryChildCount(graph, category.id),
    href: focusHref("category", category.id),
    isFocus,
    enterable: true,
  });
}

function topicVertex(graph: KnowledgeGraph, node: KnowledgeNode, isFocus: boolean): GraphVertex {
  const children = childNodesOf(graph, node.id).length;
  return makeVertex({
    id: node.id,
    kind: isFocus ? "hub" : "topic",
    label: node.name,
    description: node.description,
    color: nodeColor(graph, node),
    mastery: node.mastery,
    childCount: children,
    href: focusHref("node", node.id),
    isFocus,
    enterable: true,
  });
}

function addLinkEdges(topics: KnowledgeNode[], visible: Set<string>, edges: GraphEdge[]) {
  const seen = new Set<string>();
  for (const topic of topics) {
    for (const targetId of topic.linkedNodeIds) {
      if (!visible.has(targetId)) continue;
      const key = [topic.id, targetId].sort().join("::");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        id: `link-${key}`,
        source: topic.id,
        target: targetId,
        kind: "link",
      });
    }
  }
}

function findCrossDomainBridges(graph: KnowledgeGraph): KnowledgeNode[] {
  return graph.nodes.filter((node) => {
    if (!isTopLevelNode(node)) return false;
    return node.linkedNodeIds.some((id) => {
      const other = graph.nodes.find((n) => n.id === id);
      return other && other.domainId !== node.domainId;
    });
  });
}

export function illuminationPercent(graph: KnowledgeGraph): number {
  if (graph.nodes.length === 0) return 0;
  return Math.round(
    graph.nodes.reduce((sum, n) => sum + masteryPercent(n.mastery), 0) / graph.nodes.length,
  );
}
