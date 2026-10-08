// Каваи-презентация бизнес-плана «Мурчалка» — 7 слайдов.
// Запуск: node src/build_pptx.js   (картинки берутся из assets/)
const path = require("path");
const pptxgen = require("pptxgenjs");
const N = require("./numbers");
const T = require("./themes").strawberry;
const { applyThemeColors } = require("./theme_xml");

const OUT = path.join(__dirname, "..", "Мурчалка_презентация.pptx");
const A = (f) => path.join(__dirname, "..", "assets", f);
const K = T.colors;
const HEAD = "Nunito Black";
const BODY = "Nunito";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 × 5.625 in
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };
pres.title = "Кото-кафе «Мурчалка» — бизнес-план";
pres.subject = "Капитал, расходы и срок окупаемости";
const C = pres.SchemeColor;

const { money, full } = require("./format");
const M = (n) => money(n, { unit: false }); // без «сум»: «220 млн»

// ---------- Макеты ----------
pres.defineSlideMaster({
  title: "TITLE",
  background: { color: K.lt2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.55, y: 1.55, w: 4.6, h: 1.15, fontFace: HEAD, fontSize: 60, color: C.text1, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 2.75, w: 4.4, h: 0.55, fontFace: HEAD, fontSize: 26, color: C.accent1, align: "left", valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: K.lt2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.55, y: 0.3, w: 6.6, h: 0.75, fontFace: HEAD, fontSize: 32, color: C.text1, align: "left", valign: "middle", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 9.15, y: 5.2, w: 0.4, h: 0.25, fontFace: BODY, fontSize: 10, color: K.dk2, align: "right" },
});

// ---------- Помощники ----------
const shadow = () => ({ type: "outer", color: K.accent1, opacity: 0.14, blur: 10, offset: 3, angle: 90 });
function card(slide, x, y, w, h, name, fill = C.background1) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.2, fill: { color: fill }, line: { type: "none" }, shadow: shadow(), objectName: name });
}
function pill(slide, x, y, w, h, text, { fill = C.accent1, color = C.background1, size = 12, name } = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: h / 2, fill: { color: fill }, line: { type: "none" }, objectName: name });
  slide.addText(text, { x, y, w, h, fontFace: HEAD, fontSize: size, color, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: name + " text" });
}
function sticker(slide, file, x, y, s, name) {
  slide.addImage({ path: A(file), x, y, w: s, h: s, objectName: name, altText: name });
}
function text(slide, t, x, y, w, h, opts = {}) {
  slide.addText(t, { x, y, w, h, margin: 0, isTextBox: true, valign: "top", fontFace: BODY, color: C.text1, fontSize: 14, ...opts });
}
function dot(slide, x, y, color, name) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: 0.16, h: 0.16, fill: { color }, line: { type: "none" }, objectName: name });
}
// Общий вид подписей и осей на всех графиках
const chartBase = () => ({
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt",
  catAxisLabelColor: K.dk2, valAxisLabelColor: K.dk2, dataLabelColor: K.dk1,
  catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, dataLabelFontSize: 11,
  catAxisLineShow: false, valAxisLineShow: false,
  valGridLine: { color: "F6D5E0", size: 0.75 }, catGridLine: { style: "none" },
  showLegend: false, showTitle: false,
});

// ---------- 1. Титул ----------
pres.addSection({ title: "Знакомство" });
{
  const s = pres.addSlide({ masterName: "TITLE", sectionTitle: "Знакомство" });
  pill(s, 0.6, 1.0, 2.35, 0.38, "БИЗНЕС-ПЛАН · 2027", { size: 11, name: "Tag" });
  s.addText("Мурчалка", { placeholder: "title" });
  s.addText("кото-кафе", { placeholder: "body" });
  text(s, [{ text: "Кофе, десерты и 8 пушистых друзей", options: { breakLine: true } }, { text: "из приюта" }], 0.6, 3.45, 4.4, 0.7, { fontSize: 16, color: C.text2 });
  sticker(s, "girl_sitting.png", 5.15, 0.3, 5.0, "Арт: девушка с котиком и кофе");
  s.addNotes("Здравствуйте! Я представляю бизнес-план кото-кафе «Мурчалка». Расскажу, сколько денег нужно на старт, какие будут расходы и когда кафе начнёт приносить прибыль.");
}

