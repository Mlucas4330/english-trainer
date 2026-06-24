import { useState, useEffect } from "react";
import { SectionHead } from "../ui/SectionHead.jsx";
import { Card } from "../ui/Card.jsx";
import { Tag } from "../ui/Tag.jsx";
import { Btn } from "../ui/Btn.jsx";

export function Settings() {
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
