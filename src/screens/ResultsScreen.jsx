import { useState, useEffect } from "react";
import { SectionHead } from "../ui/SectionHead.jsx";
import { Card } from "../ui/Card.jsx";
import { Spinner } from "../ui/Spinner.jsx";
import { Btn } from "../ui/Btn.jsx";
import { FeedbackCard, VERDICTS } from "../ui/FeedbackCard.jsx";
import { evaluateAnswer } from "../api/claude.js";

export function ResultsScreen({ results, level, onRestart }) {
  const [graded, setGraded] = useState(null);
  useEffect(() => {
    let on = true;
    (async () => {
      const copy = results.map((r) => ({ ...r }));
      for (const r of copy) {
        if ((r.type === "speak" || r.type === "write") && r.transcript && r.transcript.trim()) {
          try { r.feedback = await evaluateAnswer(r.prompt, r.transcript.trim(), r.criteria); }
          catch (e) { r.feedbackErr = true; }
        }
      }
      if (on) setGraded(copy);
    })();
    return () => { on = false; };
  }, []);

  const data = graded || results;
  const vmap = { correct: 100, close: 65, off: 30 };
  const parts = data.map((r) => {
    if (r.type === "grammar" || r.type === "vocab") return r.total ? Math.round(100 * r.correct / r.total) : null;
    if (r.type === "listen" || r.type === "shadow") return r.pct;
    if (r.type === "speak" || r.type === "write") return r.feedback ? (vmap[r.feedback.verdict] ?? 65) : null;
    return null;
  }).filter((v) => v != null);
  const overall = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null;

  function summary(r) {
    if (r.type === "grammar" || r.type === "vocab") return r.correct + " / " + r.total;
    if (r.type === "listen" || r.type === "shadow") return r.pct != null ? r.pct + "%" : "—";
    if (r.feedback) return (VERDICTS[r.feedback.verdict] || VERDICTS.close).label;
    if (r.feedbackErr) return "couldn't grade";
    return r.transcript && r.transcript.trim() ? "…" : "skipped";
  }

  return (
    <div className="space-y-6">
      <SectionHead title="Round complete" subtitle={"Level " + level.label + ". Here's how it went."} />
      <Card className="text-center">
        <div className="font-serif text-6xl text-accent">{overall != null ? overall + "%" : "—"}</div>
        <p className="mt-2 text-sm text-muted">overall</p>
      </Card>
      {data.map((r, k) => (
        <div key={k} className="space-y-3">
          <div className="flex items-baseline justify-between rounded-2xl border border-line bg-white px-5 py-4">
            <span className="font-serif text-xl">{r.label}</span>
            <span className="font-medium text-accent">{summary(r)}</span>
          </div>
          {(r.type === "speak" || r.type === "write") && !r.feedback && !r.feedbackErr && r.transcript && r.transcript.trim() && <Card><Spinner label="Grading…" /></Card>}
          {r.feedback && <FeedbackCard feedback={r.feedback} />}
        </div>
      ))}
      <Btn onClick={onRestart} className="px-8 py-3 text-base">new round</Btn>
    </div>
  );
}