// ---------- 2. Идея ----------
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Знакомство" });
  s.addText("Идея", { placeholder: "title" });
  sticker(s, "cafe_diorama.png", 0.3, 1.0, 4.3, "Кото-кафе: диорама");
  const stats = [["120 м²", "уютный зал"], ["30", "мест"], ["8", "котиков из приюта"], ["11–22", "каждый день"]];
  stats.forEach(([big, small], i) => {
    const x = 4.85 + (i % 2) * 2.35, y = 1.2 + Math.floor(i / 2) * 1.5;
    card(s, x, y, 2.15, 1.3, `Факт ${i + 1}`);
    text(s, big, x, y + 0.2, 2.15, 0.6, { fontFace: HEAD, fontSize: 32, color: C.accent1, align: "center", valign: "middle" });
    text(s, small, x, y + 0.82, 2.15, 0.35, { fontSize: 13, color: C.text2, align: "center" });
  });
  text(s, "Зарабатываем на:", 4.85, 4.3, 4.5, 0.3, { fontFace: HEAD, fontSize: 13, color: C.text2 });
  [["котики", 1.25], ["кафе", 1.25], ["мерч", 1.25]].forEach(([t, w], i) => pill(s, 4.85 + i * 1.55, 4.65, w, 0.42, t, { size: 14, fill: C.background1, color: C.accent1, name: `Доход ${t}` }));
  s.addNotes("Людям не хватает тепла и отдыха, котикам из приютов — дома. Зал 120 м², 30 мест, с 11 до 22 каждый день, 8 котиков из приюта — любого можно забрать домой. Зарабатываем на времени с котиками, кафе и мерче.");
}

