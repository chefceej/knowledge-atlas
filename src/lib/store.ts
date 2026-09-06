import { promises as fs } from "fs";
import path from "path";
import { seedGraph } from "./seed-data";
import type {
  DomainStats,
  GapInsight,
  KnowledgeGraph,
  KnowledgeNode,
  LearningEntry,
  MasteryLevel,
} from "./types";
import { bumpMastery, masteryPercent } from "./mastery";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "knowledge-graph.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(seedGraph, null, 2), "utf-8");
  }
}

export async function readGraph(): Promise<KnowledgeGraph> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as KnowledgeGraph;
}

export async function writeGraph(graph: KnowledgeGraph): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(graph, null, 2), "utf-8");
}

export function getDomainStats(graph: KnowledgeGraph, domainId: string): DomainStats {
  const nodes = graph.nodes.filter((n) => n.domainId === domainId);
  const totalNodes = nodes.length;
  const masteredNodes = nodes.filter((n) => n.mastery >= 4).length;
  const averageMastery =
    totalNodes === 0
      ? 0
      : nodes.reduce((sum, n) => sum + n.mastery, 0) / totalNodes;
  const percentComplete =
    totalNodes === 0
      ? 0
      : Math.round(
          nodes.reduce((sum, n) => sum + masteryPercent(n.mastery), 0) / totalNodes,
        );

  return {
    domainId,
    totalNodes,
    masteredNodes,
    averageMastery,
    percentComplete,
  };
}

export function getNodeById(graph: KnowledgeGraph, nodeId: string): KnowledgeNode | undefined {
  return graph.nodes.find((n) => n.id === nodeId);
}

export function getLinkedNodes(graph: KnowledgeGraph, node: KnowledgeNode): KnowledgeNode[] {
  return node.linkedNodeIds
    .map((id) => getNodeById(graph, id))
    .filter((n): n is KnowledgeNode => Boolean(n));
}

export function computeGapInsights(graph: KnowledgeGraph): GapInsight[] {
  const insights: GapInsight[] = [];

  for (const category of graph.categories) {
    const categoryNodes = graph.nodes.filter((n) => n.categoryId === category.id);
    const unexplored = categoryNodes.filter((n) => n.mastery <= 1);
    const explored = categoryNodes.filter((n) => n.mastery >= 2);

    if (unexplored.length > 0 && explored.length >= 2) {
      insights.push({
        id: `gap-${category.id}`,
        type: "category-gap",
        title: `${category.name}: ${unexplored.length} unexplored blocks`,
        description: `You've started ${category.name} but haven't touched ${unexplored.map((n) => n.name).slice(0, 3).join(", ")}${unexplored.length > 3 ? "…" : ""}.`,
        nodeIds: unexplored.map((n) => n.id),
        domainId: category.domainId,
      });
    }
  }

  const presidentsGap = graph.nodes.find((n) => n.id === "presidents-1880-1940");
  if (presidentsGap && presidentsGap.mastery <= 1) {
    insights.push({
      id: "gap-presidents-era",
      type: "category-gap",
      title: "Presidential gap: 1880–1940",
      description:
        "You know founding and modern presidents, but the Gilded Age through WWII era is still gray.",
      nodeIds: ["presidents-1880-1940"],
      domainId: "history",
    });
  }

  const chipNodes = graph.nodes.filter((n) => n.categoryId === "semiconductors");
  const chipStrong = chipNodes.filter((n) => n.mastery >= 2 && n.id !== "substrates");
  const substrates = graph.nodes.find((n) => n.id === "substrates");
  if (substrates && substrates.mastery <= 1 && chipStrong.length >= 3) {
    insights.push({
      id: "gap-substrates",
      type: "category-gap",
      title: "Chip design minus substrates",
      description:
        "You know lithography, GPU design, and packaging — but substrates is still unexplored.",
      nodeIds: ["substrates"],
      domainId: "hard-sciences",
    });
  }

  const manhattan = graph.nodes.find((n) => n.id === "manhattan-project");
  if (manhattan) {
    const linked = getLinkedNodes(graph, manhattan);
    const historySide = linked.filter((n) => n.domainId === "history");
    const scienceSide = linked.filter((n) => n.domainId === "hard-sciences");
    const weakLinks = linked.filter((n) => n.mastery <= 1);

    if (historySide.length > 0 && scienceSide.length > 0) {
      insights.push({
        id: "bridge-manhattan",
        type: "cross-domain",
        title: "Manhattan Project bridge",
        description:
          "This node connects WWII history with 20th-century physics — deepen both sides to unlock the full crossover.",
        nodeIds: [manhattan.id, ...linked.map((n) => n.id)],
      });
    }

    if (weakLinks.length >= 2) {
      insights.push({
        id: "bridge-manhattan-weak",
        type: "bridge-missing",
        title: "Incomplete Manhattan crossover",
        description: `Strengthen ${weakLinks.map((n) => n.name).join(", ")} to complete this history ↔ science bridge.`,
        nodeIds: weakLinks.map((n) => n.id),
      });
    }
  }

  return insights;
}

export async function updateNodeMastery(
  nodeId: string,
  mastery: MasteryLevel,
): Promise<KnowledgeNode | null> {
  const graph = await readGraph();
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  node.mastery = mastery;
  await writeGraph(graph);
  return node;
}

export async function addNodeNote(nodeId: string, note: string): Promise<KnowledgeNode | null> {
  const graph = await readGraph();
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  node.notes.push(note);
  await writeGraph(graph);
  return node;
}

export async function addLearningEntry(
  entry: Omit<LearningEntry, "id" | "timestamp">,
  masteryBump = 1,
): Promise<{ entry: LearningEntry; graph: KnowledgeGraph }> {
  const graph = await readGraph();
  const newEntry: LearningEntry = {
    ...entry,
    id: `learn-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  for (const nodeId of entry.nodeIds) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.mastery = bumpMastery(node.mastery, masteryBump);
      node.notes.push(`[${newEntry.title}] ${entry.content.slice(0, 120)}…`);
    }
  }

  graph.learningEntries.unshift(newEntry);
  await writeGraph(graph);
  return { entry: newEntry, graph };
}

export async function applyQuizResult(
  nodeId: string,
  correct: boolean,
): Promise<KnowledgeNode | null> {
  const graph = await readGraph();
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  if (correct) {
    node.mastery = bumpMastery(node.mastery, 1);
  } else {
    node.mastery = Math.max(0, node.mastery - 1) as MasteryLevel;
  }

  await writeGraph(graph);
  return node;
}
