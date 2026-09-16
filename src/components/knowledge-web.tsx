"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphSlice, GraphVertex } from "@/lib/graph-model";
import {
  masteryFill,
  seedBodies,
  tickSimulation,
  type SimBody,
} from "@/lib/force-layout";

interface KnowledgeWebProps {
  slice: GraphSlice;
  selectedId: string | null;
  onSelect: (vertex: GraphVertex | null) => void;
  onEnter: (vertex: GraphVertex) => void;
}

export function KnowledgeWeb(props: KnowledgeWebProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 640 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: Math.max(320, entry.contentRect.width),
        height: Math.max(360, entry.contentRect.height),
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layoutKey = [
    props.slice.focus.kind,
    props.slice.focus.id,
    size.width,
    size.height,
    props.slice.vertices.map((v) => v.id).join(","),
  ].join(":");

  return (
    <div
      ref={containerRef}
      className="knowledge-web relative h-full min-h-[420px] w-full overflow-hidden"
    >
      <WebSim key={layoutKey} {...props} size={size} containerRef={containerRef} />
    </div>
  );
}

function WebSim({
  slice,
  selectedId,
  onSelect,
  onEnter,
  size,
  containerRef,
}: KnowledgeWebProps & {
  size: { width: number; height: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [bodies, setBodies] = useState(() =>
    seedBodies(slice.vertices, size.width, size.height),
  );
  const [pan, setPan] = useState({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{
    mode: "pan" | "node";
    id?: string;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
    moved: boolean;
  } | null>(null);
  const clickTimer = useRef<number | null>(null);

  useEffect(() => {
    let frame = 0;
    let ticks = 0;
    const step = () => {
      setBodies((prev) => {
        if (prev.length === 0) return prev;
        const next = prev.map((b) => ({ ...b }));
        tickSimulation(next, slice.edges, size.width, size.height);
        return next;
      });
      ticks += 1;
      if (ticks < 240) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [slice.edges, size.height, size.width]);

  const bodyMap = useMemo(() => new Map(bodies.map((b) => [b.id, b])), [bodies]);

  const screenToWorld = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / pan.k,
      y: (clientY - rect.top - pan.y) / pan.k,
    };
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const scale = event.deltaY < 0 ? 1.08 : 0.92;
      setPan((current) => {
        const nextK = Math.min(2.4, Math.max(0.45, current.k * scale));
        const cx = event.clientX - rect.left;
        const cy = event.clientY - rect.top;
        const wx = (cx - current.x) / current.k;
        const wy = (cy - current.y) / current.k;
        return { k: nextK, x: cx - wx * nextK, y: cy - wy * nextK };
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [containerRef]);

  const onPointerDown = (event: React.PointerEvent, vertex?: GraphVertex) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (vertex) {
      dragRef.current = {
        mode: "node",
        id: vertex.id,
        startX: event.clientX,
        startY: event.clientY,
        origPanX: pan.x,
        origPanY: pan.y,
        moved: false,
      };
      setBodies((prev) =>
        prev.map((b) => (b.id === vertex.id ? { ...b, fx: b.x, fy: b.y } : b)),
      );
    } else {
      dragRef.current = {
        mode: "pan",
        startX: event.clientX,
        startY: event.clientY,
        origPanX: pan.x,
        origPanY: pan.y,
        moved: false,
      };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    if (drag.mode === "pan") {
      setPan((p) => ({ ...p, x: drag.origPanX + dx, y: drag.origPanY + dy }));
      return;
    }
    if (!drag.id) return;
    const world = screenToWorld(event.clientX, event.clientY);
    setBodies((prev) =>
      prev.map((b) =>
        b.id === drag.id ? { ...b, x: world.x, y: world.y, fx: world.x, fy: world.y } : b,
      ),
    );
  };

  const onPointerUp = (vertex?: GraphVertex) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (vertex && drag?.mode === "node" && !drag.moved) {
      if (clickTimer.current) {
        window.clearTimeout(clickTimer.current);
        clickTimer.current = null;
        onEnter(vertex);
      } else {
        onSelect(vertex);
        clickTimer.current = window.setTimeout(() => {
          clickTimer.current = null;
        }, 240);
      }
    } else if (!vertex && drag?.mode === "pan" && !drag.moved) {
      onSelect(null);
    }
    if (vertex && drag?.moved) {
      setBodies((prev) =>
        prev.map((b) => {
          const v = slice.vertices.find((item) => item.id === b.id);
          if (v?.isFocus) {
            return {
              ...b,
              fx: size.width / 2,
              fy: size.height / 2,
              x: size.width / 2,
              y: size.height / 2,
            };
          }
          if (b.id === vertex.id) return { ...b, fx: null, fy: null };
          return b;
        }),
      );
    }
  };

  return (
    <svg
      className="h-full w-full touch-none"
      role="img"
      aria-label={slice.focus.label}
      onPointerMove={onPointerMove}
      onPointerUp={() => onPointerUp()}
      onPointerDown={(e) => onPointerDown(e)}
    >
      <defs>
        <radialGradient id="web-glow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="rgba(52,211,153,0.16)" />
          <stop offset="100%" stopColor="rgba(7,7,12,0)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#web-glow)" />
      <g transform={`translate(${pan.x} ${pan.y}) scale(${pan.k})`}>
        {slice.edges.map((edge) => (
          <EdgeLine key={edge.id} edge={edge} bodyMap={bodyMap} />
        ))}
        {slice.vertices.map((vertex) => {
          const body = bodyMap.get(vertex.id);
          if (!body) return null;
          const selected = selectedId === vertex.id;
          const fill = vertex.isFocus ? vertex.color : masteryFill(vertex.mastery, vertex.color);
          return (
            <g
              key={vertex.id}
              transform={`translate(${body.x} ${body.y})`}
              className="cursor-pointer"
              onPointerDown={(e) => {
                e.stopPropagation();
                onPointerDown(e, vertex);
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onPointerUp(vertex);
              }}
            >
              {selected || vertex.isFocus ? (
                <circle
                  r={body.r + 10}
                  fill="none"
                  stroke={vertex.color}
                  strokeOpacity={0.45}
                  strokeWidth={2}
                />
              ) : null}
              <circle
                r={body.r}
                fill={fill}
                stroke={vertex.color}
                strokeWidth={vertex.isFocus ? 3 : 1.5}
                opacity={0.95}
              />
              {vertex.childCount > 0 && !vertex.isFocus ? (
                <g style={{ pointerEvents: "none" }}>
                  <circle
                    cx={body.r * 0.62}
                    cy={-body.r * 0.62}
                    r={9}
                    fill="#18181b"
                    stroke={vertex.color}
                    strokeWidth={1}
                  />
                  <text
                    x={body.r * 0.62}
                    y={-body.r * 0.62 + 3}
                    textAnchor="middle"
                    className="fill-zinc-200"
                    fontSize={9}
                  >
                    {vertex.childCount}
                  </text>
                </g>
              ) : null}
              <text
                y={body.r + 16}
                textAnchor="middle"
                className="fill-zinc-100"
                fontSize={vertex.isFocus ? 13 : 11}
                fontWeight={vertex.isFocus ? 650 : 500}
                style={{ pointerEvents: "none" }}
              >
                {vertex.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function EdgeLine({
  edge,
  bodyMap,
}: {
  edge: GraphEdge;
  bodyMap: Map<string, SimBody>;
}) {
  const a = bodyMap.get(edge.source);
  const b = bodyMap.get(edge.target);
  if (!a || !b) return null;
  const color =
    edge.kind === "bridge" ? "#f59e0b" : edge.kind === "hierarchy" ? "#64748b" : "#34d399";
  const width = edge.kind === "bridge" ? 1.8 : 1.1;
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2 - 18;
  return (
    <path
      d={`M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeOpacity={edge.kind === "link" ? 0.45 : 0.55}
    />
  );
}
