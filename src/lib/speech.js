export function findVoice(voices, langs) {
  for (const l of langs) { const v = voices.find((x) => x.lang && x.lang.toLowerCase() === l.toLowerCase()); if (v) return v; }
  for (const l of langs) { const b = l.split("-")[0].toLowerCase(); const v = voices.find((x) => x.lang && x.lang.toLowerCase().startsWith(b)); if (v) return v; }
  return null;
}
