import { useState, useEffect, useRef } from "react";

export function Countdown({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  const cb = useRef(onExpire); cb.current = onExpire;
  useEffect(() => { setLeft(seconds); }, [seconds]);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  useEffect(() => { if (left === 0) cb.current && cb.current(); }, [left]);
  const low = left <= 5;
  return <span className={`font-serif text-2xl tabular-nums ${low ? "text-accent" : "text-ink"}`}>{Math.max(0, left)}s</span>;
}
