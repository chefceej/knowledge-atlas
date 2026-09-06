import { AppShell } from "@/components/app-shell";
import { LearnForm } from "@/components/learn-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readGraph } from "@/lib/store";

export default async function LearnPage() {
  const graph = await readGraph();

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Capture learning</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Watched a documentary? Read a deep dive on semiconductors? Log it here
          and tag the knowledge blocks it touched. Each tagged block gains mastery.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-zinc-800 bg-zinc-900/30 lg:col-span-3">
          <CardHeader>
            <CardTitle>New entry</CardTitle>
            <CardDescription>
              Example: &ldquo;Revolutionary War documentary&rdquo; → Washington, Hamilton, Yorktown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LearnForm nodes={graph.nodes} />
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/30 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-400">
            <p>
              <strong className="text-zinc-200">1. Describe</strong> what you learned in your own words.
            </p>
            <p>
              <strong className="text-zinc-200">2. Tag blocks</strong> — pick every topic this learning touched.
            </p>
            <p>
              <strong className="text-zinc-200">3. Watch them glow</strong> — tagged blocks move one step toward green.
            </p>
            <p>
              Later, use <strong className="text-zinc-200">Quiz</strong> to validate what stuck, and{" "}
              <strong className="text-zinc-200">Gaps</strong> to see what to explore next.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
