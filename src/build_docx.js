// Word-файл с текстом к выступлению и шпаргалкой цифр.
// Запуск: node src/build_docx.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  ShadingType, AlignmentType, HeadingLevel, LevelFormat, BorderStyle, PageBreak,
  Footer, PageNumber, TableLayoutType,
} = require("docx");
const N = require("./numbers");

const OUT = path.join(__dirname, "..", "Мурчалка_текст_выступления.docx");

// Палитра «клубничное молоко»
const PINK = "D9467A";
const PINK_SOFT = "FDE7EF";
const MINT_SOFT = "E3F5EE";
const BROWN = "5B3A3A";
const GREY = "8A7474";
const BORDER = "F3C6D6";

const rub = (n) => Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ") + " ₽";
const mln = (n) => (n / 1_000_000).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " млн ₽";
const tys = (n) => Math.round(n / 1000).toLocaleString("ru-RU").replace(/ /g, " ") + " тыс. ₽";
const pct = (x) => Math.round(x * 100) + "%";

// «текст с **жирными** цифрами» → TextRun[]
function runs(text, base = {}) {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith("**")
      ? new TextRun({ ...base, text: part.slice(2, -2), bold: true, color: PINK })
      : new TextRun({ ...base, text: part })
  );
}
const p = (text, opts = {}) => new Paragraph({ children: runs(text, opts.run), spacing: { after: 120, line: 300 }, ...opts.para });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const bullet = (text) => new Paragraph({ numbering: { reference: "paws", level: 0 }, children: runs(text), spacing: { after: 80, line: 280 } });
const note = (label, text, fill) =>
  new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    borders: noBorders(),
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9026, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill },
      margins: { top: 100, bottom: 100, left: 180, right: 180 },
      children: [new Paragraph({ children: [new TextRun({ text: label + " ", bold: true, color: BROWN }), ...runs(text, { color: BROWN })] })],
    })] })],
  });
const spacer = () => new Paragraph({ children: [], spacing: { after: 60 } });

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
}

function table(headers, rows, widths, { totalRow = false } = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const line = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
  const cell = (text, i, { head = false, bold = false, fill } = {}) =>
    new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
        children: [new TextRun({ text: String(text), bold: head || bold, color: head ? "FFFFFF" : BROWN, size: 20 })],
      })],
    });
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, { head: true, fill: PINK })) }),
      ...rows.map((r, ri) => {
        const isTotal = totalRow && ri === rows.length - 1;
        return new TableRow({ children: r.map((c, i) => cell(c, i, { bold: isTotal, fill: isTotal ? PINK_SOFT : ri % 2 ? "FFF7FA" : undefined })) });
      }),
    ],
  });
}

