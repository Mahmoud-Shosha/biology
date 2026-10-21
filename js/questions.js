// Question bank. The exam takes a random mix from it (see EXAM_MIX in js/app.js).
//
// Kinds:
//   choice:    options + answer (index of the right option; options are shuffled at run time)
//   truefalse: answer (true = صواب, false = خطأ) + optional explanation, shown in the result
//   blank:     text with ____ where the missing words go; options + answer as for choice
//
// topic: the badge shown with the question (TOPICS in js/app.js): heart, blood, vessels,
// circulation, health. Pick one that does not give the answer away (the question "which organ
// pumps the blood?" is circulation, not heart).
//
// Every text here is shown on screen: Arabic only, digits as ٠١٢٣٤٥٦٧٨٩.

const QUESTIONS = [
  // أسئلة اختيار من متعدد
  { kind: "choice", topic: "circulation", text: "ما هو عضو الضخ الرئيسي في الجهاز الدوري؟", options: ["الرئتان", "القلب", "الكبد"], answer: 1 },
  { kind: "choice", topic: "heart", text: "كم عدد حجرات قلب الإنسان؟", options: ["حجرتان", "٣ حجرات", "٤ حجرات"], answer: 2 },
  { kind: "choice", topic: "vessels", text: "ما الأوعية الدموية التي تنقل الدم بعيداً عن القلب إلى أجزاء الجسم؟", options: ["الشرايين", "الأوردة", "الشعيرات الدموية"], answer: 0 },
  { kind: "choice", topic: "vessels", text: "ما الأوعية الدموية التي تعيد الدم المحمل بثاني أكسيد الكربون إلى القلب؟", options: ["الشرايين", "الأوردة", "العضلات"], answer: 1 },
  { kind: "choice", topic: "blood", text: "المكون السائل في الدم والذي تشكل المياه أغلبه هو:", options: ["خلايا الدم الحمراء", "خلايا الدم البيضاء", "البلازما"], answer: 2 },
  { kind: "choice", topic: "blood", text: "خلايا الدم المسؤولة عن نقل الأكسجين إلى خلايا الجسم هي:", options: ["خلايا الدم الحمراء", "خلايا الدم البيضاء", "الصفائح الدموية"], answer: 0 },
  { kind: "choice", topic: "blood", text: "المكون المسؤول عن حماية الجسم ومحاربة الجراثيم والأمراض هو:", options: ["خلايا الدم الحمراء", "خلايا الدم البيضاء", "الصفائح الدموية"], answer: 1 },
  { kind: "choice", topic: "blood", text: "تلعب أجزاء الدم هذه دوراً مهماً في تجلط الدم وإيقاف النزيف عند الجروح:", options: ["البلازما", "الصفائح الدموية", "الشرايين"], answer: 1 },
  { kind: "choice", topic: "circulation", text: "أين تتم عملية تبادل الغازات (الأكسجين وثاني أكسيد الكربون) والمغذيات مع الخلايا؟", options: ["في الشرايين الكبيرة", "في الشعيرات الدموية", "في الأذين الأيمن"], answer: 1 },
  { kind: "choice", topic: "heart", text: "الحجرتان العُلويتان في القلب تُسميان:", options: ["البطينان", "الأذينان", "الصمامان"], answer: 1 },
  { kind: "choice", topic: "heart", text: "الحجرتان السفليتان في القلب تُسميان:", options: ["البطينان", "الأذينان", "الشعيرات"], answer: 0 },
  { kind: "choice", topic: "heart", text: "ما فائدة الصمامات الموجودة داخل القلب والأوردة؟", options: ["تسريع حركة الدم", "منع تدفق الدم في الاتجاه المعاكس (الراجع)", "تبريد الدم"], answer: 1 },
  { kind: "choice", topic: "vessels", text: "الشريان الرئيسي الأكبر في جسم الإنسان والذي يخرج من القلب هو:", options: ["الشريان الرئوي", "الشريان الأورطي (الأبهر)", "الوريد الأجوف"], answer: 1 },
  { kind: "choice", topic: "blood", text: "يعطي البروتين المسمى (الهيموجلوبين) للدم لونه:", options: ["الأبيض", "الأصفر", "الأحمر"], answer: 2 },
  { kind: "choice", topic: "heart", text: "يضخ الجانب الأيسر من القلب الدم الغني بـ:", options: ["الأكسجين", "ثاني أكسيد الكربون", "النيتروجين"], answer: 0 },
  { kind: "choice", topic: "circulation", text: "يضخ الجانب الأيمن من القلب الدم غير المؤكسج (المحمل بثاني أكسيد الكربون) إلى:", options: ["الدماغ", "الرئتين", "المعدة"], answer: 1 },
  { kind: "choice", topic: "circulation", text: "الجهاز الدوري يعتمد بشكل أساسي في عمله وتكامله على جهاز آخر لنقل الأكسجين، وهو:", options: ["الجهاز الهضمي", "الجهاز التنفسي", "الجهاز العظَمي"], answer: 1 },
  { kind: "choice", topic: "vessels", text: "أسرع وأصغر الأوعية الدموية سُمكاً هي:", options: ["الشعيرات الدموية", "الشرايين الرئيسية", "الأوردة الكبيرة"], answer: 0 },
  { kind: "choice", topic: "heart", text: "حجم قلب الإنسان يماثل تقريباً حجم:", options: ["تفاحة صغيرة", "قبضة اليد", "كرة القدم"], answer: 1 },
  { kind: "choice", topic: "health", text: "أي من الآتي يساعد في الحفاظ على صحة الجهاز الدوري؟", options: ["التدخين بكثرة", "ممارسة الرياضة وتناول الأكل الصحي", "النوم طوال اليوم"], answer: 1 },

  // أسئلة صواب أو خطأ
  { kind: "truefalse", topic: "heart", text: "القلب هو عضو عضلي يضخ الدم بانتظام طوال الحياة.", answer: true },
  { kind: "truefalse", topic: "vessels", text: "تنقل الأوردة الدم دائماً بعيداً عن القلب.", answer: false, explanation: "الشرايين هي التي تنقل الدم بعيداً عن القلب، أما الأوردة فتعيده للقلب." },
  { kind: "truefalse", topic: "blood", text: "تحتوي خلايا الدم الحمراء على الهيموجلوبين الذي يحمل الأكسجين.", answer: true },
  { kind: "truefalse", topic: "blood", text: "الصفائح الدموية هي المسؤول الرئيسي عن محاربة الفيروسات والبكتيريا.", answer: false, explanation: "خلايا الدم البيضاء هي المسؤولة عن ذلك." },
  { kind: "truefalse", topic: "blood", text: "البلازما الجزء الصلب من الدم.", answer: false, explanation: "البلازما هي السائل المائي في الدم." },
  { kind: "truefalse", topic: "vessels", text: "الشعيرات الدموية تربط بين نهايات الشرايين وبدايات الأوردة.", answer: true },
  { kind: "truefalse", topic: "heart", text: "يتكون قلب الإنسان من أذين واحد وبطينين.", answer: false, explanation: "يتكون من أذينين وبطينين: ٤ حجرات." },
  { kind: "truefalse", topic: "blood", text: "الدم الغني بالأكسجين يكون لونه أحمر فاتح.", answer: true },
  { kind: "truefalse", topic: "heart", text: "وظيفة الصمامات تسمح للدم بالمرور في الاتجاهين بحرية.", answer: false, explanation: "تسمح بالمرور في اتجاه واحد فقط." },
  { kind: "truefalse", topic: "health", text: "تناول الخضروات وممارسة المشي تقوي صحة القلب والأوعية الدموية.", answer: true },

  // أسئلة أكمل الفراغ (اختيار الكلمة الناقصة)
  { kind: "blank", topic: "circulation", text: "العضو الأساسي في الجهاز الدوري هو ____.", options: ["القلب", "الرئتان", "الكبد"], answer: 0 },
  { kind: "blank", topic: "blood", text: "المكون السائل الأصفر في الدم يسمى ____.", options: ["البلازما", "خلايا الدم الحمراء", "الصفائح الدموية"], answer: 0 },
  { kind: "blank", topic: "vessels", text: "الأوعية الدموية التي تحمل الدم المحمل بالأكسجين من القلب إلى الجسم هي ____.", options: ["الشرايين", "الأوردة", "الشعيرات الدموية"], answer: 0 },
  { kind: "blank", topic: "vessels", text: "الأوعية الدموية التي تحمل الدم العائد إلى القلب هي ____.", options: ["الأوردة", "الشرايين", "الصمامات"], answer: 0 },
  { kind: "blank", topic: "blood", text: "وظيفة خلايا الدم البيضاء هي ____.", options: ["الدفاع عن الجسم ضد الأمراض", "نقل الأكسجين", "تخثر الدم"], answer: 0 },
  { kind: "blank", topic: "blood", text: "تعمل الصفائح الدموية على ____ وتكوين القشرة فوق الجروح.", options: ["تخثر الدم", "نقل الأكسجين", "محاربة الجراثيم"], answer: 0 },
  { kind: "blank", topic: "blood", text: "المادة الكيميائية الموجودة في كريات الدم الحمراء وتكسبها اللون الأحمر هي ____.", options: ["الهيموجلوبين", "البلازما", "الأكسجين"], answer: 0 },
  { kind: "blank", topic: "heart", text: "الحجرة القلبية التي تضخ الدم إلى جميع أنحاء الجسم هي ____.", options: ["البطين الأيسر", "البطين الأيمن", "الأذين الأيسر"], answer: 0 },
  { kind: "blank", topic: "vessels", text: "تسمى أصغر الأوعية الدموية بـ ____.", options: ["الشعيرات الدموية", "الشرايين", "الأوردة"], answer: 0 },
  { kind: "blank", topic: "circulation", text: "يمر الدم بين حجرات القلب عبر ____ لضمان تدفقه في اتجاه واحد.", options: ["الصمامات", "الشعيرات الدموية", "الأوردة"], answer: 0 },
];
