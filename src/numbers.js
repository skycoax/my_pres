// Все цифры бизнес-плана кото-кафе «Мурчалка» — единый источник для презентации и текста.
// Суммы в узбекских сумах, цены и зарплаты — ориентир Ташкент. Открытие — январь 2027 (месяц 1).

const startup = [
  { name: "Ремонт и дизайн зала", sum: 150_000_000, group: "Ремонт и мебель" },
  { name: "Мебель и декор", sum: 70_000_000, group: "Ремонт и мебель" },
  { name: "Кухня и кофемашина", sum: 90_000_000, group: "Кухня" },
  { name: "Залог за аренду (2 месяца)", sum: 50_000_000, group: "Запуск" },
  { name: "Первые закупки: продукты и мерч", sum: 30_000_000, group: "Запуск" },
  { name: "Реклама к открытию", sum: 20_000_000, group: "Запуск" },
  { name: "Документы, касса, программы", sum: 15_000_000, group: "Запуск" },
  { name: "Котики: домики, когтеточки, ветеринар", sum: 25_000_000, group: "Котики" },
  { name: "Финансовая подушка (резерв)", sum: 100_000_000, group: "Подушка" },
];

const sources = [
  { name: "Собственные средства", sum: 330_000_000 },
  { name: "Банковский кредит на 3 года", sum: 220_000_000 },
];

const monthlyFixed = [
  { name: "Зарплата команды (6 чел.) с налогами", short: "Зарплата", sum: 36_000_000 },
  { name: "Аренда 120 м²", short: "Аренда", sum: 24_000_000 },
  { name: "Реклама: Instagram, Telegram, блогеры", short: "Реклама", sum: 6_000_000 },
  { name: "Прочее: бухгалтер, связь, хозтовары", short: "Прочее", sum: 5_000_000 },
  { name: "Коммунальные услуги", short: "Коммуналка", sum: 5_000_000 },
  { name: "Котики: корм, наполнитель, ветеринар", short: "Котики", sum: 4_000_000 },
  { name: "Проценты по кредиту", short: "% по кредиту", sum: 4_000_000 },
];

const pricePerHour = 40_000;
const check = [
  { name: "Время с котиками (40 000 сум/час × 1,25 часа)", short: "Котики", sum: 50_000 },
  { name: "Напитки и десерты", short: "Кафе", sum: 42_000 },
  { name: "Мерч: стикеры, брелоки, кружки", short: "Мерч", sum: 8_000 },
];

const variableShare = 0.18; // продукты, мерч, упаковка — доля выручки
const taxShare = 0.06; // налоги — упрощённая оценка, доля выручки
const daysInMonth = 30;
const seats = 30;
const hoursOpen = 11; // 11:00–22:00
const hoursPerGuest = 1.25;
const loanRateYear = 0.24;

// Гостей в день по месяцам: первый год — рост, дальше — 60 в день.
const guestsPerDay = [20, 26, 32, 37, 42, 46, 50, 52, 54, 55, 56, 57, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60];

const monthNames = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

const total = (arr) => arr.reduce((s, x) => s + x.sum, 0);

const investment = total(startup);
const fixedPerMonth = total(monthlyFixed);
const avgCheck = total(check);
const marginPerGuest = Math.round(avgCheck * (1 - variableShare - taxShare));
const breakEvenGuestsPerDay = Math.ceil(fixedPerMonth / marginPerGuest / daysInMonth);
const profitAt = (g) => g * daysInMonth * marginPerGuest - fixedPerMonth;

let cumulative = -investment;
const months = guestsPerDay.map((g, i) => {
  const guests = g * daysInMonth;
  const revenue = guests * avgCheck;
  const profit = profitAt(g);
  cumulative += profit;
  return {
    n: i + 1,
    label: `${monthNames[i % 12]} ${2027 + Math.floor(i / 12)}`,
    guestsPerDay: g, guests, revenue, profit, cumulative,
  };
});

const firstProfitMonth = months.find((m) => m.profit > 0).n;
const paybackMonth = months.find((m) => m.cumulative >= 0).n;
const year = (y) => months.slice((y - 1) * 12, y * 12);
const yearTotals = (y) => ({
  revenue: year(y).reduce((s, m) => s + m.revenue, 0),
  profit: year(y).reduce((s, m) => s + m.profit, 0),
  guests: year(y).reduce((s, m) => s + m.guests, 0),
});
const earlyLoss = -months.filter((m) => m.profit < 0).reduce((s, m) => s + m.profit, 0);
const loadAt = (g) => (g * hoursPerGuest) / (seats * hoursOpen);

// Аннуитетный платёж по кредиту на 36 месяцев.
const loanRate = loanRateYear / 12;
const loanPayment = Math.round((sources[1].sum * loanRate) / (1 - Math.pow(1 + loanRate, -36)));

// «Что если гостей будет меньше?» — тот же план, но гостей в k раз меньше.
function scenario(k) {
  let c = -investment, first = null, payback = null, loss = 0;
  for (let i = 0; i < 60 && payback === null; i++) {
    const p = profitAt(Math.round(guestsPerDay[Math.min(i, guestsPerDay.length - 1)] * k));
    if (p < 0) loss -= p;
    if (p > 0 && first === null) first = i + 1;
    c += p;
    if (c >= 0) payback = i + 1;
  }
  return { first, payback, loss };
}

module.exports = {
  startup, sources, monthlyFixed, check, pricePerHour, variableShare, taxShare, daysInMonth,
  seats, hoursOpen, hoursPerGuest, loanRateYear, months, investment, fixedPerMonth, avgCheck,
  marginPerGuest, breakEvenGuestsPerDay, firstProfitMonth, paybackMonth,
  year1: yearTotals(1), year2: yearTotals(2), earlyLoss, loadAt, loanPayment, scenario,
};

if (require.main === module) {
  const m = module.exports;
  console.log({
    investment: m.investment, fixedPerMonth: m.fixedPerMonth, avgCheck: m.avgCheck,
    marginPerGuest: m.marginPerGuest, breakEvenGuestsPerDay: m.breakEvenGuestsPerDay,
    firstProfitMonth: m.firstProfitMonth, paybackMonth: m.paybackMonth,
    year1: m.year1, year2: m.year2, earlyLoss: m.earlyLoss, loanPayment: m.loanPayment,
    loadBreakEven: m.loadAt(m.breakEvenGuestsPerDay), loadM12: m.loadAt(57), minus20: m.scenario(0.8),
  });
  console.table(m.months.map(({ n, label, guestsPerDay, revenue, profit, cumulative }) => ({ n, label, guestsPerDay, revenue, profit, cumulative })));
}
