import { useState, useEffect } from "react";
import { Card } from "../ui/Card.jsx";
import { Tag } from "../ui/Tag.jsx";
import { Btn } from "../ui/Btn.jsx";
import { Countdown } from "../ui/Countdown.jsx";
import { INPUT_TEXTAREA } from "../ui/styles.js";
import { normWords, alignHits } from "../lib/text.js";
import { findVoice } from "../lib/speech.js";
import { secsFor } from "../config/levels.js";

export function ListenStage({ data, level, voices, onDone }) {
  const items = data.items, N = items.length;
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [scores, setScores] = useState([]);
  const secs = secsFor(90, level);
  const speechOK = "speechSynthesis" in window;

  useEffect(() => () => { if (speechOK) window.speechSynthesis.cancel(); }, []);

  function play() {
    if (!speechOK) return;
    const v = findVoice(voices, items[i].accent.langs);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(items[i].spoken);
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 0.95; u.onend = () => setPlaying(false);
    setPlaying(true); window.speechSynthesis.speak(u);
  }
  function check() {
    if (revealed) return;
    const it = items[i];
    const target = normWords(it.fixed || it.spoken), said = normWords(typed);
    const hits = alignHits(target, said);
    const pct = target.length ? Math.round(100 * hits.filter(Boolean).length / target.length) : 0;
    setScores((s) => { const c = s.slice(); c[i] = pct; return c; });
    setRevealed(true);
  }
  function next() {
    if (i + 1 < N) { setI(i + 1); setTyped(""); setRevealed(false); }
    else { const p = scores.map((x) => x || 0); onDone({ type: "listen", label: "Listening", pct: Math.round(p.reduce((a, b) => a + b, 0) / N) }); }
  }

  const it = items[i];
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <Tag>message {i + 1} / {N}</Tag>
        {!revealed && <Countdown key={i} seconds={secs} onExpire={check} />}
      </div>
      <p className="text-sm text-muted">Listen ({it.accent.label} speaker), then type what you heard.</p>
      <Btn onClick={play} disabled={!speechOK}>{playing ? "▶ playing…" : "🔊 play message"}</Btn>
      <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={3} disabled={revealed}
        placeholder="type what you heard…" className={INPUT_TEXTAREA} />
      {!revealed ? <Btn onClick={check}>check</Btn> : (
        <div className="space-y-3">
          <div><Tag>match</Tag> <span className="font-medium text-accent">{scores[i]}%</span></div>
          <div><Tag>what was said</Tag><p className="mt-1 font-serif text-lg leading-snug">“{it.spoken}”</p></div>
          {it.fixed && it.fixed !== it.spoken && <div><Tag>correct English</Tag><p className="mt-1 text-[15px] leading-relaxed text-muted">“{it.fixed}”</p></div>}
          <Btn onClick={next}>{i + 1 < N ? "next message" : "next station"}</Btn>
        </div>
      )}
    </Card>
  );
}
