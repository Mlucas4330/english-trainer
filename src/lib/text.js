export function hashId(prefix, s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return prefix + "_" + (h >>> 0).toString(36);
}

export function normWords(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").split(/\s+/).filter(Boolean);
}

export function alignHits(target, said) {
  const n = target.length, m = said.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = target[i] === said[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hits = new Array(n).fill(false);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (target[i] === said[j]) { hits[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return hits;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function freshness(prev, label) {
  const seed = Math.random().toString(36).slice(2, 8);
  let s = " Make this fresh and varied, clearly different from earlier ones; avoid the most obvious or repeated choices. Variation seed: " + seed + ".";
  if (prev && prev.length) s += " You have ALREADY used the following " + label + " in this session, so you MUST NOT repeat any of them or close variants: " + prev.slice(-50).join(" | ") + ".";
  return s + " Return only the JSON, nothing else.";
}
