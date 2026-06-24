import { Card } from "../ui/Card.jsx";
import { Tag } from "../ui/Tag.jsx";
import { Chip } from "../ui/Chip.jsx";
import { Btn } from "../ui/Btn.jsx";
import { Icon } from "../ui/Icon.jsx";
import { ErrorNote } from "../ui/ErrorNote.jsx";
import { LEVELS } from "../config/levels.js";
import { STATIONS } from "../config/stations.js";

export function StartScreen({ level, setLevel, onStart, onSettings, hasKey }) {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-serif text-[52px] leading-[1.02] tracking-tight">English<br />workout.</h1>
        <p className="text-lg text-muted">Six stations, one timed round. No skipping.</p>
      </header>
      {!hasKey && <ErrorNote msg="Set your Anthropic API key in settings before starting." />}
      <Card className="space-y-4">
        <Tag>difficulty</Tag>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => <Chip key={l.id} on={l.id === level.id} onClick={() => setLevel(l)}>{l.label}</Chip>)}
        </div>
        <p className="text-sm leading-relaxed text-muted">{level.label} · {level.blurb}. Higher levels mean harder content and less time per question.</p>
      </Card>
      <div className="space-y-4">
        <ol className="space-y-2 text-[15px] text-muted">
          {STATIONS.map((s, k) => (
            <li key={s.id} className="flex items-center gap-3">
              <span className="text-ink"><Icon name={s.icon} className="h-5 w-5" /></span>
              <span><span className="text-muted">{k + 1}.</span> {s.label}</span>
            </li>
          ))}
        </ol>
        <Btn onClick={onStart} disabled={!hasKey} className="px-8 py-3 text-base">START</Btn>
        <button onClick={onSettings} className="block w-fit text-sm text-muted underline underline-offset-2 hover:text-ink">settings</button>
      </div>
    </div>
  );
}
