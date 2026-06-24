import { Card } from "../ui/Card.jsx";
import { Tag } from "../ui/Tag.jsx";
import { Btn } from "../ui/Btn.jsx";
import { Countdown } from "../ui/Countdown.jsx";
import { SoftNote } from "../ui/SoftNote.jsx";
import { INPUT_TEXTAREA } from "../ui/styles.js";
import { openInTab } from "../lib/chrome.js";
import { secsFor } from "../config/levels.js";
import { useRecorder, SpeechRec } from "../hooks/useRecorder.js";

export function SpeakStage({ data, level, onDone }) {
  const item = data;
  const rec = useRecorder();
  const secs = secsFor(110, level);

  function finish() {
    rec.stop();
    onDone({ type: "speak", label: "Speaking", prompt: item.prompt, transcript: rec.transcript,
      criteria: "spoken English fluency: range, accuracy and coherence. Treat it as a transcript, so ignore punctuation and capitalisation; focus on word choice, grammar and how naturally it flows" });
  }

  return (
    <div className="space-y-4">
      <Card tone="dark" className="space-y-3">
        <div className="flex items-center justify-between">
          <Tag>speak about this · {secs}s</Tag>
          {rec.running && <Countdown seconds={secs} onExpire={finish} />}
        </div>
        <p className="font-serif text-2xl leading-snug">{item.prompt}</p>
      </Card>
      <Card className="space-y-3">
        <div><Tag>lean on these</Tag><ul className="mt-2 space-y-1.5 text-[15px]">{item.phrases.map((p, k) => <li key={k} className="flex gap-2"><span className="text-accent">·</span>{p}</li>)}</ul></div>
        <SoftNote heading="tip.">{item.tip}</SoftNote>
      </Card>
      <Card className="space-y-3">
        {SpeechRec ? (rec.running
          ? <Btn kind="ghost" onClick={finish}>stop &amp; finish</Btn>
          : <Btn onClick={rec.start}>🎤 start speaking ({secs}s)</Btn>)
          : <p className="text-sm text-muted">No mic here — type your answer, or <button onClick={openInTab} className="underline underline-offset-2">open in a full tab</button>.</p>}
        {rec.recErr && <p className="text-sm leading-relaxed text-muted">{rec.recErr}</p>}
        <textarea value={rec.transcript} onChange={(e) => rec.setTranscript(e.target.value)} rows={4} disabled={rec.running}
          placeholder={rec.running ? "listening…" : "what you said appears here — or type it"} className={INPUT_TEXTAREA} />
        <Btn onClick={finish} disabled={!rec.transcript.trim() && !rec.running}>finish → next station</Btn>
      </Card>
    </div>
  );
}
