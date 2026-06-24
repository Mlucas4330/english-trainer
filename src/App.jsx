import { useState, useEffect } from "react";
import { LEVELS } from "./config/levels.js";
import { useVoices } from "./hooks/useVoices.js";
import { StartScreen } from "./screens/StartScreen.jsx";
import { ResultsScreen } from "./screens/ResultsScreen.jsx";
import { Settings } from "./screens/Settings.jsx";
import { Round } from "./round/Round.jsx";

export default function App() {
  const [phase, setPhase] = useState("start");
  const [level, setLevel] = useState(LEVELS[0]);
  const [results, setResults] = useState(null);
  const [hasKey, setHasKey] = useState(true);
  const voices = useVoices();

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage)
      chrome.storage.local.get("anthropicApiKey").then(({ anthropicApiKey }) => setHasKey(!!anthropicApiKey));
  }, [phase]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-5 py-3.5">
          <button onClick={() => setPhase("start")} className="font-serif text-xl tracking-tight">english trainer</button>
          {phase === "round" && <span className="ml-auto text-sm text-muted">level {level.label}</span>}
          {phase !== "round" && phase !== "settings" && <button onClick={() => setPhase("settings")} className="ml-auto text-sm text-muted transition-colors hover:text-ink">settings</button>}
          {phase === "settings" && <button onClick={() => setPhase("start")} className="ml-auto text-sm text-muted transition-colors hover:text-ink">← back</button>}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10 pb-16">
        {phase === "start" && <StartScreen level={level} setLevel={setLevel} hasKey={hasKey} onStart={() => setPhase("round")} onSettings={() => setPhase("settings")} />}
        {phase === "round" && <Round level={level} voices={voices} onComplete={(r) => { setResults(r); setPhase("results"); }} />}
        {phase === "results" && <ResultsScreen results={results} level={level} onRestart={() => setPhase("start")} />}
        {phase === "settings" && <Settings />}
      </main>
    </div>
  );
}
