import type { GraphEdge, GraphVertex } from "@/lib/graph-model";

export interface SimBody {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fx: number | null;
  fy: number | null;
}

export function radiusFor(vertex: GraphVertex): number {
  if (vertex.isFocus) return 42;
  if (vertex.kind === "domain") return 34;
  if (vertex.kind === "category") return 28;
  return 22 + Math.min(8, vertex.childCount * 2);
}

export function seedBodies(
  vertices: GraphVertex[],
  width: number,
  height: number,
): SimBody[] {
  const cx = width / 2;
  const cy = height / 2;
  const satellites = vertices.filter((v) => !v.isFocus);
  return vertices.map((vertex) => {
    const r = radiusFor(vertex);
    if (vertex.isFocus) {
      return { id: vertex.id, x: cx, y: cy, vx: 0, vy: 0, r, fx: cx, fy: cy };
    }
    const index = Math.max(0, satellites.findIndex((item) => item.id === vertex.id));
    const angle = (index / Math.max(satellites.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const spread = Math.min(width, height) * 0.28 + satellites.length * 4;
    return {
      id: vertex.id,
      x: cx + Math.cos(angle) * spread,
      y: cy + Math.sin(angle) * spread * 0.78,
      vx: 0,
      vy: 0,
      r,
      fx: null,
      fy: null,
    };
  });
}

export function tickSimulation(
  bodies: SimBody[],
  edges: GraphEdge[],
  width: number,
  height: number,
): void {
  const byId = new Map(bodies.map((b) => [b.id, b]));
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      dx /= dist;
      dy /= dist;
      const minDist = a.r + b.r + 52;
      if (dist < minDist) {
        const push = (minDist - dist) * 0.12;
        a.vx -= dx * push;
        a.vy -= dy * push;
        b.vx += dx * push;
        b.vy += dy * push;
      } else {
        const force = 520 / (dist * dist);
        a.vx -= dx * force;
        a.vy -= dy * force;
        b.vx += dx * force;
        b.vy += dy * force;
      }
    }
  }

  for (const edge of edges) {
    const a = byId.get(edge.source);
    const b = byId.get(edge.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 0.01;
      const rest = edge.kind === "hierarchy" ? 200 : 230;
    const stiffness = edge.kind === "bridge" ? 0.012 : 0.02;
    const f = (dist - rest) * stiffness;
    const nx = dx / dist;
    const ny = dy / dist;
    a.vx += nx * f;
    a.vy += ny * f;
    b.vx -= nx * f;
    b.vy -= ny * f;
  }

  for (const body of bodies) {
    if (body.fx != null && body.fy != null) {
      body.x = body.fx;
      body.y = body.fy;
      body.vx = 0;
      body.vy = 0;
      continue;
    }
    body.vx += (cx - body.x) * 0.0035;
    body.vy += (cy - body.y) * 0.0035;
    body.vx *= 0.82;
    body.vy *= 0.82;
    body.x += body.vx;
    body.y += body.vy;
    body.x = Math.min(width - body.r, Math.max(body.r, body.x));
    body.y = Math.min(height - body.r, Math.max(body.r, body.y));
  }
}

export function masteryFill(mastery: number | null, fallback: string): string {
  if (mastery == null) return fallback;
  const t = Math.min(1, Math.max(0, mastery / 5));
  const from = [63, 63, 70];
  const to = [16, 185, 129];
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
