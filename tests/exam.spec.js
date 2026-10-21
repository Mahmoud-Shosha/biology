import {
  test,
  expect,
  loadQuestions,
  answer,
  rightAnswer,
  startExam,
  goToQuestion,
  expectArabicOnly,
  expectNoSideScroll,
} from "./helpers.js";

const STORE_KEY = "wife-exam:current";
const bank = loadQuestions();

test("welcome screen: Arabic, right to left, photo, fits the screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("أهلًا بك في الاختبار");
  await expect(page.locator(".portrait")).not.toHaveClass(/portrait-empty/);
  await expect(page.getByRole("button", { name: "ابدأ الاختبار" })).toBeInViewport();
  await expectArabicOnly(page);
  await expectNoSideScroll(page);
});

test("an exam has 10 multiple choice and 5 true/false questions, all different", async ({ page }) => {
  await page.goto("/");
  await startExam(page);
  await expect(page.locator(".dot")).toHaveCount(15);

  const kinds = [];
  const texts = new Set();
  const topicLabels = { heart: "القلب", blood: "الدم", vessels: "الأوعية الدموية", circulation: "الدورة الدموية", health: "صحة القلب" };
  for (let i = 0; i < 15; i++) {
    await goToQuestion(page, i);
    const kind = await page.locator("#exam-kind").textContent();
    kinds.push(kind);
    const text = await page.locator("#question-text").textContent();
    texts.add(text);
    const question = bank.find((q) => q.text === text);
    await expect(page.locator("#topic-name")).toHaveText(topicLabels[question.topic]);
    await expect(page.locator("#exam-card")).toHaveAttribute("data-topic", question.topic);
    await expect(page.locator("#options .option")).toHaveCount(kind === "صواب أو خطأ" ? 2 : 3);
  }
  // Question circles stay big enough for a finger.
  const smallest = await page.locator(".dot").evaluateAll((dots) => Math.min(...dots.map((d) => d.getBoundingClientRect().width)));
  expect(smallest, "question circle width").toBeGreaterThanOrEqual(30);
  expect(kinds.filter((k) => k === "اختيار من متعدد")).toHaveLength(10);
  expect(kinds.filter((k) => k === "صواب أو خطأ")).toHaveLength(5);
  expect(texts.size).toBe(15);
  await expectArabicOnly(page);
  await expectNoSideScroll(page);
});

test("next and previous move between questions", async ({ page }) => {
  await page.goto("/");
  await startExam(page);
  await expect(page.getByRole("button", { name: "السابق" })).toBeDisabled();
  await page.getByRole("button", { name: "التالي" }).click();
  await expect(page.locator("#exam-count")).toHaveText("السؤال ٢ من ١٥");
  await page.getByRole("button", { name: "السابق" }).click();
  await expect(page.locator("#exam-count")).toHaveText("السؤال ١ من ١٥");
  await goToQuestion(page, 14);
  await expect(page.locator("#next-button")).toHaveText("إنهاء الاختبار");
});

test("all answers right: full marks and confetti", async ({ page }) => {
  await page.goto("/");
  await startExam(page);
  for (let i = 0; i < 15; i++) {
    await goToQuestion(page, i);
    await answer(page, true);
  }
  await expect(page.locator(".dot.is-answered")).toHaveCount(15);
  await page.locator("#next-button").click(); // nothing unanswered: no question asked

  await expect(page.locator('[data-screen="result"]')).toBeVisible();
  await expect(page.locator("#score-value")).toHaveText("١٥ / ١٥");
  await expect(page.locator("#score-percent")).toHaveText("١٠٠٪");
  await expect(page.locator("#result-title")).toHaveText("علامة كاملة! أحسنت");
  await expect(page.locator("#score-ring")).toHaveAttribute("data-award", "trophy");
  await expect(page.locator("#timeout-note")).toBeHidden();
  await expect(page.locator(".confetti")).toBeAttached();
  await expect(page.locator('.review-item[data-status="right"]')).toHaveCount(15);
  await expectArabicOnly(page);
  await expectNoSideScroll(page);
});