// ---------- 3. Что нужно для старта ----------
pres.addSection({ title: "Деньги" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Деньги" });
  s.addText("Что нужно для старта", { placeholder: "title" });
  pill(s, 7.0, 0.42, 2.45, 0.5, `Всего ${money(N.investment)}`, { size: 16, name: "Итого капитал" });
  text(s, "свои 60% · кредит 40%", 7.0, 0.98, 2.45, 0.3, { fontSize: 11, color: C.text2, align: "center" });

  const groups = ["Ремонт и мебель", "Запуск", "Подушка", "Кухня", "Котики"];
  const label = { "Ремонт и мебель": "ремонт, мебель, декор", "Запуск": "залог, закупки, реклама", "Подушка": "резерв на первые месяцы", "Кухня": "кухня и кофемашина", "Котики": "домики, когтеточки, ветеринар" };
  const pics = { "Ремонт и мебель": "furniture.png", "Запуск": "launch.png", "Подушка": "piggy.png", "Кухня": "coffee.png", "Котики": "cattree.png" };
  const sums = groups.map((g) => N.startup.filter((x) => x.group === g).reduce((a, x) => a + x.sum, 0));
  groups.forEach((g, i) => {
    const x = 0.55 + i * 1.8, y = 1.35, w = 1.62;
    card(s, x, y, w, 2.6, `Статья ${g}`);
    sticker(s, pics[g], x + 0.16, y + 0.08, 1.3, `Стикер ${g}`);
    dot(s, x + 0.2, y + 1.55, T.chart[i], `Цвет ${g}`);
    text(s, M(sums[i]), x + 0.42, y + 1.43, w - 0.5, 0.4, { fontFace: HEAD, fontSize: 17, valign: "middle" });
    text(s, label[g], x + 0.15, y + 1.9, w - 0.3, 0.6, { fontSize: 11, color: C.text2 });
  });

  // Доли — 100% полоса. Область построения = вся рамка графика, поэтому подписи
  // долей ставим текстом точно над своими сегментами.
  const bar = { x: 0.55, y: 4.2, w: 8.82, h: 0.6 }; // ровно по краям карточек
  const shares = sums.map((v) => v / N.investment);
  s.addChart(pres.charts.BAR, groups.map((g, i) => ({ name: g, labels: ["Доля"], values: [shares[i]] })), {
    ...bar, barDir: "bar", barGrouping: "percentStacked", barGapWidthPct: 0, layout: { x: 0, y: 0, w: 1, h: 1 },
    chartColors: T.chart, ...chartBase(), catAxisHidden: true, valAxisHidden: true, valGridLine: { style: "none" },
    objectName: "Доли капитала",
  });
  let acc = 0;
  shares.forEach((sh, i) => {
    text(s, Math.round(sh * 100) + "%", bar.x + acc * bar.w, bar.y, sh * bar.w, bar.h,
      { fontFace: HEAD, fontSize: 13, color: "FFFFFF", align: "center", valign: "middle", objectName: `Доля ${groups[i]}` });
    acc += sh;
  });
  s.addNotes(`Для открытия нужно ${money(N.investment)}: ${groups.map((g, i) => `${M(sums[i])} — ${label[g]}`).join(", ")}. 60% — свои деньги, 40% — кредит на 3 года.`);
}

// ---------- 4. Расходы ----------
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Деньги" });
  s.addText("Расходы каждый месяц", { placeholder: "title" });
  sticker(s, "receipt.png", 0.85, 1.05, 2.3, "Котик с чеком");
  text(s, money(N.fixedPerMonth), 0.55, 3.4, 3.2, 0.7, { fontFace: HEAD, fontSize: 34, color: C.accent1, align: "center", valign: "middle" });
  text(s, "в месяц, даже если гостей нет", 0.55, 4.08, 3.2, 0.3, { fontSize: 13, color: C.text2, align: "center" });
  pill(s, 0.75, 4.55, 2.8, 0.45, "+ 24% от выручки", { size: 14, fill: C.background1, color: C.accent1, name: "Переменные расходы" });

  card(s, 3.95, 1.2, 5.5, 3.9, "Карточка графика расходов");
  const rows = N.monthlyFixed;
  s.addChart(pres.charts.BAR, [{ name: "млн сум", labels: rows.map((r) => r.short), values: rows.map((r) => r.sum / 1e6) }], {
    x: 4.1, y: 1.3, w: 5.2, h: 3.7, barDir: "bar", catAxisOrientation: "maxMin", barGapWidthPct: 55,
    chartColors: [K.accent1], ...chartBase(), valAxisHidden: true, valGridLine: { style: "none" },
    catAxisLabelFontSize: 12, catAxisLabelColor: K.dk1,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0", dataLabelFontBold: true,
    objectName: "Расходы по статьям, млн сум",
  });
  text(s, "млн сум", 8.45, 4.72, 0.9, 0.25, { fontSize: 10, color: C.text2, align: "right" });
  s.addNotes(`Каждый месяц — около ${money(N.fixedPerMonth)}: зарплата команды ${M(rows[0].sum)}, аренда ${M(rows[1].sum)}, остальное — реклама, коммуналка, котики, проценты по кредиту. Плюс продукты, мерч и налоги — 24% от выручки.`);
}

