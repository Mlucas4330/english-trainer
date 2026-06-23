import React, { useState, useEffect, useRef, useCallback } from "react";
import { recordMiss, getDue, updateReview, getStats } from "./store.js";

function hashId(prefix, s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return prefix + "_" + (h >>> 0).toString(36);
}
function grammarMiss(focus, q) {
  return { id: hashId("g", q.sentence), type: "grammar", focus: focus.label, sentence: q.sentence, options: q.options, answer: q.answer, why: q.why };
}
function vocabMiss(theme, w) {
  return { id: hashId("v", w.word), type: "vocab", theme, word: w.word, definition: w.definition, example: w.example };
}

async function getApiKey() {
  const { anthropicApiKey } = await chrome.storage.local.get("anthropicApiKey");
  return anthropicApiKey || "";
}

async function callClaude(system, userText, maxTokens = 1000) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("No API key set. Open the extension's Options page and paste your Anthropic API key.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages: [{ role: "user", content: userText }] }),
  });
  if (!res.ok) throw new Error("Request failed (" + res.status + ")");
  const data = await res.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

function parseJSON(text) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const first = clean.search(/[[{]/);
  return JSON.parse(first >= 0 ? clean.slice(first) : clean);
}

async function evaluateAnswer(task, answer, criteria) {
  const sys = "You are a precise, encouraging B2 English coach. You judge a learner's free answer against a task. Reply with ONLY a JSON object, no markdown.";
  const ask = 'TASK: "' + task + '"\nLEARNER ANSWER: "' + answer + '"\n' +
    'Judge it on: ' + criteria + '. Be fair but hold a B2 standard. ' +
    'Return {"verdict": one of "correct"|"close"|"off", "corrected": the learner answer rewritten in natural correct English (keep their meaning), "errors": array (max 4) of {"wrong": the exact problem phrase, "right": the fix, "why": rule under 18 words}, "note": one short specific encouraging line}. ' +
    'If the answer is already good, return an empty errors array and verdict "correct". Return only the JSON.';
  return parseJSON(await callClaude(sys, ask, 1500));
}

function openInTab() {
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  }
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function freshness(prev, label) {
  const seed = Math.random().toString(36).slice(2, 8);
  let s = " Make this set fresh and varied, clearly different from earlier ones; avoid the most obvious or repeated choices. Variation seed: " + seed + ".";
  if (prev && prev.length) s += " You have ALREADY used the following " + label + " in this session, so you MUST NOT repeat any of them or close variants: " + prev.slice(-50).join(" | ") + ".";
  return s + " Return only the JSON, nothing else.";
}

const VOCAB_ANGLES = ["Favour common everyday verbs.", "Favour vivid descriptive adjectives.", "Include one or two common phrasal verbs or idioms.", "Prefer words most useful in spoken conversation.", "Prefer words most useful in writing and email.", "Lean slightly formal in register.", "Pick words learners often reach for a simpler synonym instead of."];
const GRAMMAR_CONTEXTS = ["a workplace or office", "travel and holidays", "daily life at home", "school or studying", "friendships and social plans", "food, cooking and restaurants", "technology and life online", "health and exercise"];
const LISTEN_TOPICS = ["work and meetings", "travel and directions", "food and restaurants", "weekend plans", "family and home", "shopping and money", "health and appointments", "hobbies and free time"];
const SPEAK_ANGLES = ["a personal memory", "an opinion you defend", "a hypothetical situation about what you would do", "describing how to do something step by step", "comparing two options", "a recent experience", "plans or hopes for the future", "a place that matters to you"];

function useVoices() {
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);
  return voices;
}

function Icon({ name, className = "h-6 w-6" }) {
  const p = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "home") return <svg {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>;
  if (name === "listening") return <svg {...p}><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /></svg>;
  if (name === "grammar") return <svg {...p}><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" /><path d="M14 7l3 3" /></svg>;
  if (name === "vocab") return <svg {...p}><rect x="5" y="4" width="14" height="16" rx="1.5" /><path d="M9 4v16" /><path d="M12 8.5h4" /><path d="M12 12h4" /></svg>;
  if (name === "speak") return <svg {...p}><path d="M5 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-8l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /></svg>;
  if (name === "write") return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>;
  if (name === "review") return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4" /></svg>;
  if (name === "menu") return <svg {...p}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>;
  if (name === "close") return <svg {...p}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>;
  return null;
}

function Tag({ children }) {
  return <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{children}</span>;
}

function Btn({ children, onClick, kind = "primary", disabled, className = "" }) {
  const base = "flex w-fit items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = kind === "primary"
    ? "bg-ink text-paper hover:bg-accent"
    : "border border-line text-ink hover:border-ink";
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>{children}</button>;
}

function Spinner({ label }) {
  return (
    <div className="flex items-center gap-3 text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
      <span className="text-sm">{label || "Thinking…"}</span>
    </div>
  );
}

function ErrorNote({ msg, onRetry }) {
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-4 text-sm leading-relaxed text-ink">
      {msg}{" "}
      {onRetry && <button onClick={onRetry} className="font-medium text-accent underline underline-offset-2">Try again</button>}
    </div>
  );
}

function Card({ children, tone = "default", className = "" }) {
  const tones = {
    default: "border-line bg-white",
    dark: "border-ink bg-ink text-paper",
    soft: "border-line bg-soft",
  };
  return <div className={`rounded-2xl border ${tones[tone]} p-6 ${className}`}>{children}</div>;
}

function SectionHead({ title, subtitle }) {
  return (
    <div className="space-y-1.5">
      <h2 className="font-serif text-[28px] leading-tight tracking-tight">{title}</h2>
      <p className="text-[15px] leading-relaxed text-muted">{subtitle}</p>
    </div>
  );
}

