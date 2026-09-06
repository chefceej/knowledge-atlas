"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MASTERY_LABELS } from "@/lib/mastery";
import type { MasteryLevel } from "@/lib/types";

interface MasterySliderProps {
  nodeId: string;
  initialMastery: MasteryLevel;
  onUpdate?: (mastery: MasteryLevel) => void;
}

export function MasterySlider({ nodeId, initialMastery, onUpdate }: MasterySliderProps) {
  const [mastery, setMastery] = useState(initialMastery);
  const [saving, setSaving] = useState(false);

  const handleChange = async (value: number | readonly number[]) => {
    const arr = Array.isArray(value) ? [...value] : [value];
    const level = arr[0] as MasteryLevel;
    setMastery(level);
    setSaving(true);
    try {
      await fetch(`/api/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mastery: level }),
      });
      onUpdate?.(level);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between">
        <Label>Mastery level</Label>
        <div className="flex items-center gap-2 text-sm">
          {saving && <Loader2 className="size-3.5 animate-spin text-zinc-500" />}
          <span className="font-medium text-emerald-400">{MASTERY_LABELS[mastery]}</span>
        </div>
      </div>
      <Slider
        value={[mastery]}
        min={0}
        max={5}
        step={1}
        onValueChange={handleChange}
        className="py-2"
      />
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-600">
        <span>Gray</span>
        <span>Green</span>
      </div>
    </div>
  );
}