test("wrong and unanswered questions show the right answer", async ({ page }) => {
  await page.goto("/");
  await startExam(page);
  const wrong = [];
  for (let i = 0; i < 5; i++) {
    await goToQuestion(page, i);
    wrong.push(await answer(page, false));
  }

  await goToQuestion(page, 14);
  await page.locator("#next-button").click();
  await expect(page.locator("#confirm")).toBeVisible();
  await expect(page.locator("#confirm-text")).toContainText("١٠");
  await page.keyboard.press("Escape");
  await expect(page.locator("#confirm")).toBeHidden();
  await page.locator("#next-button").click();
  await page.getByRole("button", { name: "نعم، أنهِ الاختبار" }).click();

  await expect(page.locator("#score-value")).toHaveText("٠ / ١٥");
  await expect(page.locator("#stat-wrong")).toHaveText("٥");
  await expect(page.locator("#stat-none")).toHaveText("١٠");
  await expect(page.locator("#result-title")).toHaveText("حاول مرة أخرى");
  await expect(page.locator("#score-ring")).toHaveAttribute("data-award", "book");

  // Each wrong answer is shown with the right one (and the explanation, when there is one).
  for (const q of wrong) {
    const item = page.locator(".review-item", { has: page.locator(".review-q", { hasText: q.text }) });
    await expect(item).toHaveAttribute("data-status", "wrong");
    await expect(item.locator(".review-answer.is-right")).toContainText(rightAnswer(q));
    if (q.explanation) {
      await expect(item.locator(".review-explain")).toHaveText(q.explanation);
    }
  }
  await expect(page.locator('.review-item[data-status="none"] .review-answer.is-right')).toHaveCount(10);

  await page.locator('[data-filter="right"]').click();
  await expect(page.locator(".review-item:visible")).toHaveCount(0);
  await page.locator('[data-filter="wrong"]').click();
  await expect(page.locator(".review-item:visible")).toHaveCount(15);
  await expectArabicOnly(page);
  await expectNoSideScroll(page);
});

test("when the 5 minutes run out the exam is submitted", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await startExam(page);
  await expect(page.locator("#timer-text")).toHaveText("٥:٠٠");

  await page.clock.fastForward("04:10");
  await expect(page.locator("#timer-text")).toHaveText("٠:٥٠");
  await expect(page.locator("#timer")).toHaveClass(/is-low/);
  await expect(page.locator("#timer-live")).toHaveText("بقيت دقيقة واحدة أو أقل");

  await page.clock.fastForward("00:51");
  await expect(page.locator('[data-screen="result"]')).toBeVisible();
  await expect(page.locator("#timeout-note")).toBeVisible();
  await expect(page.locator("#stat-time")).toHaveText("٥:٠٠");
});

test("try again starts a new exam with a full timer", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await startExam(page);
  await page.clock.fastForward("05:01");
  await page.getByRole("button", { name: "إعادة الاختبار" }).click();
  await expect(page.locator("#exam-count")).toHaveText("السؤال ١ من ١٥");
  await expect(page.locator("#timer-text")).toHaveText("٥:٠٠");
  await expect(page.locator(".dot.is-answered")).toHaveCount(0);
});

test("a reload keeps the exam, its answers and its time", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await startExam(page);
  await answer(page);
  await goToQuestion(page, 1);
  await answer(page);
  await goToQuestion(page, 3);
  const question = await page.locator("#question-text").textContent();
  await page.clock.fastForward("01:00");

  await page.reload();
  await expect(page.locator('[data-screen="exam"]')).toBeVisible();
  await expect(page.locator("#exam-count")).toHaveText("السؤال ٤ من ١٥");
  await expect(page.locator("#question-text")).toHaveText(question);
  await expect(page.locator(".dot.is-answered")).toHaveCount(2);
  await expect(page.locator("#timer-text")).not.toHaveText("٥:٠٠");
});

test("an exam whose time ran out while the page was closed opens on the result", async ({ page }) => {
  await page.goto("/");
  await startExam(page);
  await answer(page);
  await page.evaluate((key) => {
    const saved = JSON.parse(sessionStorage.getItem(key));
    saved.startedAt -= 10 * 60 * 1000;
    saved.deadline -= 10 * 60 * 1000;
    sessionStorage.setItem(key, JSON.stringify(saved));
  }, STORE_KEY);

  await page.reload();
  await expect(page.locator('[data-screen="result"]')).toBeVisible();
  await expect(page.locator("#timeout-note")).toBeVisible();
  await expect(page.locator(".review-item")).toHaveCount(15);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), STORE_KEY)).toBeNull();
});

test("the exam works with the keyboard alone", async ({ page }) => {
  await page.goto("/");
  const start = page.getByRole("button", { name: "ابدأ الاختبار" });
  for (let i = 0; i < 10 && !(await start.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(start).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#question-text")).toBeFocused();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(page.locator("#options .option").first()).toHaveClass(/is-selected/);
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#options .option").nth(1)).toHaveClass(/is-selected/);

  await page.keyboard.press("Tab"); // "السابق" is disabled, so focus goes to "التالي"
  await expect(page.locator("#next-button")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#exam-count")).toHaveText("السؤال ٢ من ١٥");
  await expect(page.locator("#question-text")).toBeFocused();
});
