"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { KnowledgeNode } from "@/lib/types";

interface LearnFormProps {
  nodes: KnowledgeNode[];
}

export function LearnForm({ nodes }: LearnFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const toggleNode = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || selectedIds.length === 0) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, nodeIds: selectedIds }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setStatus("success");
      setMessage(`Logged learning and bumped ${selectedIds.length} knowledge blocks.`);
      setTitle("");
      setContent("");
      setSelectedIds([]);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  const grouped = nodes.reduce<Record<string, KnowledgeNode[]>>((acc, node) => {
    if (!acc[node.categoryId]) acc[node.categoryId] = [];
    acc[node.categoryId].push(node);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">What did you learn?</Label>
        <Input
          id="title"
          placeholder="e.g. Revolutionary War documentary"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-zinc-700 bg-zinc-900"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Notes & reflections</Label>
        <Textarea
          id="content"
          placeholder="Describe what you watched, read, or researched. The more detail, the better for future you."
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border-zinc-700 bg-zinc-900"
        />
      </div>

      <div className="space-y-3">
        <Label>Which knowledge blocks does this touch?</Label>
        <p className="text-xs text-zinc-500">
          Selected blocks will gain +1 mastery when you save.
        </p>
        <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-zinc-800 p-4">
          {Object.entries(grouped).map(([categoryId, categoryNodes]) => (
            <div key={categoryId}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                {categoryId.replace(/-/g, " ")}
              </p>
              <div className="flex flex-wrap gap-2">
                {categoryNodes.map((node) => {
                  const selected = selectedIds.includes(node.id);
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => toggleNode(node.id)}
                      className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                        selected
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {node.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={status === "loading" || !title || !content || selectedIds.length === 0}
        className="w-full bg-emerald-600 hover:bg-emerald-500 sm:w-auto"
      >
        {status === "loading" && <Loader2 className="mr-2 size-4 animate-spin" />}
        Capture learning
      </Button>

      {message && (
        <p
          className={`text-sm ${status === "error" ? "text-red-400" : "text-emerald-400"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
