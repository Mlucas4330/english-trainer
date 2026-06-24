import { useState, useEffect, useRef, useCallback } from "react";
import { STATIONS } from "../config/stations.js";
import { LOADERS } from "../round/loaders.js";

function upd(slots, k, patch) {
  const copy = slots.slice();
  copy[k] = { ...copy[k], ...patch };
  return copy;
}

export function useStationPipeline(level) {
  const [slots, setSlots] = useState(() => STATIONS.map(() => ({ status: "idle", data: null, error: null })));
  const seen = useRef([]);
  const started = useRef(new Set());
  const alive = useRef(true);

  const startSlot = useCallback((k, chain) => {
    if (started.current.has(k)) return;
    started.current.add(k);
    setSlots((s) => upd(s, k, { status: "pending", error: null }));
    LOADERS[STATIONS[k].id](level, seen.current).then(
      ({ data, seen: got }) => {
        if (!alive.current) return;
        seen.current.push(...got);
        setSlots((s) => upd(s, k, { status: "ready", data }));
        if (chain && k + 1 < STATIONS.length) startSlot(k + 1, true);
      },
      (error) => {
        if (!alive.current) return;
        setSlots((s) => upd(s, k, { status: "error", error }));
        if (chain && k + 1 < STATIONS.length) startSlot(k + 1, true);
      }
    );
  }, [level]);

  useEffect(() => {
    alive.current = true;
    startSlot(0, true);
    return () => { alive.current = false; };
  }, [startSlot]);

  const retry = useCallback((k) => { started.current.delete(k); startSlot(k, false); }, [startSlot]);

  return { slots, retry };
}
