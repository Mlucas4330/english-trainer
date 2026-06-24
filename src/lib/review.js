import { hashId } from "./text.js";

export function grammarMiss(focus, q) {
  return { id: hashId("g", q.sentence), type: "grammar", focus: focus.label, sentence: q.sentence, options: q.options, answer: q.answer, why: q.why };
}

export function vocabMiss(theme, w) {
  return { id: hashId("v", w.word), type: "vocab", theme, word: w.word, definition: w.definition, example: w.example };
}
