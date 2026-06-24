import { callClaude, parseJSON } from "./claude.js";
import { pick, freshness } from "../lib/text.js";
import { LISTEN_TOPICS, GRAMMAR_CONTEXTS, GRAMMAR_TOPICS, VOCAB_ANGLES, VTHEMES, SPEAK_ANGLES, WRITE_BRIEFS } from "../config/prompts.js";

export async function genListening(level, acc, seen) {
  const sys = "You generate realistic listening practice for a B2/C1 English learner who must understand non-native speakers at speed. Reply with ONLY a JSON object, no markdown.";
  const ask = 'Write ONE everyday English message (2-3 sentences, ~24-34 words) as a ' + acc.l1 +
    ' speaker at upper-intermediate level would REALISTICALLY say it, with 2 to 4 natural non-native errors (wrong prepositions, perfect/past slips, article and word-order issues) and some idiomatic or less common vocabulary. Pitch the difficulty for a ' + level.cefr +
    ' listener. Must still be understandable but genuinely challenging. Return {"spoken": message with errors, "meant": one clear sentence, "fixed": same in correct standard English, "quirks": array up to 4 like "since two years -> for two years"}. Only JSON.' +
    ' Make it about ' + pick(LISTEN_TOPICS) + '.' + freshness(seen, "messages");
  return parseJSON(await callClaude(sys, ask));
}

export async function genGrammar(level, n, seen) {
  const topic = pick(GRAMMAR_TOPICS);
  const ask = 'Create ' + n + ' fill-in-the-blank multiple-choice questions about ' + topic + ' at ' + level.cefr +
    ' level. Each: {"sentence": a fairly complex sentence with one blank written as "___", "options": array of 4 short options, "answer": exact correct option, "why": one-sentence rule under 22 words}. Make the distractors genuinely tempting and close in meaning, not obviously wrong. Set every sentence in the context of ' + pick(GRAMMAR_CONTEXTS) + '. Return ONLY a JSON array.' + freshness(seen, "sentences");
  return parseJSON(await callClaude("You design challenging grammar drills at " + level.cefr + " level. Reply with ONLY JSON, no markdown.", ask));
}

export async function genVocab(level, seen) {
  const th = pick(VTHEMES);
  const ask = 'Give 5 useful, less common ' + level.cefr + '-level English words on the theme "' + th + '". ' + pick(VOCAB_ANGLES) +
    ' Prefer words a B1 learner would not yet know but a fluent speaker uses naturally. Each: {"word", "pos": short part of speech, "definition": clear under 14 words, "example": natural sentence}. Avoid the most basic words; favour precise, idiomatic ones. Return only the JSON array.' + freshness(seen, "words");
  return parseJSON(await callClaude("You build " + level.cefr + " vocabulary. Reply with ONLY a JSON array, no markdown.", ask));
}

export async function genShadowing(level, n, seen) {
  const ask = 'Give ' + n + ' natural, idiomatic English sentences (10-18 words each) the way a fluent native speaker really talks — include connected speech, contractions and real chunks. Pitch them at ' + level.cefr +
    ' level. Each: {"text": the sentence, "note": one tip under 12 words on the rhythm, stress or linking to copy}. Return only the JSON array.' + freshness(seen, "lines");
  return parseJSON(await callClaude("You write native English lines for shadowing practice at " + level.cefr + " level. Reply with ONLY a JSON array, no markdown.", ask));
}

export async function genSpeaking(level, seen) {
  const ask = 'Give one concrete speaking prompt answerable in 45-60 seconds that demands a real ' + level.cefr +
    ' answer — pushing the speaker to justify, compare, speculate or narrate in detail, not just state a preference. Make it about ' + pick(SPEAK_ANGLES) +
    '. Return {"prompt", "phrases": array of 3 useful sentence-starters, "tip": one tip under 20 words on adding range or precision}. Everyday, not academic. Only JSON.' + freshness(seen, "prompts");
  return parseJSON(await callClaude("You coach a " + level.cefr + " learner who wants to speak more fluently and precisely. Reply with ONLY a JSON object, no markdown.", ask));
}

export async function genWriting(level, seen) {
  const brief = pick(WRITE_BRIEFS);
  const ask = 'Give one concrete writing prompt for ' + brief + ' that demands real ' + level.cefr +
    ' range. Return {"prompt": the task in one or two sentences, "requirements": array of 2-3 concrete requirements that stretch the writer (e.g. "use a concessive linker like although or whereas", "include a conditional", "use a precise topic-specific word")}. Keep it everyday, not academic.' + freshness(seen, "prompts");
  return parseJSON(await callClaude("You set writing tasks at " + level.cefr + " level. Reply with ONLY a JSON object, no markdown.", ask));
}
