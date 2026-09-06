"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuizQuestionWithNode {
  id: string;
  nodeId: string;
  nodeName: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizSessionProps {
  domainId?: string;
  categoryId?: string;
  questionCount?: number;
}

export function QuizSession({
  domainId,
  categoryId,
  questionCount = 5,
}: QuizSessionProps) {
  const [questions, setQuestions] = useState<QuizQuestionWithNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(questionCount) });
    if (domainId) params.set("domain", domainId);
    if (categoryId) params.set("category", categoryId);

    const res = await fetch(`/api/quiz?${params}`);
    const data = await res.json();
    setQuestions(data.questions ?? []);
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
    setLoading(false);
  }, [domainId, categoryId, questionCount]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const current = questions[index];

  const submitAnswer = async () => {
    if (selected === null || !current) return;
    const correct = selected === current.correctIndex;
    setRevealed(true);
    if (correct) setScore((s) => s + 1);

    await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId: current.nodeId, correct }),
    });
  };

  const nextQuestion = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-400">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading quiz…
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <p className="py-8 text-center text-zinc-500">
        No quiz questions available for this selection yet.
      </p>
    );
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle>Quiz complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-bold text-emerald-400">
            {score}/{questions.length}
          </p>
          <p className="text-zinc-400">
            {pct >= 80
              ? "Strong recall — mastery bumped on correct answers."
              : pct >= 50
                ? "Solid effort. Revisit the gray blocks and try again."
                : "Good practice run. Capture more learning, then re-quiz."}
          </p>
          <Button onClick={loadQuestions} className="bg-emerald-600 hover:bg-emerald-500">
            New quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            {current.nodeName}
          </Badge>
          <span className="text-xs text-zinc-500">
            {index + 1} / {questions.length}
          </span>
        </div>
        <CardTitle className="text-lg leading-snug">{current.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {current.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrect = i === current.correctIndex;
          let style =
            "border-zinc-700 bg-zinc-900 hover:border-zinc-600 text-zinc-200";

          if (revealed && isCorrect) {
            style = "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";
          } else if (revealed && isSelected && !isCorrect) {
            style = "border-red-500/50 bg-red-500/10 text-red-200";
          } else if (isSelected) {
            style = "border-amber-500/50 bg-amber-500/10 text-amber-200";
          }

          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => setSelected(i)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${style}`}
            >
              {revealed && isCorrect && (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              )}
              {revealed && isSelected && !isCorrect && (
                <XCircle className="size-4 shrink-0 text-red-400" />
              )}
              <span>{option}</span>
            </button>
          );
        })}

        {revealed && (
          <p className="rounded-lg bg-zinc-800/80 p-3 text-sm text-zinc-300">
            {current.explanation}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {!revealed ? (
            <Button
              onClick={submitAnswer}
              disabled={selected === null}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Check answer
            </Button>
          ) : (
            <Button onClick={nextQuestion} className="bg-emerald-600 hover:bg-emerald-500">
              {index + 1 >= questions.length ? "See results" : "Next question"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
