import { AppShell } from "@/components/app-shell";
import { QuizSession } from "@/components/quiz-session";
import Link from "next/link";
import { readGraph } from "@/lib/store";

async function getQuizQuestions(domainId?: string, nodeId?: string, limit = 5) {
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

  questions.sort((a, b) => {
    const nodeA = graph.nodes.find((n) => n.id === a.nodeId);
    const nodeB = graph.nodes.find((n) => n.id === b.nodeId);
    return (nodeA?.mastery ?? 0) - (nodeB?.mastery ?? 0);
  });

  return questions.slice(0, limit).map((q) => {
    const node = graph.nodes.find((n) => n.id === q.nodeId);
    return { ...q, nodeName: node?.name ?? "Unknown" };
  });
}

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; node?: string }>;
}) {
  const params = await searchParams;
  const domainId = params.domain;
  const nodeId = params.node;
  const initialQuestions = await getQuizQuestions(domainId, nodeId);

  const filters = [
    { label: "All domains", href: "/quiz", active: !domainId },
    { label: "History", href: "/quiz?domain=history", active: domainId === "history" },
    {
      label: "Hard Sciences",
      href: "/quiz?domain=hard-sciences",
      active: domainId === "hard-sciences",
    },
  ];

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Knowledge quiz</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Validate what you know. Correct answers bump mastery; wrong answers nudge
          blocks back toward gray so you know what to revisit.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              f.active
                ? "bg-zinc-800 text-white"
                : "border border-zinc-800 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <QuizSession
        key={`${domainId ?? "all"}-${nodeId ?? "any"}`}
        domainId={domainId}
        nodeId={nodeId}
        initialQuestions={initialQuestions}
        questionCount={5}
      />
    </AppShell>
  );
}