const VERDICTS = {
  correct: { label: "spot on", cls: "text-accent" },
  close: { label: "almost there", cls: "text-ink" },
  off: { label: "let's fix this", cls: "text-muted" },
};

function FeedbackCard({ feedback }) {
  const v = VERDICTS[feedback.verdict] || VERDICTS.close;
  return (
    <Card className="space-y-4">
      <div className="flex items-baseline gap-2.5">
        <Tag>feedback</Tag>
        <span className={`font-serif text-lg ${v.cls}`}>{v.label}</span>
      </div>
      {feedback.corrected && (
        <div>
          <Tag>natural version</Tag>
          <p className="mt-1.5 font-serif text-xl leading-snug">“{feedback.corrected}”</p>
        </div>
      )}
      {feedback.errors && feedback.errors.length > 0 && (
        <div>
          <Tag>what to fix</Tag>
          <ul className="mt-2 space-y-2.5 text-[15px]">
            {feedback.errors.map((e, i) => (
              <li key={i} className="space-y-0.5">
                <span className="text-muted line-through">{e.wrong}</span>
                <span className="mx-2 text-accent">→</span>
                <span className="font-medium">{e.right}</span>
                <p className="text-sm leading-relaxed text-muted">{e.why}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {feedback.note && (
        <div className="rounded-xl border border-line bg-soft p-4 text-[15px] leading-relaxed">
          <span className="font-serif font-semibold">note. </span>{feedback.note}
        </div>
      )}
    </Card>
  );
}

function Chip({ on, children, onClick, dim }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? "border-accent bg-accent/[0.08] text-accent" : "border-line text-ink hover:border-ink"} ${dim ? "opacity-40" : ""}`}>
      {children}
    </button>
  );
}

function OptionBtn({ state, onClick, children }) {
  const correct = state === "correct", wrong = state === "wrong", dim = state === "dim";
  const cls = correct ? "border-accent bg-accent/[0.05] text-ink"
    : wrong ? "border-line text-muted line-through"
    : dim ? "border-line text-muted opacity-60"
    : "border-line text-ink hover:border-ink";
  return (
    <button onClick={onClick} disabled={state !== "idle"}
      className={`flex w-full items-start gap-2 rounded-xl border px-4 py-3 text-left text-[15px] leading-snug transition-colors ${cls}`}>
      {(correct || wrong) && <span className="font-medium text-accent">{correct ? "✓" : "✕"}</span>}
      <span>{children}</span>
    </button>
  );
}

function optState(show, right, isPicked) {
  if (!show) return "idle";
  if (right) return "correct";
  if (isPicked) return "wrong";
  return "dim";
}

const MODES = [
  { id: "accent", icon: "listening", title: "Real world listening", desc: "Hear English the way non native speakers really say it." },
  { id: "grammar", icon: "grammar", title: "Grammar & error spotting", desc: "Drill the tense and preposition knots, rule shown after each answer." },
  { id: "vocab", icon: "vocab", title: "Vocabulary", desc: "Five B2 words in context, then a quick recall quiz." },
  { id: "speak", icon: "speak", title: "Speaking gym", desc: "Answer prompts out loud against the clock." },
  { id: "write", icon: "write", title: "Writing", desc: "Build a paragraph, then get real feedback on it." },
  { id: "review", icon: "review", title: "Review", desc: "Bring back the things you got wrong, spaced out." },
];

function Home({ go }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { getStats().then(setStats); }, []);
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-serif text-[52px] leading-[1.02] tracking-tight">Train your<br />English.</h1>
        <p className="text-lg text-muted">Pick a focus to begin.</p>
      </header>
      {stats && stats.due > 0 && (
        <button onClick={() => go("review")}
          className="flex w-full items-center justify-between rounded-2xl border border-accent/30 bg-accent/[0.06] px-5 py-4 text-left transition-colors hover:border-accent">
          <span className="text-[15px] text-ink">
            <span className="font-semibold text-accent">{stats.due}</span> {stats.due === 1 ? "item" : "items"} due for review
            {stats.weakest && <span className="text-muted"> · weakest: {stats.weakest}</span>}
          </span>
          <span className="text-accent">→</span>
        </button>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => go(m.id)}
            className="group rounded-2xl border border-line bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_10px_30px_-16px_rgba(0,0,0,0.25)]">
            <span className="text-ink transition-colors group-hover:text-accent"><Icon name={m.icon} className="h-7 w-7" /></span>
            <h2 className="mt-4 font-serif text-[22px] leading-tight tracking-tight">{m.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{m.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

const ACCENTS = [
  { id: "br", label: "Brazilian", l1: "Brazilian Portuguese", langs: ["pt-BR", "pt-PT", "pt"] },
  { id: "latam", label: "Latin / Spanish", l1: "Spanish", langs: ["es-MX", "es-US", "es-419", "es-ES", "es"] },
  { id: "india", label: "Indian", l1: "Hindi (Indian English)", langs: ["en-IN", "hi-IN", "hi"] },
  { id: "french", label: "French", l1: "French", langs: ["fr-FR", "fr-CA", "fr"] },
  { id: "chinese", label: "Chinese", l1: "Mandarin", langs: ["zh-CN", "zh-TW", "zh"] },
  { id: "german", label: "German", l1: "German", langs: ["de-DE", "de"] },
];

function AccentTrainer({ voices }) {
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [mistakes, setMistakes] = useState(true);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [playing, setPlaying] = useState(false);
  const seenRef = useRef([]);
  const speechOK = "speechSynthesis" in window;

  const findVoice = useCallback((langs) => {
    for (const l of langs) { const v = voices.find((x) => x.lang && x.lang.toLowerCase() === l.toLowerCase()); if (v) return v; }
    for (const l of langs) { const b = l.split("-")[0].toLowerCase(); const v = voices.find((x) => x.lang && x.lang.toLowerCase().startsWith(b)); if (v) return v; }
    return null;
  }, [voices]);

  const load = useCallback(async (accArg, misArg) => {
    const acc = accArg || accent; const mis = misArg === undefined ? mistakes : misArg;
    setLoading(true); setErr(null); setItem(null); setRevealed(false); setTyped("");
    try {
      const sys = "You generate realistic listening practice for a Brazilian B1 English learner who must understand non-native speakers. Reply with ONLY a JSON object, no markdown.";
      const ask = mis
        ? 'Write ONE short everyday English message (1-2 sentences, ~14-22 words) as a ' + acc.l1 +
          ' speaker at intermediate level would REALISTICALLY say it — include 1 to 3 natural non-native errors typical of ' + acc.l1 +
          ' speakers, favouring wrong prepositions and present-perfect/past-simple slips. Must still be understandable. Return {"spoken": message with errors, "meant": what they mean in one clear sentence, "fixed": same in correct standard English, "quirks": array up to 3 like "since two years -> for two years"}. Only JSON.'
        : 'Write ONE short correct everyday English message (1-2 sentences, ~14-22 words) at B2 level. Return {"spoken": message, "meant": one-line paraphrase, "fixed": same as spoken, "quirks": []}. Only JSON.';
      const parsed = parseJSON(await callClaude(sys, ask + " Make the message about " + pick(LISTEN_TOPICS) + "." + freshness(seenRef.current, "messages")));
      seenRef.current.push(parsed.spoken);
      setItem(parsed);
    } catch (e) { setErr("Couldn't load a message. Retry?"); }
    finally { setLoading(false); }
  }, [accent, mistakes]);

  function changeAccent(a) { if (a.id === accent.id) return; setAccent(a); setItem(null); setErr(null); if (item || loading) load(a, undefined); }
  function changeMistakes(v) { setMistakes(v); if (item || loading) load(undefined, v); }

  function play() {
    if (!speechOK || !item) return;
    const v = findVoice(accent.langs);
    if (!v) { setErr("Your device has no " + accent.l1 + " voice installed, so this accent can't play here. Try another accent or add the voice in your system settings."); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(item.spoken);
    u.voice = v; u.lang = v.lang; u.rate = 0.9;
    u.onend = () => setPlaying(false);
    setPlaying(true); setErr(null);
    window.speechSynthesis.speak(u);
  }
  const voiceFor = (a) => findVoice(a.langs);

  return (
    <div className="space-y-6">
      <SectionHead title="Real world listening" subtitle="Hear English the way a non native speaker really says it." />
      {!speechOK && <ErrorNote msg="This browser can't play synthesized speech. You can still read and reveal." />}

      <Card>
        <Tag>whose accent?</Tag>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <Chip key={a.id} on={a.id === accent.id} dim={!voiceFor(a)} onClick={() => changeAccent(a)}>
              <span className="flex flex-col items-center leading-tight">
                <span>{a.label}</span>
                <span className="text-[11px] text-muted">{voiceFor(a) ? "voice ready" : "no voice"}</span>
              </span>
            </Chip>
          ))}
        </div>
        <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-ink">
          <input type="checkbox" className="h-4 w-4 accent-accent" checked={mistakes} onChange={(e) => changeMistakes(e.target.checked)} />
          include realistic mistakes (the way people really talk)
        </label>
      </Card>

      {!item && !loading && <Btn onClick={() => load()}>play a {accent.label.toLowerCase()} message</Btn>}
      {loading && <Card><Spinner label="Writing a realistic message…" /></Card>}
      {err && <ErrorNote msg={err} onRetry={!item ? () => load() : undefined} />}

      {item && (
        <>
          <Card className="text-center">
            <Tag>listen, don't read yet</Tag>
            <div className="mt-4">
              <Btn onClick={play} disabled={!speechOK} className="mx-auto">{playing ? "▶ playing…" : "🔊 play message"}</Btn>
            </div>
            <p className="mt-3 text-xs text-muted">replay as much as you need · slowed to 90%</p>
          </Card>
          {!revealed ? (
            <Card className="space-y-3">
              <Tag>type what you heard</Tag>
              <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={2}
                placeholder="write the message as you understood it…"
                className="w-full resize-none rounded-xl border border-line bg-white p-3 text-[15px] leading-relaxed text-ink outline-none transition-colors focus:border-ink" />
              <Btn kind="ghost" onClick={() => setRevealed(true)}>check what I heard</Btn>
            </Card>
          ) : (
            <Card className="space-y-4">
              {typed.trim() && (
                <div>
                  <Tag>your transcription</Tag>
                  <p className="mt-1.5 text-[15px] italic leading-relaxed">“{typed.trim()}”</p>
                </div>
              )}
              <div>
                <Tag>what was said</Tag>
                <p className="mt-1.5 font-serif text-xl leading-snug">“{item.spoken}”</p>
              </div>
              <div>
                <Tag>what they meant</Tag>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{item.meant}</p>
              </div>
              {item.quirks && item.quirks.length > 0 && (
                <div>
                  <Tag>the mistakes & the fix</Tag>
                  <ul className="mt-1.5 space-y-1.5 text-sm">
                    {item.quirks.map((q, i) => <li key={i} className="flex gap-2"><span className="text-accent">·</span>{q}</li>)}
                  </ul>
                </div>
              )}
            </Card>
          )}
          <Btn onClick={() => load()}>next message</Btn>
        </>
      )}
    </div>
  );
}

const GFOCUS = [
  { id: "tenses", label: "perfect vs. past", topic: "choosing between present perfect and past simple" },
  { id: "preps", label: "prepositions", topic: "choosing the correct preposition" },
  { id: "linkers", label: "linking words", topic: "choosing the right linking word (however, although, despite, whereas, therefore)" },
  { id: "cond", label: "conditionals", topic: "choosing the correct conditional form (first, second, third or mixed)" },
  { id: "modals", label: "modals of deduction", topic: "choosing the correct modal of deduction or speculation (must have, might have, can't have been)" },
  { id: "rel", label: "relative clauses", topic: "choosing the correct relative pronoun, including defining vs non-defining clauses" },
  { id: "fix", label: "spot the mistake" },
  { id: "produce", label: "build the sentence" },
];

function GrammarTrainer() {
  const [focus, setFocus] = useState(GFOCUS[0]);
  const [qs, setQs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [task, setTask] = useState(null);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const seenRef = useRef([]);

  const load = useCallback(async (focArg) => {
    const foc = focArg || focus;
    setLoading(true); setErr(null); setQs(null); setI(0); setScore(0); setPicked(null); setDone(false);
    setTask(null); setTyped(""); setFeedback(null);
    try {
      if (foc.id === "produce") {
        const sys = "You design short B2 grammar production tasks for a learner moving from B1 to B2. Reply with ONLY a JSON object, no markdown.";
        const ask = 'Create ONE "transform the sentence" task that forces the learner to PRODUCE a B2 structure (rewrite using a linking word like despite/although/whereas, form a conditional, use a modal of deduction, combine sentences with a relative clause, or change the voice). Return {"task": the full instruction including any source sentence to transform, "hint": a nudge under 14 words, "model": one correct target answer}. Set it in the context of ' + pick(GRAMMAR_CONTEXTS) + '.' + freshness(seenRef.current, "tasks");
        const parsed = parseJSON(await callClaude(sys, ask));
        seenRef.current.push(parsed.task);
        setTask(parsed);
        return;
      }
      let ask;
      if (foc.id === "fix")
        ask = 'Create 5 "spot the mistake" questions for a B1 learner. Each shows an English sentence containing ONE typical non-native error (wrong preposition, present-perfect/past-simple slip, or dropped/extra article). {"sentence": the incorrect sentence, "options": array of 3 full corrected sentences where only ONE is fully correct, "answer": the correct sentence string, "why": one-sentence rule under 22 words}. Return ONLY a JSON array.';
      else
        ask = 'Create 5 fill-in-the-blank multiple-choice questions about ' + foc.topic + '. Each: {"sentence": a sentence with one blank written as "___", "options": array of 3 short options, "answer": exact correct option, "why": one-sentence rule under 22 words}. Plausible distractors. Return ONLY a JSON array.';
      ask += " Set every sentence in the context of " + pick(GRAMMAR_CONTEXTS) + ".";
      const parsed = parseJSON(await callClaude("You design focused grammar drills for a B1 learner aiming at B2. Reply with ONLY JSON, no markdown.", ask + freshness(seenRef.current, "sentences")));
      seenRef.current.push(...parsed.map((q) => q.sentence));
      setQs(parsed);
    } catch (e) { setErr(foc.id === "produce" ? "Couldn't load a task. Retry?" : "Couldn't load the drill. Retry?"); }
    finally { setLoading(false); }
  }, [focus]);

  function changeFocus(f) { if (f.id === focus.id) return; setFocus(f); if (qs || task || loading) load(f); }
  function answer(opt) { if (picked) return; setPicked(opt); if (opt === qs[i].answer) setScore((s) => s + 1); else recordMiss(grammarMiss(focus, qs[i])); }
  function next() { setPicked(null); if (i + 1 < qs.length) setI(i + 1); else setDone(true); }
  async function submit() {
    if (!typed.trim() || submitting) return;
    setSubmitting(true); setFeedback(null);
    try { setFeedback(await evaluateAnswer(task.task, typed.trim(), "B2 grammar accuracy and natural phrasing")); }
    catch (e) { setErr("Couldn't check that. Retry?"); }
    finally { setSubmitting(false); }
  }
  const cur = qs && qs[i]; const isFix = focus.id === "fix"; const isProduce = focus.id === "produce";

  return (
    <div className="space-y-6">
      <SectionHead title="Grammar & error spotting" subtitle="The knots you named. Rule shown after every answer." />
      <div className="flex flex-wrap gap-2">
        {GFOCUS.map((f) => <Chip key={f.id} on={f.id === focus.id} onClick={() => changeFocus(f)}>{f.label}</Chip>)}
      </div>
      {!qs && !task && !loading && <Btn onClick={() => load()}>{isProduce ? "give me a task" : "start the drill"}</Btn>}
      {loading && <Card><Spinner label={isProduce ? "Writing a task…" : "Writing five questions…"} /></Card>}
      {err && <ErrorNote msg={err} onRetry={() => (isProduce && task ? submit() : load())} />}

      {isProduce && task && !loading && (
        <>
          <Card tone="dark">
            <Tag>build this</Tag>
            <p className="mt-2 font-serif text-2xl leading-snug">{task.task}</p>
          </Card>
          <Card className="space-y-3">
            <div className="rounded-xl border border-line bg-soft p-4 text-[15px] leading-relaxed">
              <span className="font-serif font-semibold">hint. </span>{task.hint}
            </div>
            <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={2} disabled={!!feedback}
              placeholder="write your sentence…"
              className="w-full resize-none rounded-xl border border-line bg-white p-3 text-[15px] leading-relaxed text-ink outline-none transition-colors focus:border-ink disabled:opacity-60" />
            {!feedback && <Btn onClick={submit} disabled={!typed.trim() || submitting}>{submitting ? "checking…" : "check my sentence"}</Btn>}
          </Card>
          {submitting && <Card><Spinner label="Reading your sentence…" /></Card>}
          {feedback && (
            <>
              <FeedbackCard feedback={feedback} />
              <Card><Tag>one correct version</Tag><p className="mt-1.5 font-serif text-xl leading-snug">“{task.model}”</p></Card>
              <Btn onClick={() => load()}>next task</Btn>
            </>
          )}
        </>
      )}

      {cur && !done && (
        <Card className="space-y-4">
          <Tag>question {i + 1} / {qs.length}</Tag>
          {isFix && <p className="text-sm text-muted">this sentence has a mistake, pick the right one</p>}
          <p className={`font-serif leading-snug ${isFix ? "text-xl italic" : "text-2xl"}`}>
            {isFix ? "“" + cur.sentence + "”" : cur.sentence.split("___").map((p, idx, arr) => (
              <React.Fragment key={idx}>{p}{idx < arr.length - 1 && (
                <span className="mx-1 inline-block min-w-[64px] border-b-2 border-accent text-center align-baseline text-accent">{picked ? cur.answer : " "}</span>
              )}</React.Fragment>
            ))}
          </p>
          <div className="flex flex-col gap-2.5">
            {cur.options.map((opt) => <OptionBtn key={opt} state={optState(picked != null, opt === cur.answer, opt === picked)} onClick={() => answer(opt)}>{opt}</OptionBtn>)}
          </div>
          {picked && (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-soft p-4 text-[15px] leading-relaxed">
                <span className="font-serif font-semibold">why. </span>{cur.why}
              </div>
              <Btn onClick={next}>{i + 1 < qs.length ? "next" : "see score"}</Btn>
            </div>
          )}
        </Card>
      )}
      {qs && done && (
        <Card className="text-center">
          <div className="font-serif text-5xl text-accent">{score} <span className="text-ink">/ {qs.length}</span></div>
          <p className="mt-2 text-sm text-muted">run it again or switch focus</p>
          <div className="mt-4"><Btn onClick={() => load()} className="mx-auto">new drill</Btn></div>
        </Card>
      )}
    </div>
  );
}

const VTHEMES = ["work", "opinions", "travel", "feelings", "tech", "daily life"];

function VocabTrainer() {
  const [theme, setTheme] = useState(VTHEMES[0]);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [phase, setPhase] = useState("cards");
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const seenRef = useRef([]);

  const load = useCallback(async (themeArg) => {
    const th = themeArg || theme;
    setLoading(true); setErr(null); setItems(null); setPhase("cards"); setQi(0); setScore(0); setPicked(null);
    try {
      const parsed = parseJSON(await callClaude("You build B2 vocabulary for a B1 learner. Reply with ONLY a JSON array, no markdown.",
        'Give 5 useful B2-level English words on the theme "' + th + '". ' + pick(VOCAB_ANGLES) + ' Each: {"word", "pos": short part of speech, "definition": B1-friendly under 14 words, "example": natural sentence, "collocation": one common pairing}. Avoid rare/academic words. Return only the JSON array.' + freshness(seenRef.current, "words")));
      seenRef.current.push(...parsed.map((x) => x.word));
      setItems(parsed);
    } catch (e) { setErr("Couldn't load words. Retry?"); }
    finally { setLoading(false); }
  }, [theme]);

  function changeTheme(t) { if (t === theme) return; setTheme(t); if (items || loading) load(t); }
  function answer(opt) { if (picked) return; setPicked(opt); if (opt === items[qi].word) setScore((s) => s + 1); else recordMiss(vocabMiss(theme, items[qi])); }
  function next() { setPicked(null); if (qi + 1 < items.length) setQi(qi + 1); else setPhase("done"); }
  function options(idx) {
    const words = items.map((x) => x.word); const opts = [words[idx]]; const rest = words.filter((_, k) => k !== idx);
    while (opts.length < Math.min(4, words.length) && rest.length) opts.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
    return opts.sort(() => Math.random() - 0.5);
  }

  return (
    <div className="space-y-6">
      <SectionHead title="Vocabulary" subtitle="Five B2 words in context, then prove you remember them." />
      <div className="flex flex-wrap gap-2">
        {VTHEMES.map((t) => <Chip key={t} on={t === theme} onClick={() => changeTheme(t)}>{t}</Chip>)}
      </div>
      {!items && !loading && <Btn onClick={() => load()}>load words on {theme}</Btn>}
      {loading && <Card><Spinner label="Picking five words…" /></Card>}
      {err && <ErrorNote msg={err} onRetry={() => load()} />}

      {items && phase === "cards" && (
        <>
          {items.map((it, k) => (
            <Card key={k}>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-serif text-2xl">{it.word}</span>
                <span className="text-sm italic text-muted">{it.pos}</span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed">{it.definition}</p>
              <p className="mt-1.5 text-[15px] italic leading-relaxed text-muted">“{it.example}”</p>
              <div className="mt-3 border-t border-line pt-3 text-sm">
                <Tag>collocation</Tag> <span className="ml-1">{it.collocation}</span>
              </div>
            </Card>
          ))}
          <Btn onClick={() => setPhase("quiz")}>quiz me</Btn>
        </>
      )}

      {items && phase === "quiz" && (
        <Card className="space-y-4">
          <Tag>question {qi + 1} / {items.length}</Tag>
          <div>
            <p className="text-sm text-muted">which word means</p>
            <p className="mt-1 font-serif text-2xl leading-snug">{items[qi].definition}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {options(qi).map((opt) => <OptionBtn key={opt} state={optState(picked != null, opt === items[qi].word, opt === picked)} onClick={() => answer(opt)}>{opt}</OptionBtn>)}
          </div>
          {picked && <Btn onClick={next}>{qi + 1 < items.length ? "next" : "see score"}</Btn>}
        </Card>
      )}

      {items && phase === "done" && (
        <Card className="text-center">
          <div className="font-serif text-5xl text-accent">{score} <span className="text-ink">/ {items.length}</span></div>
          <p className="mt-2 text-sm text-muted">repetition makes these stick</p>
          <div className="mt-4"><Btn onClick={() => load()} className="mx-auto">new set</Btn></div>
        </Card>
      )}
    </div>
  );
}

const SpeechRec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

function SpeakingGym() {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recErr, setRecErr] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const timerRef = useRef(null), recRef = useRef(null), baseRef = useRef(""), seenRef = useRef([]);

  const load = useCallback(async () => {
    if (recRef.current) { try { recRef.current.stop(); } catch (e) {} }
    setLoading(true); setErr(null); setItem(null); setSeconds(0); setRunning(false); setTranscript(""); setFeedback(null); setModel(null); setRecErr(null);
    baseRef.current = "";
    try {
      const parsed = parseJSON(await callClaude("You coach a B1 learner who freezes when speaking. Reply with ONLY a JSON object, no markdown.",
        'Give one concrete speaking prompt answerable in 30-60 seconds, pushing toward B2. Make the prompt about ' + pick(SPEAK_ANGLES) + '. Return {"prompt", "phrases": array of 3 sentence-starters, "tip": one anti-freeze tip under 20 words}. Everyday, not academic. Only JSON.' + freshness(seenRef.current, "prompts")));
      seenRef.current.push(parsed.prompt);
      setItem(parsed);
    } catch (e) { setErr("Couldn't load a prompt. Retry?"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (running) timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => () => { if (recRef.current) { try { recRef.current.stop(); } catch (e) {} } }, []);

  function startSpeaking() {
    setRecErr(null); setFeedback(null);
    if (!SpeechRec) { setRunning(true); return; }
    const rec = new SpeechRec();
    rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true;
    baseRef.current = transcript ? transcript.trim() + " " : "";
    rec.onresult = (e) => {
      let live = "";
      for (let k = e.resultIndex; k < e.results.length; k++) live += e.results[k][0].transcript;
      setTranscript((baseRef.current + live).replace(/\s+/g, " "));
    };
    rec.onerror = (e) => {
      const name = e && e.error ? e.error : "error";
      if (name === "not-allowed" || name === "service-not-allowed")
        setRecErr("The mic is blocked in the side panel. Open the trainer in a full tab (below) to allow it once, or just type your answer — you'll still get feedback.");
      else if (name !== "no-speech" && name !== "aborted")
        setRecErr("Speech recognition error (" + name + "). You can type your answer instead.");
      setRunning(false);
    };
    rec.onend = () => { setRunning(false); recRef.current = null; };
    try { rec.start(); recRef.current = rec; setRunning(true); }
    catch (e) { setRecErr("Couldn't start the mic. Type your answer instead."); setRunning(false); }
  }

  function stop() { if (recRef.current) { try { recRef.current.stop(); } catch (e) {} recRef.current = null; } setRunning(false); }

  async function submit() {
    if (!transcript.trim() || submitting) return;
    setSubmitting(true); setFeedback(null);
    try {
      setFeedback(await evaluateAnswer(item.prompt, transcript.trim(),
        "spoken English fluency: range, accuracy and coherence. Treat it as a transcript, so ignore punctuation and capitalisation; focus on word choice, grammar and how naturally it flows"));
    } catch (e) { setRecErr("Couldn't check your answer. Retry?"); }
    finally { setSubmitting(false); }
  }

  async function getModel() {
    setModelLoading(true);
    try { setModel((await callClaude("English speaking coach. Plain text only.",
      'Give a natural ~45-second spoken model answer (B2, 4-6 conversational sentences) to: "' + item.prompt + '". Then a new line starting "TIP:" with one thing that makes it sound fluent.')).trim()); }
    catch (e) { setModel("Couldn't load a model answer right now."); }
    finally { setModelLoading(false); }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0"), ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <SectionHead title="Speaking gym" subtitle="Answer against the clock, then get feedback on what you said." />
      {!item && !loading && <Btn onClick={load}>give me a prompt</Btn>}
      {loading && <Card><Spinner label="Finding a prompt…" /></Card>}
      {err && <ErrorNote msg={err} onRetry={load} />}
      {item && (
        <>
          <Card tone="dark">
            <Tag>speak about this</Tag>
            <p className="mt-2 font-serif text-2xl leading-snug">{item.prompt}</p>
          </Card>
          <Card className="space-y-4">
            <div>
              <Tag>lean on these</Tag>
              <ul className="mt-2 space-y-1.5 text-[15px]">{item.phrases.map((p, k) => <li key={k} className="flex gap-2"><span className="text-accent">·</span>{p}</li>)}</ul>
            </div>
            <div className="rounded-xl border border-line bg-soft p-4 text-[15px] leading-relaxed">
              <span className="font-serif font-semibold">anti freeze. </span>{item.tip}
            </div>
          </Card>
          <Card className="space-y-4 text-center">
            <div className="font-serif text-5xl tabular-nums tracking-tight">{mm}:{ss}</div>
            {SpeechRec && (
              <div>{!running
                ? <Btn onClick={startSpeaking} className="mx-auto">{transcript ? "🎤 keep speaking" : "🎤 start, speak now"}</Btn>
                : <Btn kind="ghost" onClick={stop} className="mx-auto">stop</Btn>}</div>
            )}
            {!SpeechRec && <p className="text-sm text-muted">Speech-to-text isn't available here — type your answer below and still get feedback.</p>}
            {recErr && <p className="text-sm leading-relaxed text-muted">{recErr}</p>}
            <button onClick={openInTab} className="mx-auto block text-xs text-muted underline underline-offset-2 hover:text-ink">open in a full tab for mic access</button>
          </Card>
          <Card className="space-y-3">
            <Tag>{SpeechRec ? "what you said (edit if needed)" : "type your answer"}</Tag>
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={4} disabled={running}
              placeholder={running ? "listening…" : "speak above, or type your answer here…"}
              className="w-full resize-none rounded-xl border border-line bg-white p-3 text-[15px] leading-relaxed text-ink outline-none transition-colors focus:border-ink disabled:opacity-60" />
            {!feedback && <Btn onClick={submit} disabled={!transcript.trim() || running || submitting}>{submitting ? "checking…" : "get feedback"}</Btn>}
          </Card>
          {submitting && <Card><Spinner label="Reading your answer…" /></Card>}
          {feedback && <FeedbackCard feedback={feedback} />}
          {!model && !modelLoading && <Btn kind="ghost" onClick={getModel}>show a model answer to compare</Btn>}
          {modelLoading && <Card><Spinner label="Writing a model answer…" /></Card>}
          {model && <Card><Tag>model answer</Tag><p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed">{model}</p></Card>}
          <Btn onClick={load}>new prompt</Btn>
        </>
      )}
    </div>
  );
}

const WTASKS = [
  { id: "opinion", label: "opinion paragraph", brief: "a short opinion paragraph (4-6 sentences) giving and defending a view" },
  { id: "email", label: "formal email", brief: "a short formal email (4-6 sentences) with an appropriate greeting and sign-off" },
  { id: "story", label: "short story", brief: "a short narrative paragraph (4-6 sentences) telling what happened" },
  { id: "proscons", label: "pros & cons", brief: "a balanced paragraph (4-6 sentences) weighing two sides before a conclusion" },
  { id: "describe", label: "describe a place", brief: "a vivid descriptive paragraph (4-6 sentences) about a place" },
];

function WritingGym() {
  const [wtask, setWtask] = useState(WTASKS[0]);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const seenRef = useRef([]);

  const load = useCallback(async (taskArg) => {
    const t = taskArg || wtask;
    setLoading(true); setErr(null); setItem(null); setTyped(""); setFeedback(null);
    try {
      const sys = "You set short writing tasks for a learner moving from B1 to B2. Reply with ONLY a JSON object, no markdown.";
      const ask = 'Give one concrete writing prompt for ' + t.brief + '. Return {"prompt": the task in one or two sentences, "requirements": array of 2-3 short concrete requirements (e.g. "use at least one linking word", "give one example")}. Keep it everyday, not academic.' + freshness(seenRef.current, "prompts");
      const parsed = parseJSON(await callClaude(sys, ask));
      seenRef.current.push(parsed.prompt);
      setItem(parsed);
    } catch (e) { setErr("Couldn't load a prompt. Retry?"); }
    finally { setLoading(false); }
  }, [wtask]);

  function changeTask(t) { if (t.id === wtask.id) return; setWtask(t); if (item || loading) load(t); }
  async function submit() {
    if (!typed.trim() || submitting) return;
    setSubmitting(true); setFeedback(null);
    try {
      const req = (item.requirements || []).join("; ");
      const fb = await evaluateAnswer(
        item.prompt + (req ? " Requirements: " + req + "." : ""),
        typed.trim(),
        "structure, cohesion, grammatical range and task achievement; in the note give a CEFR-style band (B1, B1+, B2) and one focus tip"
      );
      setFeedback(fb);
    } catch (e) { setErr("Couldn't check your writing. Retry?"); }
    finally { setSubmitting(false); }
  }
  const words = typed.trim() ? typed.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      <SectionHead title="Writing" subtitle="Write a short piece, then get real feedback on it." />
      <div className="flex flex-wrap gap-2">
        {WTASKS.map((t) => <Chip key={t.id} on={t.id === wtask.id} onClick={() => changeTask(t)}>{t.label}</Chip>)}
      </div>
      {!item && !loading && <Btn onClick={() => load()}>give me a prompt</Btn>}
      {loading && <Card><Spinner label="Setting a writing task…" /></Card>}
      {err && <ErrorNote msg={err} onRetry={() => (item ? submit() : load())} />}

      {item && !loading && (
        <>
          <Card tone="dark">
            <Tag>write about this</Tag>
            <p className="mt-2 font-serif text-2xl leading-snug">{item.prompt}</p>
          </Card>
          {item.requirements && item.requirements.length > 0 && (
            <Card>
              <Tag>include</Tag>
              <ul className="mt-2 space-y-1.5 text-[15px]">{item.requirements.map((r, k) => <li key={k} className="flex gap-2"><span className="text-accent">·</span>{r}</li>)}</ul>
            </Card>
          )}
          <Card className="space-y-3">
            <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={6} disabled={!!feedback}
              placeholder="write your answer here…"
              className="w-full resize-none rounded-xl border border-line bg-white p-3 text-[15px] leading-relaxed text-ink outline-none transition-colors focus:border-ink disabled:opacity-60" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">{words} {words === 1 ? "word" : "words"}</span>
              {!feedback && <Btn onClick={submit} disabled={!typed.trim() || submitting}>{submitting ? "checking…" : "get feedback"}</Btn>}
            </div>
          </Card>
          {submitting && <Card><Spinner label="Reading your writing…" /></Card>}
          {feedback && (
            <>
              <FeedbackCard feedback={feedback} />
              <Btn onClick={() => load()}>new prompt</Btn>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ReviewTab() {
  const [due, setDue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => { getDue().then(setDue); }, []);

  const cur = due && due[idx];
  function advance() { setPicked(null); setRevealed(false); setIdx((n) => n + 1); }
  function gradeGrammar(opt) {
    if (picked) return;
    setPicked(opt);
    updateReview(cur.id, opt === cur.answer);
    setReviewed((n) => n + 1);
  }
  function gradeVocab(gotIt) {
    updateReview(cur.id, gotIt);
    setReviewed((n) => n + 1);
    advance();
  }

  if (due === null) return <div className="space-y-6"><SectionHead title="Review" subtitle="The things you got wrong, brought back when they're due." /><Card><Spinner label="Checking your deck…" /></Card></div>;

  return (
    <div className="space-y-6">
      <SectionHead title="Review" subtitle="The things you got wrong, brought back when they're due." />
      {due.length === 0 ? (
        <Card className="text-center">
          <p className="font-serif text-2xl">Nothing due right now.</p>
          <p className="mt-2 text-sm text-muted">Miss a grammar question or a vocab word and it'll show up here, then again on a widening schedule.</p>
        </Card>
      ) : idx >= due.length ? (
        <Card className="text-center">
          <div className="font-serif text-5xl text-accent">{reviewed}</div>
          <p className="mt-2 text-sm text-muted">reviewed. The ones you knew won't be back for a while.</p>
        </Card>
      ) : (
        <>
          <Tag>{idx + 1} / {due.length} due</Tag>
          {cur.type === "grammar" ? (
            <Card className="space-y-4">
              <p className="font-serif text-2xl leading-snug">{cur.sentence}</p>
              <div className="flex flex-col gap-2.5">
                {cur.options.map((opt) => <OptionBtn key={opt} state={optState(picked != null, opt === cur.answer, opt === picked)} onClick={() => gradeGrammar(opt)}>{opt}</OptionBtn>)}
              </div>
              {picked && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-line bg-soft p-4 text-[15px] leading-relaxed"><span className="font-serif font-semibold">why. </span>{cur.why}</div>
                  <Btn onClick={advance}>{idx + 1 < due.length ? "next" : "finish"}</Btn>
                </div>
              )}
            </Card>
          ) : (
            <Card className="space-y-4">
              <div>
                <Tag>do you remember this word?</Tag>
                <p className="mt-1.5 font-serif text-2xl leading-snug">{cur.definition}</p>
              </div>
              {!revealed ? (
                <Btn kind="ghost" onClick={() => setRevealed(true)}>reveal</Btn>
              ) : (
                <>
                  <div>
                    <span className="font-serif text-2xl">{cur.word}</span>
                    {cur.example && <p className="mt-1.5 text-[15px] italic leading-relaxed text-muted">“{cur.example}”</p>}
                  </div>
                  <div className="flex gap-3">
                    <Btn onClick={() => gradeVocab(true)}>I knew it</Btn>
                    <Btn kind="ghost" onClick={() => gradeVocab(false)}>I forgot</Btn>
                  </div>
                </>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Settings() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    chrome.storage.local.get("anthropicApiKey").then(({ anthropicApiKey }) => {
      if (anthropicApiKey) setKey(anthropicApiKey);
    });
  }, []);

  async function save() {
    await chrome.storage.local.set({ anthropicApiKey: key.trim() });
    setStatus("Saved"); setTimeout(() => setStatus(""), 2000);
  }
  async function clear() {
    await chrome.storage.local.remove("anthropicApiKey");
    setKey(""); setStatus("Cleared"); setTimeout(() => setStatus(""), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionHead title="Settings" subtitle="Your Anthropic API key, stored locally in this browser." />
      <Card className="space-y-4">
        <div>
          <Tag>anthropic api key</Tag>
          <input type={show ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-..."
            className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-mono text-sm text-ink outline-none transition-colors focus:border-ink" />
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" className="h-4 w-4 accent-accent" checked={show} onChange={(e) => setShow(e.target.checked)} /> show key
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Btn onClick={save} disabled={!key.trim()}>save</Btn>
          <Btn kind="ghost" onClick={clear}>clear</Btn>
          <span className="text-sm text-accent">{status}</span>
        </div>
      </Card>
      <p className="text-sm leading-relaxed text-muted">
        Get a key at console.anthropic.com, under API keys. It is sent only to api.anthropic.com when you use the trainer. Keep it private.
      </p>
    </div>
  );
}

const NAV = [
  { id: "home", label: "home" }, { id: "accent", label: "listening" },
  { id: "grammar", label: "grammar" }, { id: "vocab", label: "vocabulary" }, { id: "speak", label: "speaking" },
  { id: "write", label: "writing" }, { id: "review", label: "review" },
  { id: "settings", label: "settings" },
];

export default function App() {
  const [tab, setTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const voices = useVoices();
  function go(id) { setTab(id); setMenuOpen(false); }
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-5 py-3.5">
          <button onClick={() => go("home")} className="font-serif text-xl tracking-tight">english trainer</button>
          <nav className="ml-auto hidden items-center gap-0.5 lg:flex">
            {NAV.map((t) => (
              <button key={t.id} onClick={() => go(t.id)}
                className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${tab === t.id ? "font-medium text-accent" : "text-muted hover:text-ink"}`}>
                {t.label}
              </button>
            ))}
          </nav>
          <button onClick={() => setMenuOpen((o) => !o)} aria-label="menu" aria-expanded={menuOpen}
            className="ml-auto rounded-md p-1.5 text-ink transition-colors hover:text-accent lg:hidden">
            <Icon name={menuOpen ? "close" : "menu"} className="h-6 w-6" />
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-line bg-paper lg:hidden">
            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-1 px-3 py-3 sm:grid-cols-3">
              {NAV.map((t) => (
                <button key={t.id} onClick={() => go(t.id)}
                  className={`rounded-md px-3 py-2.5 text-left text-sm transition-colors ${tab === t.id ? "bg-soft font-medium text-accent" : "text-muted hover:bg-soft hover:text-ink"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10 pb-16">
        {tab === "home" && <Home go={setTab} />}
        {tab === "accent" && <AccentTrainer voices={voices} />}
        {tab === "grammar" && <GrammarTrainer />}
        {tab === "vocab" && <VocabTrainer />}
        {tab === "speak" && <SpeakingGym />}
        {tab === "write" && <WritingGym />}
        {tab === "review" && <ReviewTab />}
        {tab === "settings" && <Settings />}
      </main>
    </div>
  );
}
