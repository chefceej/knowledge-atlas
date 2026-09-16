"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitBranch, GraduationCap, Plus, Sparkles, Waypoints } from "lucide-react";
import { KnowledgeWeb } from "@/components/knowledge-web";
import { MasterySlider } from "@/components/mastery-slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildGraphSlice, type FocusKind, type GraphVertex } from "@/lib/graph-model";
import { MASTERY_LABELS } from "@/lib/mastery";
import type { KnowledgeGraph, KnowledgeNode, MasteryLevel } from "@/lib/types";

interface GraphExplorerProps {
  graph: KnowledgeGraph;
  focusKind: FocusKind;
  focusId: string | null;
}

export function GraphExplorer({ graph, focusKind, focusId }: GraphExplorerProps) {
  const router = useRouter();
  const slice = useMemo(
    () => buildGraphSlice(graph, focusKind, focusId),
    [graph, focusKind, focusId],
  );
  const [selectedId, setSelectedId] = useState<string | null>(slice.focus.id);
  const [subdivideOpen, setSubdivideOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubdivide = focusKind !== "atlas";
  const canStepOut = slice.breadcrumbs.length > 1;
  const parentHref = canStepOut
    ? slice.breadcrumbs[slice.breadcrumbs.length - 2]?.href
    : "/";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && canStepOut && parentHref) {
        router.push(parentHref);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canStepOut, parentHref, router]);

  const selected =
    slice.vertices.find((v) => v.id === selectedId) ??
    slice.vertices.find((v) => v.isFocus) ??
    null;

  const selectedNode: KnowledgeNode | undefined =
    selected?.kind === "topic" || (selected?.kind === "hub" && focusKind === "node")
      ? graph.nodes.find((n) => n.id === selected.id)
      : undefined;

  const enter = (vertex: GraphVertex) => {
    if (vertex.isFocus) {
      if (canStepOut && parentHref) router.push(parentHref);
      return;
    }
    if (vertex.enterable) router.push(vertex.href);
  };

  const submitSubdivide = async () => {
    if (!name.trim() || !description.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/subdivide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focusKind,
          focusId,
          name: name.trim(),
          description: description.trim(),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Could not subdivide");
      setSubdivideOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subdivide");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
        <nav className="pointer-events-auto flex flex-wrap items-center gap-1 text-xs text-zinc-400">
          {slice.breadcrumbs.map((crumb, index) => {
            const last = index === slice.breadcrumbs.length - 1;
            return (
              <span key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1">
                {index > 0 && <span className="text-zinc-700">/</span>}
                {last ? (
                  <span className="font-medium text-zinc-200">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-emerald-300">
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
        <div className="pointer-events-auto flex items-center gap-2">
          {canSubdivide && (
            <Button
              size="sm"
              onClick={() => setSubdivideOpen(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Plus className="size-3.5" />
              Subdivide
            </Button>
          )}
        </div>
      </div>

      <KnowledgeWeb
        slice={slice}
        selectedId={selected?.id ?? null}
        onSelect={(vertex) => setSelectedId(vertex?.id ?? slice.focus.id)}
        onEnter={enter}
      />

      <aside className="pointer-events-none absolute inset-x-3 bottom-3 z-20 sm:inset-x-auto sm:top-16 sm:right-4 sm:bottom-4 sm:w-80">
        <div className="pointer-events-auto max-h-full overflow-y-auto rounded-2xl border border-zinc-800/80 bg-zinc-950/85 p-4 shadow-2xl backdrop-blur-md">
          {selected ? (
            <>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    {selected.kind === "hub" ? slice.focus.kind : selected.kind}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold leading-tight">{selected.label}</h2>
                </div>
                {selected.mastery != null && selected.mastery === Math.round(selected.mastery) ? (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                    {MASTERY_LABELS[selected.mastery as MasteryLevel] ??
                      `${Math.round((selected.mastery / 5) * 100)}%`}
                  </Badge>
                ) : selected.mastery != null ? (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                    {Math.round((selected.mastery / 5) * 100)}% lit
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-zinc-400">{selected.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1">
                  <Waypoints className="size-3" />
                  {selected.childCount} inside
                </span>
                {slice.edges.filter(
                  (e) => e.source === selected.id || e.target === selected.id,
                ).length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1">
                    <GitBranch className="size-3 text-amber-400" />
                    linked
                  </span>
                )}
              </div>

              {selectedNode && (
                <div className="mt-4">
                  <MasterySlider
                    nodeId={selectedNode.id}
                    initialMastery={selectedNode.mastery}
                    onUpdate={() => router.refresh()}
                  />
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  className="col-span-2"
                  disabled={selected.isFocus ? !canStepOut : !selected.enterable}
                  onClick={() => enter(selected)}
                >
                  {selected.isFocus
                    ? canStepOut
                      ? "Step out"
                      : "Atlas root"
                    : "Click into this node"}
                </Button>
                {selectedNode && (
                  <>
                    <Link
                      href={`/quiz?node=${selectedNode.id}`}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm hover:bg-muted"
                    >
                      <GraduationCap className="size-3.5" />
                      Quiz
                    </Link>
                    <Link
                      href="/learn"
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm hover:bg-muted"
                    >
                      <Sparkles className="size-3.5" />
                      Capture
                    </Link>
                  </>
                )}
              </div>
              {selectedNode && selectedNode.notes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-zinc-500">Journal</p>
                  {selectedNode.notes.slice(0, 3).map((note, i) => (
                    <p key={i} className="rounded-lg bg-zinc-900 p-2 text-xs text-zinc-400">
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">Select a node to inspect it.</p>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
            Double-click a node to enter it. Drag to pan, scroll to zoom. Subdivide to grow the web.
          </p>
        </div>
      </aside>

      <Dialog open={subdivideOpen} onOpenChange={setSubdivideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subdivide {slice.focus.label}</DialogTitle>
            <DialogDescription>
              Add a child node inside this one. You can keep nesting as deep as you like.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="subdivide-name">Name</Label>
              <Input
                id="subdivide-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Valley Forge"
                className="border-zinc-700 bg-zinc-900"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subdivide-desc">What belongs here?</Label>
              <Textarea
                id="subdivide-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short note for future you"
                className="border-zinc-700 bg-zinc-900"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubdivideOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500"
              disabled={saving || !name.trim() || !description.trim()}
              onClick={submitSubdivide}
            >
              {saving ? "Adding…" : "Add child"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