// ---------- Содержание ----------
const y1 = N.year1, y2 = N.year2;
const m12 = N.months[11];
const slides = [
  {
    title: "Слайд 1 · Знакомство",
    screen: "Название «Мурчалка» и арт: вы с котиком и кофе.",
    time: "≈ 20 сек",
    speech: [
      "Здравствуйте! Я представляю бизнес-план кото-кафе «Мурчалка» — уютного места, где можно выпить кофе, съесть милый десерт и погладить котиков.",
      "Я расскажу, сколько денег нужно на старт, какие будут расходы и когда кафе начнёт приносить прибыль.",
    ],
    remember: "кото-кафе «Мурчалка»; три вопроса: деньги на старт → расходы → прибыль.",
  },
  {
    title: "Слайд 2 · Идея",
    screen: "Четыре плитки: 120 м², 30 мест, 8 котиков, 11:00–22:00. Три источника дохода.",
    time: "≈ 50 сек",
    speech: [
      "Идея простая: людям не хватает тепла и отдыха от стресса, а котикам из приютов — дома. Мы объединяем это в одном месте.",
      "Помещение — **120 м²**, **30** посадочных мест, работаем каждый день с **11 до 22** часов. В кафе живут **8 котиков** из приюта, и любого из них гость может забрать домой.",
      "Наши гости — студенты, молодые пары и семьи с детьми. Зарабатываем на трёх вещах: плата за время с котиками, напитки и каваи-десерты и мерч — стикеры, брелоки, кружки.",
    ],
    remember: "120 м² · 30 мест · 8 котиков · 11:00–22:00; доход = котики + кафе + мерч.",
  },
  {
    title: "Слайд 3 · Что нужно для старта",
    screen: "Пять карточек-картинок: что покупаем и сколько это стоит; полоска долей; «Всего 4,5 млн ₽».",
    time: "≈ 60 сек",
    speech: [
      `Для открытия нужно **${mln(N.investment)}**.`,
      "Самая большая часть — **1,8 млн** — ремонт, мебель и декор: в кото-кафе атмосфера — это и есть главный продукт. **700 тысяч** — кухня и кофемашина. **950 тысяч** — запуск: залог за аренду, первые закупки, реклама к открытию и документы. **250 тысяч** — всё для котиков: домики, когтеточки, ветеринар.",
      "И **800 тысяч** — финансовая подушка: первые месяцы кафе ещё не будет окупаться, и эти деньги нас страхуют.",
      "**60%** капитала — собственные средства, **40%** — банковский кредит на 3 года.",
    ],
    remember: "4,5 млн = 1,8 ремонт + 0,95 запуск + 0,8 подушка + 0,7 кухня + 0,25 котики; 60/40.",
  },
  {
    title: "Слайд 4 · Расходы каждый месяц",
    screen: "Большая цифра 765 тыс. ₽ и столбики по статьям.",
    time: "≈ 50 сек",
    speech: [
      `Каждый месяц кафе тратит около **${tys(N.fixedPerMonth)}** — независимо от того, сколько пришло гостей.`,
      "Больше половины — **420 тысяч** — зарплата команды из шести человек вместе с налогами. Аренда — **150 тысяч**. Остальное — реклама, коммунальные услуги, уход за котиками, проценты по кредиту и мелкие расходы.",
      "Ещё есть расходы, которые растут вместе с продажами: продукты, мерч и налог — примерно **24 копейки** с каждого заработанного рубля.",
    ],
    remember: "765 тыс./мес: зарплата 420, аренда 150; плюс 24% от выручки.",
  },
  {
    title: "Слайд 5 · Откуда деньги",
    screen: "Средний чек 950 ₽ и график гостей в день: розовые месяцы — убыток, зелёные — прибыль, пунктир — 36 гостей.",
    time: "≈ 60 сек",
    speech: [
      `Средний чек одного гостя — **${N.avgCheck} ₽**: 500 рублей за время с котиками — час стоит 400 рублей, и в среднем гость остаётся на час с четвертью, — 380 рублей на напитки и десерты и 70 рублей на мерч.`,
      `С каждого гостя после продуктов и налога у нас остаётся около **${N.marginPerGuest} ₽**. Чтобы покрыть все месячные расходы, нужно **${N.breakEvenGuestsPerDay} гостей в день** — это наша точка безубыточности.`,
      `В первый месяц ждём около **20** гостей в день, к концу года — **${m12.guestsPerDay}**. Это всего **${pct(N.loadAt(m12.guestsPerDay))}** загрузки зала, так что прогноз осторожный.`,
    ],
    remember: `чек 950 ₽ = 500 + 380 + 70; с гостя остаётся 722 ₽; безубыточность — 36 гостей/день.`,
  },
  {
    title: "Слайд 6 · Когда придёт прибыль",
    screen: "График «сколько заработали с начала»: розовые столбики — ещё в минусе, зелёные — вложения вернулись. Карточки «4-й месяц» и «17-й месяц».",
    time: "≈ 60 сек",
    speech: [
      `Теперь главное — когда придёт прибыль. Первые три месяца — небольшой убыток, всего около **${Math.floor(N.earlyLoss / 1000)} тысяч**: его покрывает наша финансовая подушка.`,
      `С **${N.firstProfitMonth}-го месяца** кафе выходит в плюс, и прибыль растёт каждый месяц. За первый год выручка составит около **${mln(y1.revenue)}**, чистая прибыль — около **${mln(y1.profit)}**.`,
      `На **${N.paybackMonth}-м месяце**, то есть примерно через полтора года, кафе полностью вернёт все вложенные ${mln(N.investment)}. Дальше — чистая прибыль около **${tys(N.months[12].profit)}** в месяц.`,
    ],
    remember: "убыток 3 мес. ≈ 605 тыс. (покрывает подушка); плюс с 4-го месяца; окупаемость — 17-й месяц.",
  },
  {
    title: "Слайд 7 · Итоги",
    screen: "Четыре главные цифры, «Спасибо за внимание!» и ваш портрет.",
    time: "≈ 30 сек",
    speech: [
      `Подведём итоги. Вложения — **${mln(N.investment)}**. Первая прибыль — на **${N.firstProfitMonth}-й месяц**. Окупаемость — **${N.paybackMonth} месяцев**. Во второй год прибыль вырастет примерно до **${mln(y2.profit)}**.`,
      "«Мурчалка» — это бизнес, который зарабатывает, и место, которое помогает котикам найти дом. Спасибо за внимание! С удовольствием отвечу на вопросы.",
    ],
    remember: "4,5 млн → прибыль с 4-го месяца → окупаемость 17 мес. → 6,4 млн во 2-й год.",
  },
];

