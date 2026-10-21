// Screen switching, the exam, its timer and the result.
// Each screen is a <section data-screen="name">; one is visible at a time.
// The questions come from js/questions.js (QUESTIONS).

(function () {
  "use strict";

  // How many questions of each kind one exam takes (15 in total; the blank questions are not used).
  const EXAM_MIX = { choice: 10, truefalse: 5 };
  const EXAM_SECONDS = 5 * 60;
  const LOW_SECONDS = 60; // the timer turns red from here
  const KIND_LABELS = { choice: "اختيار من متعدد", truefalse: "صواب أو خطأ", blank: "أكمل الفراغ" };
  // Question topics: label and icon (a <symbol> in index.html). Colours are in css/style.css ([data-topic]).
  const TOPICS = {
    heart: { label: "القلب", icon: "i-heart" },
    blood: { label: "الدم", icon: "i-blood" },
    vessels: { label: "الأوعية الدموية", icon: "i-vessels" },
    circulation: { label: "الدورة الدموية", icon: "i-circulation" },
    health: { label: "صحة القلب", icon: "i-health" },
  };
  const LETTERS = ["أ", "ب", "ج", "د"];
  const BLANK = "____";
  // The running exam is kept in this tab's sessionStorage, so a reload or the back button resumes it.
  const STORE_KEY = "wife-exam:current";

  const number = new Intl.NumberFormat("ar-EG");
  const twoDigits = new Intl.NumberFormat("ar-EG", { minimumIntegerDigits: 2 });
  const $ = (id) => document.getElementById(id);
  const screens = document.querySelectorAll("[data-screen]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrowScreen = window.matchMedia("(max-width: 374px)");

  // { items: [{kind, text, options: [{text, correct}], explanation}], answers, index,
  //   startedAt, deadline, timer, shownSeconds, finishedAt, timedOut }
  let exam = null;

  function show(name, focusTarget) {
    screens.forEach((screen) => {
      screen.hidden = screen.dataset.screen !== name;
    });
    const current = document.querySelector(`[data-screen="${name}"]`);
    // Move focus to the new screen's title so screen readers announce it.
    const title = focusTarget || current.querySelector("h1, h2");
    if (title) {
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Arabic counted noun: 3-10 take the plural, 11 and up the singular accusative.
  function questionsWord(count) {
    return count >= 3 && count <= 10 ? "أسئلة" : "سؤالًا";
  }

  function clock(seconds) {
    return `${number.format(Math.floor(seconds / 60))}:${twoDigits.format(seconds % 60)}`;
  }

  function toItem(question) {
    const options =
      question.kind === "truefalse"
        ? [
            { text: "صواب", correct: question.answer === true },
            { text: "خطأ", correct: question.answer === false },
          ]
        : shuffle(question.options.map((text, i) => ({ text, correct: i === question.answer })));
    return {
      kind: question.kind,
      topic: question.topic,
      text: question.text,
      options,
      explanation: question.explanation || "",
    };
  }

  function topicOf(item) {
    return TOPICS[item.topic] || TOPICS.circulation;
  }

  function iconSvg(name, className) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${name}`);
    svg.append(use);
    return svg;
  }

  function newExam() {
    const picked = Object.entries(EXAM_MIX).flatMap(([kind, count]) =>
      shuffle(QUESTIONS.filter((q) => q.kind === kind)).slice(0, count)
    );
    const items = shuffle(picked).map(toItem);
    return { items, answers: items.map(() => null), index: 0 };
  }

  // --- Saved progress ------------------------------------------------------

  function save() {
    const { items, answers, index, startedAt, deadline } = exam;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ items, answers, index, startedAt, deadline }));
    } catch (error) {
      // Storage blocked (private mode): the exam still works, it just doesn't survive a reload.
    }
  }

  function forget() {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch (error) {
      // Nothing saved.
    }
  }

  function restore() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY));
      const valid =
        saved &&
        Array.isArray(saved.items) &&
        saved.items.length > 0 &&
        Array.isArray(saved.answers) &&
        saved.answers.length === saved.items.length &&
        Number.isInteger(saved.index) &&
        typeof saved.deadline === "number";
      return valid ? saved : null;
    } catch (error) {
      return null;
    }
  }

  // --- Timer ---------------------------------------------------------------
  // Counts against a fixed deadline, so a phone that pauses the page still ends on time.

  function startTimer() {
    exam.startedAt = Date.now();
    exam.deadline = exam.startedAt + EXAM_SECONDS * 1000;
    save();
    runTimer();
  }

  function runTimer() {
    exam.shownSeconds = null;
    $("timer-live").textContent = "";
    tick();
    exam.timer = setInterval(tick, 250);
  }

  function tick() {
    if (!exam || exam.finishedAt) {
      return;
    }
    const left = Math.max(0, Math.ceil((exam.deadline - Date.now()) / 1000));
    if (left === exam.shownSeconds) {
      return;
    }
    exam.shownSeconds = left;
    $("timer-text").textContent = clock(left);
    $("timer").classList.toggle("is-low", left <= LOW_SECONDS);
    if (left <= LOW_SECONDS && left > 0 && !exam.warned) {
      exam.warned = true;
      $("timer-live").textContent = "بقيت دقيقة واحدة أو أقل";
    }
    if (left === 0) {
      finish(true);
    }
  }

  document.addEventListener("visibilitychange", tick);

  // --- Exam screen ---------------------------------------------------------

  function renderQuestionText(item, answer) {
    const heading = $("question-text");
    heading.replaceChildren();
    if (item.kind !== "blank") {
      heading.textContent = item.text;
      return;
    }
    const [before, after] = item.text.split(BLANK);
    const blank = document.createElement("span");
    blank.className = "blank";
    if (answer === null) {
      blank.textContent = "…………";
      blank.setAttribute("aria-label", "فراغ");
    } else {
      blank.textContent = item.options[answer].text;
      blank.classList.add("is-filled");
    }
    heading.append(before, blank, after || "");
  }

  function renderOptions(item, answer) {
    const box = $("options");
    box.replaceChildren();
    box.classList.toggle("options-tf", item.kind === "truefalse");
    item.options.forEach((option, i) => {
      const label = document.createElement("label");
      label.className = "option";
      label.classList.toggle("is-selected", answer === i);

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = String(i);
      input.checked = answer === i;
      input.addEventListener("change", () => choose(i));

      const mark = document.createElement("span");
      mark.className = "option-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = item.kind === "truefalse" ? (option.text === "صواب" ? "✓" : "✗") : LETTERS[i];

      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = option.text;

      label.append(input, mark, text);
      box.append(label);
    });
  }

  function renderDots() {
    const list = $("dots");
    list.replaceChildren();
    // At most 10 per row, rows of equal length (15 → 8 + 7); 5 per row when that would make the
    // circles smaller than a fingertip (narrow phones).
    const total = exam.items.length;
    let perRow = Math.ceil(total / Math.ceil(total / 10));
    if (perRow > 5 && narrowScreen.matches) {
      perRow = 5;
    }
    list.style.setProperty("--per-row", perRow);
    exam.items.forEach((_, i) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dot";
      button.dataset.action = "goto";
      button.dataset.index = String(i);
      button.textContent = number.format(i + 1);
      const answered = exam.answers[i] !== null;
      button.classList.toggle("is-answered", answered);
      button.setAttribute("aria-label", `السؤال ${number.format(i + 1)}${answered ? "، تمت الإجابة" : ""}`);
      if (i === exam.index) {
        button.setAttribute("aria-current", "step");
      }
      li.append(button);
      list.append(li);
    });
  }

  function render() {
    const total = exam.items.length;
    const item = exam.items[exam.index];
    const answer = exam.answers[exam.index];

    $("exam-count").textContent = `السؤال ${number.format(exam.index + 1)} من ${number.format(total)}`;
    $("exam-kind").textContent = KIND_LABELS[item.kind];
    const topic = topicOf(item);
    $("topic-name").textContent = topic.label;
    $("topic-use").setAttribute("href", `#${topic.icon}`);
    $("watermark-use").setAttribute("href", `#${topic.icon}`);
    $("exam-card").dataset.topic = item.topic;
    $("exam-bar").style.width = `${((exam.index + 1) / total) * 100}%`;

    renderQuestionText(item, answer);
    renderOptions(item, answer);
    renderDots();

    document.querySelector('[data-action="prev"]').disabled = exam.index === 0;
    $("next-button").textContent = exam.index === total - 1 ? "إنهاء الاختبار" : "التالي";
    $("confirm").hidden = true;

    // Replay the entry animation for the new question.
    const question = $("question");
    question.classList.remove("is-entering");
    void question.offsetWidth;
    question.classList.add("is-entering");
  }

  function choose(i) {
    exam.answers[exam.index] = i;
    const item = exam.items[exam.index];
    renderQuestionText(item, i);
    document.querySelectorAll("#options .option").forEach((label, j) => {
      label.classList.toggle("is-selected", j === i);
    });
    renderDots();
    save();
  }

  function go(index) {
    if (index < 0 || index >= exam.items.length) {
      return;
    }
    exam.index = index;
    save();
    render();
    $("question-text").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function askToFinish() {
    const unanswered = exam.answers.filter((a) => a === null).length;
    if (unanswered === 0) {
      finish(false);
      return;
    }
    $("confirm-text").textContent = `عدد الأسئلة بدون إجابة: ${number.format(unanswered)}. هل تريد إنهاء الاختبار الآن؟`;
    $("confirm").hidden = false;
    $("confirm").querySelector("button").focus();
  }

  function finish(timedOut) {
    if (exam.finishedAt) {
      return;
    }
    clearInterval(exam.timer);
    forget();
    exam.finishedAt = Math.min(Date.now(), exam.deadline);
    exam.timedOut = timedOut;
    renderResult();
    show("result");
  }

  // --- Result screen -------------------------------------------------------

  function statusOf(item, answer) {
    if (answer === null) {
      return "none";
    }
    return item.options[answer].correct ? "right" : "wrong";
  }

  function verdict(percent) {
    if (percent === 100) return "علامة كاملة! أحسنت";
    if (percent >= 80) return "ممتاز، أحسنت!";
    if (percent >= 60) return "جيد جدًا";
    if (percent >= 50) return "جيد، ويمكنك أفضل من ذلك";
    return "حاول مرة أخرى";
  }

  function answerLine(className, label, text) {
    const p = document.createElement("p");
    p.className = `review-answer ${className}`;
    const strong = document.createElement("span");
    strong.className = "review-label";
    strong.textContent = label;
    p.append(strong, ` ${text}`);
    return p;
  }

  function reviewItem(item, answer, index) {
    const status = statusOf(item, answer);
    const correct = item.options.find((o) => o.correct).text;

    const li = document.createElement("li");
    li.className = "review-item";
    li.dataset.status = status;

    li.dataset.topic = item.topic;

    const head = document.createElement("div");
    head.className = "review-head";
    const num = document.createElement("span");
    num.className = "review-num";
    const medal = document.createElement("span");
    medal.className = "topic-medal topic-medal-sm";
    medal.append(iconSvg(topicOf(item).icon, ""));
    num.append(medal, `السؤال ${number.format(index + 1)} · ${topicOf(item).label}`);
    const badge = document.createElement("span");
    badge.className = "badge";
    const symbol = { right: "✓ ", wrong: "✗ ", none: "" }[status];
    if (symbol) {
      const icon = document.createElement("span");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = symbol;
      badge.append(icon);
    }
    badge.append({ right: "صحيحة", wrong: "خاطئة", none: "بدون إجابة" }[status]);
    head.append(num, badge);

    const q = document.createElement("p");
    q.className = "review-q";
    q.textContent = item.text.replace(BLANK, "…………");

    li.append(head, q);
    if (status === "none") {
      li.append(answerLine("is-none", "إجابتك:", "لم تُجب عن هذا السؤال"));
    } else {
      li.append(answerLine(status === "right" ? "is-right" : "is-wrong", "إجابتك:", item.options[answer].text));
    }
    if (status !== "right") {
      li.append(answerLine("is-right", "الإجابة الصحيحة:", correct));
    }
    if (item.explanation) {
      const note = document.createElement("p");
      note.className = "review-explain";
      note.textContent = item.explanation;
      li.append(note);
    }
    return li;
  }

  function setFilter(filter) {
    $("review").dataset.filter = filter;
    document.querySelectorAll(".filter").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
    });
  }

  function renderResult() {
    const total = exam.items.length;
    const statuses = exam.items.map((item, i) => statusOf(item, exam.answers[i]));
    const count = (s) => statuses.filter((x) => x === s).length;
    const right = count("right");
    const wrong = count("wrong");
    const none = count("none");
    const percent = Math.round((right / total) * 100);
    const seconds = Math.round((exam.finishedAt - exam.startedAt) / 1000);

    $("timeout-note").hidden = !exam.timedOut;
    $("score-value").textContent = `${number.format(right)} / ${number.format(total)}`;
    $("score-percent").textContent = `${number.format(percent)}٪`;
    $("result-title").textContent = verdict(percent);
    $("stat-right").textContent = number.format(right);
    $("stat-wrong").textContent = number.format(wrong);
    $("stat-none").textContent = number.format(none);
    $("stat-time").textContent = clock(Math.min(seconds, EXAM_SECONDS));

    const ring = $("score-ring");
    ring.classList.toggle("is-good", percent >= 50);
    // Trophy for 80% and up, medal from 50%, a book ("keep studying") below.
    const award = percent >= 80 ? "trophy" : percent >= 50 ? "medal" : "book";
    $("score-icon-use").setAttribute("href", `#i-${award}`);
    ring.dataset.award = award;
    ring.style.setProperty("--p", "0");
    requestAnimationFrame(() => requestAnimationFrame(() => ring.style.setProperty("--p", String(percent))));

    const labels = { all: `الكل (${number.format(total)})`, right: `الصحيحة (${number.format(right)})`, wrong: `الخاطئة (${number.format(wrong + none)})` };
    document.querySelectorAll(".filter").forEach((button) => {
      button.textContent = labels[button.dataset.filter];
    });
    setFilter("all");

    const list = $("review");
    list.replaceChildren(...exam.items.map((item, i) => reviewItem(item, exam.answers[i], i)));

    if (percent >= 80) {
      celebrate();
    }
  }

  function celebrate() {
    if (reducedMotion) {
      return;
    }
    const layer = document.createElement("div");
    layer.className = "confetti";
    layer.setAttribute("aria-hidden", "true");
    const colors = ["#7c3aed", "#c026d3", "#f472b6", "#a78bfa", "#facc15", "#22d3ee"];
    // A phone gets fewer pieces; every third one is a red blood cell.
    const pieces = window.innerWidth < 500 ? 36 : 60;
    for (let i = 0; i < pieces; i++) {
      const piece = document.createElement("span");
      if (i % 3 === 0) {
        piece.className = "cell";
      }
      piece.style.setProperty("--x", `${Math.random() * 100}vw`);
      piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 30}vw`);
      piece.style.setProperty("--spin", `${(Math.random() - 0.5) * 1440}deg`);
      if (!piece.className) {
        piece.style.background = colors[i % colors.length];
      }
      piece.style.animationDelay = `${Math.random() * 0.6}s`;
      piece.style.animationDuration = `${2.4 + Math.random() * 1.6}s`;
      layer.append(piece);
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), 5000);
  }

  // --- Actions -------------------------------------------------------------

  const actions = {
    start: () => {
      exam = newExam();
      render();
      startTimer();
      show("exam", $("question-text"));
    },
    prev: () => go(exam.index - 1),
    next: () => (exam.index === exam.items.length - 1 ? askToFinish() : go(exam.index + 1)),
    goto: (button) => go(Number(button.dataset.index)),
    finish: () => finish(false),
    keep: () => {
      $("confirm").hidden = true;
      const first = exam.answers.indexOf(null);
      go(first === -1 ? exam.index : first);
    },
    filter: (button) => setFilter(button.dataset.filter),
    home: () => show("welcome"),
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (button && actions[button.dataset.action]) {
      actions[button.dataset.action](button);
    }
  });

  // Escape closes the "finish now?" box.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("confirm").hidden) {
      $("confirm").hidden = true;
      $("next-button").focus();
    }
  });

  // Resume an exam left by a reload or the back button; if its time ran out meanwhile, show the result.
  const saved = restore();
  if (saved) {
    exam = saved;
    render();
    if (Date.now() >= exam.deadline) {
      finish(true);
    } else {
      runTimer();
      show("exam", $("question-text"));
    }
  }

  // The welcome photo: show it once it has loaded, keep the icon if the file is missing.
  const portrait = document.querySelector(".portrait");
  const photo = portrait && portrait.querySelector(".portrait-photo");
  if (photo) {
    const showPhoto = () => portrait.classList.remove("portrait-empty");
    if (photo.complete && photo.naturalWidth > 0) {
      showPhoto();
    } else {
      photo.addEventListener("load", showPhoto);
    }
  }
})();