// ---------- 5. Доходы ----------
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Деньги" });
  s.addText("Откуда деньги", { placeholder: "title" });

  card(s, 0.55, 1.2, 3.75, 3.9, "Средний чек");
  text(s, "Средний чек", 0.8, 1.35, 3.3, 0.3, { fontFace: HEAD, fontSize: 13, color: C.text2 });
  text(s, [{ text: full(N.avgCheck).replace(" сум", "") }, { text: " сум", options: { fontSize: 22 } }], 0.8, 1.62, 3.3, 0.7, { fontFace: HEAD, fontSize: 40, color: C.accent1, valign: "middle" });
  const parts = N.check;
  const checkColors = [T.chart[0], T.chart[1], T.chart[2]];
  s.addChart(pres.charts.BAR, parts.map((p) => ({ name: p.short, labels: ["Чек"], values: [p.sum] })), {
    x: 0.8, y: 2.4, w: 3.25, h: 0.5, barDir: "bar", barGrouping: "stacked", barGapWidthPct: 0,
    layout: { x: 0, y: 0, w: 1, h: 1 }, valAxisMinVal: 0, valAxisMaxVal: N.avgCheck,
    chartColors: checkColors, ...chartBase(), catAxisHidden: true, valAxisHidden: true, valGridLine: { style: "none" },
    objectName: "Состав среднего чека",
  });
  parts.forEach((p, i) => {
    const y = 3.05 + i * 0.38;
    dot(s, 0.85, y + 0.08, checkColors[i], `Цвет ${p.short}`);
    text(s, p.short, 1.1, y, 1.5, 0.32, { fontSize: 14, valign: "middle" });
    text(s, M(p.sum), 1.85, y, 0.95, 0.32, { fontFace: HEAD, fontSize: 14, align: "right", valign: "middle" });
  });
  sticker(s, "barista.png", 2.75, 3.3, 1.65, "Котик-бариста");

  card(s, 4.5, 1.2, 4.95, 3.9, "Карточка гостей");
  text(s, "Гостей в день, 2027 год", 4.75, 1.35, 3.0, 0.3, { fontFace: HEAD, fontSize: 13, color: C.text2 });
  const y1 = N.months.slice(0, 12);
  const labels = y1.map((m) => m.label.split(" ")[0]);
  const barColors = y1.map((m) => (m.guestsPerDay >= N.breakEvenGuestsPerDay ? T.pos : T.neg));
  s.addChart([
    { type: pres.charts.BAR, data: [{ name: "Гостей в день", labels, values: y1.map((m) => m.guestsPerDay) }],
      options: { chartColors: barColors, invertedColors: barColors, barGapWidthPct: 45, showValue: true, dataLabelPosition: "inBase", dataLabelFormatCode: "0", dataLabelColor: "FFFFFF", dataLabelFontBold: true } },
    { type: pres.charts.LINE, data: [{ name: "Безубыточность", labels, values: labels.map(() => N.breakEvenGuestsPerDay) }],
      options: { chartColors: [K.dk2], lineSize: 1.5, lineDash: "dash", lineDataSymbol: "none" } },
  ], {
    x: 4.6, y: 1.65, w: 4.75, h: 3.0, ...chartBase(), valAxisHidden: true, valGridLine: { style: "none" },
    valAxisMinVal: 0, valAxisMaxVal: 60, catAxisLabelFontSize: 10,
    objectName: "Гостей в день по месяцам",
  });
  dot(s, 4.8, 4.72, T.neg, "Цвет ниже");
  text(s, "убыток", 5.02, 4.66, 0.8, 0.28, { fontSize: 11, color: C.text2, valign: "middle" });
  dot(s, 5.8, 4.72, T.pos, "Цвет выше");
  text(s, "прибыль", 6.02, 4.66, 0.9, 0.28, { fontSize: 11, color: C.text2, valign: "middle" });
  text(s, `- - -  ${N.breakEvenGuestsPerDay} гостей = безубыточность`, 6.9, 4.66, 2.45, 0.28, { fontSize: 11, color: C.text2, valign: "middle", align: "right" });
  s.addNotes(`Средний чек — ${full(N.avgCheck)}: ${parts.map((p) => `${M(p.sum)} — ${p.short.toLowerCase()}`).join(", ")}. С гостя остаётся около ${full(N.marginPerGuest)}. Безубыточность — ${N.breakEvenGuestsPerDay} гостей в день. В январе ждём ${y1[0].guestsPerDay} гостей, к декабрю — ${y1[11].guestsPerDay}: это всего ${Math.round(N.loadAt(y1[11].guestsPerDay) * 100)}% загрузки зала.`);
}

