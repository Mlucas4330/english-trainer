import { useState, useEffect, useRef, useCallback } from "react";

export const SpeechRec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export function useRecorder() {
  const [transcript, setTranscript] = useState("");
  const [running, setRunning] = useState(false);
  const [recErr, setRecErr] = useState(null);
  const recRef = useRef(null), baseRef = useRef("");
  useEffect(() => () => { if (recRef.current) { try { recRef.current.stop(); } catch (e) {} } }, []);
  const start = useCallback(() => {
    setRecErr(null);
    if (!SpeechRec) { setRunning(true); return; }
    const rec = new SpeechRec();
    rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true;
    baseRef.current = ""; setTranscript("");
    rec.onresult = (e) => {
      let interim = "";
      for (let k = e.resultIndex; k < e.results.length; k++) {
        const r = e.results[k];
        if (r.isFinal) baseRef.current += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setTranscript((baseRef.current + interim).replace(/\s+/g, " "));
    };
    rec.onerror = (e) => {
      const name = e && e.error ? e.error : "error";
      if (name === "not-allowed" || name === "service-not-allowed")
        setRecErr("The mic is blocked in the side panel. Open the trainer in a full tab to allow it once, or type your answer.");
      else if (name !== "no-speech" && name !== "aborted")
        setRecErr("Speech recognition error (" + name + ").");
      setRunning(false);
    };
    rec.onend = () => { setRunning(false); recRef.current = null; };
    try { rec.start(); recRef.current = rec; setRunning(true); }
    catch (e) { setRecErr("Couldn't start the mic. Type your answer instead."); setRunning(false); }
  }, []);
  const stop = useCallback(() => { if (recRef.current) { try { recRef.current.stop(); } catch (e) {} recRef.current = null; } setRunning(false); }, []);
  return { transcript, setTranscript, running, recErr, start, stop };
}