const qa = [
  ["Что если гостей будет меньше, чем в плане?",
    `Точка безубыточности — ${N.breakEvenGuestsPerDay} гостей в день, это всего около ${pct(N.loadAt(N.breakEvenGuestsPerDay))} загрузки зала. Если гостей будет на 20% меньше плана, первая прибыль придёт на 6-й месяц, а окупаемость — примерно через 2,5 года (29 месяцев). Убыток первых месяцев тогда будет больше подушки примерно на 270 тыс. — покроем, сократив рекламу и часы работы в будни, или добавим из собственных средств.`],
  ["Откуда средний чек 950 ₽?",
    "500 ₽ — время с котиками (400 ₽ в час × 1,25 часа), 380 ₽ — кофе и десерт, 70 ₽ — мерч: покупает не каждый, но примерно каждый четвёртый гость берёт стикеры или брелок примерно за 280 ₽."],
  ["Котики и еда в одном помещении — а как же санитарные нормы?",
    "Кухня отделена от зала, котиков туда не пускают, еду выдают через стойку. Все котики привиты, ветеринар осматривает их каждый месяц, зал убирают несколько раз в день."],
  ["А если у гостя аллергия?",
    "Предупреждаем об этом в соцсетях и на входе. В зале хорошая вентиляция и ежедневная влажная уборка, а напитки и десерты можно взять с собой."],
  ["Зачем кредит и не опасно ли это?",
    `Кредит — ${mln(N.sources[1].sum)}, то есть только 40% капитала. Платёж — около ${tys(N.loanPayment)} в месяц, из них примерно 25 тыс. — проценты, они уже учтены в расходах. С 4-го месяца прибыль покрывает платёж, а в первые месяцы — подушка.`],
  ["Где брать котиков и что будет, если их заберут домой?",
    "Мы работаем вместе с приютом. Если котика забирают домой — это и есть наша миссия, приют передаёт нам нового. Истории «котик нашёл дом» в соцсетях ещё и бесплатная реклама."],
  ["Кто ваши конкуренты?",
    "Обычные кофейни и антикафе. Наше отличие — котики, каваи-атмосфера, где хочется фотографироваться, и мерч, который уносят с собой."],
  ["Почему прибыль во второй год больше?",
    `Расходы почти не меняются, а гостей становится больше: 60 в день вместо 20–57 в первый год. Выручка растёт до ${mln(y2.revenue)}, прибыль — до ${mln(y2.profit)}.`],
];

// ---------- Документ ----------
const children = [];

children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 120 }, children: [new TextRun({ text: "🐾", size: 56 })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "Кото-кафе «Мурчалка»", bold: true, size: 52, color: PINK })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 }, children: [new TextRun({ text: "Текст к выступлению и шпаргалка с цифрами", size: 28, color: GREY })] }));

children.push(h1("Как готовиться"));
children.push(bullet("Выступление — около **6 минут**: 7 слайдов, по 20–60 секунд на каждый."));
children.push(bullet("На слайдах почти нет текста — там цифры и картинки. Всё, что нужно сказать, — ниже."));
children.push(bullet("Не учите наизусть: запомните **жирные цифры** и строчку «Запомнить» под каждым слайдом, остальное расскажите своими словами."));
children.push(bullet("Прорепетируйте вслух 2–3 раза с секундомером. В конце есть ответы на возможные вопросы."));

children.push(h1("Главные цифры"));
children.push(table(["Что", "Сколько"], [
  ["Стартовый капитал", rub(N.investment)],
  ["Из них: свои / кредит", "60% / 40%"],
  ["Расходы каждый месяц (постоянные)", rub(N.fixedPerMonth)],
  ["Средний чек гостя", rub(N.avgCheck)],
  ["Точка безубыточности", `${N.breakEvenGuestsPerDay} гостей в день`],
  ["Первая прибыль", `${N.firstProfitMonth}-й месяц (апрель 2027)`],
  ["Выручка / прибыль за 1-й год", `${mln(y1.revenue)} / ${mln(y1.profit)}`],
  ["Окупаемость", `${N.paybackMonth}-й месяц (май 2028)`],
  ["Прибыль за 2-й год", mln(y2.profit)],
], [5426, 3600]));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Текст по слайдам"));
slides.forEach((s, i) => {
  children.push(h2(s.title));
  children.push(new Paragraph({ spacing: { after: 120 }, children: [
    new TextRun({ text: "На экране: ", italics: true, color: GREY }),
    new TextRun({ text: s.screen, italics: true, color: GREY }),
    new TextRun({ text: "   ·   " + s.time, italics: true, color: PINK }),
  ] }));
  s.speech.forEach((t) => children.push(p(t, { run: { color: BROWN } })));
  children.push(note("Запомнить:", s.remember, MINT_SOFT));
  children.push(spacer());
});

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Как посчитаны цифры"));
children.push(p("Это не нужно рассказывать — но полезно знать, если спросят «а откуда эта цифра?»."));

