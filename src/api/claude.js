export async function getApiKey() {
  const { anthropicApiKey } = await chrome.storage.local.get("anthropicApiKey");
  return anthropicApiKey || "";
}

export async function callClaude(system, userText, maxTokens = 1000) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("No API key set. Open the extension's Options page and paste your Anthropic API key.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages: [{ role: "user", content: userText }] }),
  });
  if (!res.ok) throw new Error("Request failed (" + res.status + ")");
  const data = await res.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

export function parseJSON(text) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const first = clean.search(/[[{]/);
  return JSON.parse(first >= 0 ? clean.slice(first) : clean);
}

export async function evaluateAnswer(task, answer, criteria) {
  const sys = "You are a precise, encouraging English coach. You judge a learner's free answer against a task. Reply with ONLY a JSON object, no markdown.";
  const ask = 'TASK: "' + task + '"\nLEARNER ANSWER: "' + answer + '"\n' +
    'Judge it on: ' + criteria + '. Be fair but hold a B2-C1 standard. ' +
    'Return {"verdict": one of "correct"|"close"|"off", "corrected": the learner answer rewritten in natural correct English (keep their meaning), "errors": array (max 4) of {"wrong": the exact problem phrase, "right": the fix, "why": rule under 18 words}, "note": one short specific encouraging line}. ' +
    'If the answer is already good, return an empty errors array and verdict "correct". Return only the JSON.';
  return parseJSON(await callClaude(sys, ask, 1500));
}
