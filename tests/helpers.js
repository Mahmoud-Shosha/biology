import { test as base, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Every test fails if the page throws a JavaScript error.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await use(page);
    expect(errors, "JavaScript errors on the page").toEqual([]);
  },
});
export { expect };

export function loadQuestions() {
  const source = readFileSync(new URL("../js/questions.js", import.meta.url), "utf8");
  const context = {};
  vm.runInNewContext(`${source}\nthis.QUESTIONS = QUESTIONS;`, context);
  return context.QUESTIONS;
}

const bank = loadQuestions();

export function rightAnswer(question) {
  if (question.kind === "truefalse") {
    return question.answer ? "صواب" : "خطأ";
  }
  return question.options[question.answer];
}

// Picks the right (or a wrong) option of the question on screen.
export async function answer(page, correct = true) {
  const text = await page.locator("#question-text").textContent();
  const question = bank.find((q) => q.text === text);
  expect(question, `question in the bank: ${text}`).toBeTruthy();
  const options = await page.locator("#options .option-text").allTextContents();
  const index = options.findIndex((option) => (option === rightAnswer(question)) === correct);
  await page.locator("#options .option").nth(index).click();
  return question;
}

export async function startExam(page) {
  await page.getByRole("button", { name: "ابدأ الاختبار" }).click();
  await expect(page.locator('[data-screen="exam"]')).toBeVisible();
}

export async function goToQuestion(page, index) {
  await page.locator(`.dot[data-index="${index}"]`).click();
}

// What the user can see: no English letters and no Western digits.
export async function expectArabicOnly(page) {
  const text = await page.locator("body").innerText();
  expect(text.match(/[A-Za-z0-9]+/g) || [], "English letters or Western digits on screen").toEqual([]);
}

export async function expectNoSideScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page wider than the screen").toBeLessThanOrEqual(0);
}