// ---------- 6. Когда придёт прибыль ----------
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Деньги" });
  s.addText("Когда придёт прибыль", { placeholder: "title" });
  card(s, 0.55, 1.2, 6.25, 3.9, "Карточка графика окупаемости");
  text(s, "Сколько заработали с начала, млн сум", 0.8, 1.35, 5.0, 0.3, { fontFace: HEAD, fontSize: 13, color: C.text2 });
  const pts = [{ n: 0, cumulative: -N.investment }, ...N.months];
  const vals = pts.map((m) => Math.round(m.cumulative / 1e5) / 10);
  const cols = vals.map((v) => (v < 0 ? T.neg : T.pos));
  s.addChart(pres.charts.BAR, [{ name: "Накоплено, млн сум", labels: pts.map((m) => String(m.n)), values: vals }], {
    x: 0.65, y: 1.65, w: 6.05, h: 3.05, barDir: "col", barGapWidthPct: 35,
    chartColors: cols, invertedColors: cols, ...chartBase(),
    catAxisLabelPos: "low", catAxisLabelFrequency: 2, catAxisLabelFontSize: 10,
    valAxisMinVal: -800, valAxisMaxVal: 400, valAxisMajorUnit: 200, valAxisLabelFormatCode: "0",
    objectName: "Накопленная прибыль по месяцам",
  });
  text(s, "месяц работы →", 4.9, 4.72, 1.75, 0.25, { fontSize: 10, color: C.text2, align: "right" });

  card(s, 7.05, 1.2, 2.4, 1.15, "Первая прибыль");
  text(s, `${N.firstProfitMonth}-й месяц`, 7.05, 1.3, 2.4, 0.5, { fontFace: HEAD, fontSize: 24, color: C.accent1, align: "center", valign: "middle" });
  text(s, "первая прибыль", 7.05, 1.8, 2.4, 0.3, { fontSize: 13, color: C.text2, align: "center" });
  card(s, 7.05, 2.5, 2.4, 1.15, "Окупаемость");
  text(s, `${N.paybackMonth}-й месяц`, 7.05, 2.6, 2.4, 0.5, { fontFace: HEAD, fontSize: 24, color: C.accent2, align: "center", valign: "middle" });
  text(s, "вложения вернулись", 7.05, 3.1, 2.4, 0.3, { fontSize: 13, color: C.text2, align: "center" });
  sticker(s, "success.png", 7.45, 3.65, 1.6, "Котик празднует");
  s.addNotes(`Первые 3 месяца — убыток около ${money(N.earlyLoss)}, его покрывает подушка. С ${N.firstProfitMonth}-го месяца — прибыль. За 1-й год: выручка ${money(N.year1.revenue)}, прибыль ${money(N.year1.profit)}. На ${N.paybackMonth}-м месяце вложения ${money(N.investment)} полностью вернутся.`);
}

// ---------- 7. Итоги ----------
pres.addSection({ title: "Итоги" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Итоги" });
  s.addText("Итоги", { placeholder: "title" });
  const kpi = [
    [money(N.investment), "вложения"],
    [`${N.firstProfitMonth}-й мес.`, "первая прибыль"],
    [`${N.paybackMonth} мес.`, "окупаемость"],
    [money(N.year2.profit), "прибыль 2-го года"],
  ];
  kpi.forEach(([big, small], i) => {
    const x = 0.55 + (i % 2) * 3.0, y = 1.2 + Math.floor(i / 2) * 1.2;
    card(s, x, y, 2.8, 1.0, `Итог ${small}`);
    text(s, big, x + 0.25, y + 0.1, 2.4, 0.5, { fontFace: HEAD, fontSize: 24, color: C.accent1, valign: "middle" });
    text(s, small, x + 0.25, y + 0.6, 2.4, 0.3, { fontSize: 13, color: C.text2 });
  });
  text(s, "Спасибо за внимание!", 0.55, 3.65, 4.4, 0.6, { fontFace: HEAD, fontSize: 28, color: C.text1, valign: "middle" });
  text(s, "С радостью отвечу на вопросы", 0.55, 4.3, 4.4, 0.4, { fontSize: 16, color: C.text2 });
  sticker(s, "thanks.png", 5.0, 3.55, 1.5, "Котики машут лапкой");
  sticker(s, "girl_portrait.png", 6.4, 0.75, 3.5, "Арт: портрет с кофе и котёнком");
  s.addNotes(`Итого: вложения ${money(N.investment)}, первая прибыль на ${N.firstProfitMonth}-й месяц, окупаемость ${N.paybackMonth} месяцев, во второй год прибыль около ${money(N.year2.profit)}. «Мурчалка» зарабатывает и помогает котикам найти дом. Спасибо за внимание!`);
}

pres.writeFile({ fileName: OUT }).then(async () => {
  await applyThemeColors(OUT, `Мурчалка — ${T.name}`, K);
  console.log("Saved", OUT);
});
