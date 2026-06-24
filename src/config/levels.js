export const LEVELS = [
  { id: "b2", label: "B2", cefr: "B2", blurb: "Upper-intermediate", mult: 1.0 },
  { id: "b2p", label: "B2+", cefr: "strong B2 (B2+)", blurb: "Pushing past B2", mult: 0.82 },
  { id: "c1", label: "C1", cefr: "C1", blurb: "Advanced", mult: 0.68 },
  { id: "c1p", label: "C1+", cefr: "C1+ approaching C2", blurb: "Near-native challenge", mult: 0.55 },
];

export const secsFor = (base, level) => Math.max(8, Math.round(base * level.mult));
