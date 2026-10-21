import { test, expect } from "@playwright/test";
import { loadQuestions } from "./helpers.js";

// Data checks: no browser needed, so they run once (phone project only).
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "data checks run once");
});

const questions = loadQuestions();

test("the bank has 20 multiple choice, 10 true/false and 10 fill-in-the-blank questions", () => {
  const count = (kind) => questions.filter((q) => q.kind === kind).length;
  expect(count("choice")).toBe(20);
  expect(count("truefalse")).toBe(10);
  expect(count("blank")).toBe(10);
  expect(questions.length).toBe(40);
});

test("every question has a valid answer", () => {
  for (const q of questions) {
    if (q.kind === "truefalse") {
      expect(typeof q.answer, q.text).toBe("boolean");
    } else {
      expect(q.options.length, q.text).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size, `duplicate options: ${q.text}`).toBe(q.options.length);
      expect(q.options[q.answer], q.text).toBeTruthy();
    }
    if (q.kind === "blank") {
      expect(q.text.split("____").length, q.text).toBe(2);
    }
  }
});

test("every question has a known topic", () => {
  const topics = ["heart", "blood", "vessels", "circulation", "health"];
  for (const q of questions) {
    expect(topics, q.text).toContain(q.topic);
  }
});

test("no two questions have the same text", () => {
  expect(new Set(questions.map((q) => q.text)).size).toBe(questions.length);
});

test("all question text is Arabic, with Arabic digits", () => {
  for (const q of questions) {
    for (const text of [q.text, q.explanation || "", ...(q.options || [])]) {
      expect(text, "English letters or Western digits").not.toMatch(/[A-Za-z0-9]/);
    }
  }
});
