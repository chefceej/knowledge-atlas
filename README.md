# Knowledge Atlas

A personal **knowledge web**: click into any node, see what lives inside it, and subdivide topics as your map gets more detailed.

Watch a documentary, read about semiconductors, or dive into presidential history. Log what you learned, watch nodes light up from gray to green, quiz yourself to validate recall, and discover gaps in your mental map.

## Features

- **Click-into graph**: Atlas → domain → category → topic → nested children
- **Subdivide any node**: grow the web instead of keeping a flat list of cards
- **Mastery glow**: topics progress through 6 levels (Unexplored → Mastered)
- **Learning capture**: log what you learned and tag the nodes it touched
- **Cross-domain bridges**: e.g. Manhattan Project sits between WWII history and physics
- **Gap analysis** and **quizzing** still live in the header

## Getting started

```bash
npm install
npm run dev -- -p 43123
```

Open [http://localhost:43123](http://localhost:43123).

- Double-click a node (or use **Click into this node**) to enter it
- **Subdivide** adds a child inside the current node
- Drag to pan, scroll to zoom, Escape to step out

Data persists in `data/knowledge-graph.json` (auto-seeded on first run).

## Project structure

```
src/
  app/           # Pages and API routes
  components/    # Graph explorer, capture, quiz, UI
  lib/           # Types, store, seed data, graph slicing
data/
  knowledge-graph.json   # Your personal graph (gitignored by default)
```

## Tech stack

Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · file-based JSON storage