children.push(h2("Стартовый капитал"));
children.push(table(["Статья", "Сумма"], [
  ...N.startup.map((s) => [s.name, rub(s.sum)]),
  ["Итого", rub(N.investment)],
], [6426, 2600], { totalRow: true }));
children.push(spacer());
children.push(table(["Источник", "Сумма"], [
  ...N.sources.map((s) => [s.name, `${rub(s.sum)} (${pct(s.sum / N.investment)})`]),
], [5426, 3600]));

children.push(h2("Постоянные расходы в месяц"));
children.push(table(["Статья", "Сумма"], [
  ...N.monthlyFixed.map((s) => [s.name, rub(s.sum)]),
  ["Итого", rub(N.fixedPerMonth)],
], [6426, 2600], { totalRow: true }));
children.push(p(`Плюс переменные расходы: продукты, мерч и упаковка — ${pct(N.variableShare)} выручки, налог УСН «доходы» — ${pct(N.taxShare)} выручки. Итого ${pct(N.variableShare + N.taxShare)}.`, { para: { spacing: { before: 120, after: 120 } } }));

children.push(h2("Формулы"));
children.push(bullet(`Средний чек = 500 + 380 + 70 = **${N.avgCheck} ₽**`));
children.push(bullet(`С гостя остаётся = 950 × (1 − 0,24) ≈ **${N.marginPerGuest} ₽**`));
children.push(bullet(`Безубыточность = 765 000 ÷ 722 ÷ 30 дней ≈ 35,3 → **${N.breakEvenGuestsPerDay} гостей в день**`));
children.push(bullet("Прибыль за месяц = гостей в день × 30 × 722 − 765 000"));
children.push(bullet(`Окупаемость — месяц, когда сумма прибыли с начала работы превысила вложения ${rub(N.investment)}`));

children.push(h2("Прогноз по месяцам (до окупаемости)"));
children.push(table(["Месяц", "Гостей/день", "Выручка", "Прибыль", "Накоплено"],
  N.months.slice(0, N.paybackMonth).map((m) => [
    `${m.n}. ${m.label}`, m.guestsPerDay, rub(m.revenue), rub(m.profit), rub(m.cumulative),
  ]),
  [1900, 1400, 1900, 1900, 1926]));
children.push(p("«Накоплено» начинается с −4 500 000 ₽ (вложения). Когда число становится положительным — кафе окупилось.", { para: { spacing: { before: 120 } }, run: { color: GREY, size: 20 } }));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Возможные вопросы и ответы"));
qa.forEach(([q, a]) => {
  children.push(new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: "— " + q, bold: true, color: PINK })] }));
  children.push(p(a, { run: { color: BROWN } }));
});

children.push(h1("Если забыли текст"));
children.push(p("Одна строчка на слайд — этого достаточно, чтобы вспомнить всё остальное:"));
slides.forEach((s, i) => children.push(new Paragraph({
  numbering: { reference: "slides", level: 0 },
  spacing: { after: 80 },
  children: runs(s.remember, { color: BROWN }),
})));

const doc = new Document({
  creator: "Мурчалка",
  title: "Кото-кафе «Мурчалка» — текст к выступлению",
  styles: {
    default: { document: { run: { font: "Calibri", size: 24, color: BROWN } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: PINK, font: "Calibri" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: BROWN, font: "Calibri" },
        paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "paws", levels: [{ level: 0, format: LevelFormat.BULLET, text: "●", alignment: AlignmentType.LEFT,
        style: { run: { color: PINK }, paragraph: { indent: { left: 540, hanging: 300 } } } }] },
      { reference: "slides", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { run: { color: PINK, bold: true }, paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { margin: { top: 1300, bottom: 1300, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Мурчалка · ", color: GREY, size: 18 }),
      new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 18 }),
    ] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Saved", OUT);
});
