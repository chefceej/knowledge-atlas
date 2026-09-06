# Knowledge Atlas

**Goodreads × Trivia × RPG Skill Tree** — a personal knowledge graph for tracking what you know across domains.

Watch a documentary, read about semiconductors, or dive into presidential history. Log what you learned, watch knowledge blocks light up from gray to green, quiz yourself to validate recall, and discover gaps in your mental map.

## Features (v1)

- **Two domains**: History and Hard Sciences, each with categories and knowledge blocks
- **Skill tree UI**: Blocks progress through 6 mastery levels (Unexplored → Mastered)
- **Learning capture**: Log what you learned and tag the blocks it touched (+1 mastery each)
- **Cross-domain links**: e.g. Manhattan Project bridges WWII history and 20th-century physics
- **Gap analysis**: Surfaces unexplored blocks, uneven coverage, and incomplete bridges
- **Quizzing**: Multiple-choice questions that bump mastery on correct answers

## Getting started

```bash
npm install
npm run dev -- -p 43123
```

Open [http://localhost:43123](http://localhost:43123).

Data persists in `data/knowledge-graph.json` (auto-seeded on first run).

## Project structure

```
src/
  app/           # Pages and API routes
  components/    # UI components
  lib/           # Types, store, seed data, mastery helpers
data/
  knowledge-graph.json   # Your personal graph (gitignored by default)
```

## Roadmap ideas

- AI-assisted learning capture (describe a documentary → auto-suggest blocks)
- Conversational expansion ("tell me more about substrates")
- Spaced repetition scheduling for quizzes
- Custom domains and user-created nodes
- Graph visualization (force-directed view)
- Export / import your atlas

## Tech stack

Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · file-based JSON storage
