import { pick } from "../lib/text.js";
import { ACCENTS } from "../config/prompts.js";
import { genListening, genGrammar, genVocab, genShadowing, genSpeaking, genWriting } from "../api/generators.js";

const LISTEN_N = 2, GRAMMAR_N = 3, VOCAB_QN = 4, SHADOW_N = 2;

async function loadListen(level, seen) {
  const items = [];
  for (let k = 0; k < LISTEN_N; k++) {
    const acc = pick(ACCENTS);
    const it = await genListening(level, acc, seen);
    items.push({ ...it, accent: acc });
  }
  return { data: { items }, seen: items.map((i) => i.spoken) };
}

async function loadGrammar(level, seen) {
  const qs = await genGrammar(level, GRAMMAR_N, seen);
  return { data: { qs }, seen: qs.map((q) => q.sentence) };
}

async function loadVocab(level, seen) {
  const words = await genVocab(level, seen);
  const order = words.map((_, k) => k).sort(() => Math.random() - 0.5).slice(0, Math.min(VOCAB_QN, words.length));
  const opts = order.map((target) => {
    const o = [words[target].word];
    const rest = words.map((w) => w.word).filter((w) => w !== words[target].word);
    while (o.length < Math.min(4, words.length) && rest.length) o.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
    return o.sort(() => Math.random() - 0.5);
  });
  return { data: { words, order, opts }, seen: words.map((w) => w.word) };
}

async function loadShadow(level, seen) {
  const items = await genShadowing(level, SHADOW_N, seen);
  return { data: { items }, seen: items.map((i) => i.text) };
}

async function loadSpeak(level, seen) {
  const item = await genSpeaking(level, seen);
  return { data: item, seen: [item.prompt] };
}

async function loadWrite(level, seen) {
  const item = await genWriting(level, seen);
  return { data: item, seen: [item.prompt] };
}

export const LOADERS = {
  listen: loadListen,
  grammar: loadGrammar,
  vocab: loadVocab,
  shadow: loadShadow,
  speak: loadSpeak,
  write: loadWrite,
};
