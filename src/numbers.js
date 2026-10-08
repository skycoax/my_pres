// Все цифры бизнес-плана кото-кафе «Мурчалка» — единый источник для презентации и текста.
// Суммы в рублях. Открытие — январь 2027 (месяц 1).

const startup = [
  { name: "Ремонт и дизайн зала", sum: 1_200_000, group: "Ремонт и мебель" },
  { name: "Мебель и декор", sum: 600_000, group: "Ремонт и мебель" },
  { name: "Кухня и кофемашина", sum: 700_000, group: "Кухня" },
  { name: "Залог за аренду (2 месяца)", sum: 300_000, group: "Запуск" },
  { name: "Первые закупки: продукты и мерч", sum: 300_000, group: "Запуск" },
  { name: "Реклама к открытию", sum: 200_000, group: "Запуск" },
  { name: "Документы, касса, программы", sum: 150_000, group: "Запуск" },
  { name: "Котики: домики, когтеточки, ветеринар", sum: 250_000, group: "Котики" },
  { name: "Финансовая подушка (резерв)", sum: 800_000, group: "Подушка" },
];

const sources = [
  { name: "Собственные средства", sum: 2_700_000 },
  { name: "Банковский кредит на 3 года", sum: 1_800_000 },
];

const monthlyFixed = [
  { name: "Зарплата команды (6 чел.) с налогами", short: "Зарплата", sum: 420_000 },
  { name: "Аренда 120 м²", short: "Аренда", sum: 150_000 },
  { name: "Реклама и соцсети", short: "Реклама", sum: 50_000 },
  { name: "Прочее: бухгалтер, связь, хозтовары", short: "Прочее", sum: 45_000 },
  { name: "Коммунальные услуги", short: "Коммуналка", sum: 40_000 },
  { name: "Котики: корм, наполнитель, ветеринар", short: "Котики", sum: 35_000 },
  { name: "Проценты по кредиту", short: "% по кредиту", sum: 25_000 },
];

const check = [
  { name: "Время с котиками (400 ₽/час × 1,25 часа)", short: "Котики", sum: 500 },
  { name: "Напитки и десерты", short: "Кафе", sum: 380 },
  { name: "Мерч: стикеры, брелоки, кружки", short: "Мерч", sum: 70 },
];

const variableShare = 0.18; // продукты, мерч, упаковка — доля выручки
const taxShare = 0.06; // УСН «доходы» 6%
const daysInMonth = 30;
const seats = 30;
const hoursOpen = 11; // 11:00–22:00
const hoursPerGuest = 1.25;

// Гостей в день по месяцам: первый год — рост, дальше — 60 в день.
const guestsPerDay = [20, 26, 32, 37, 42, 46, 50, 52, 54, 55, 56, 57, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60];

const monthNames = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

const sum = (arr) => arr.reduce((s, x) => s + x.sum, 0);

const investment = sum(startup);
const fixedPerMonth = sum(monthlyFixed);
const avgCheck = sum(check);
const marginPerGuest = Math.round(avgCheck * (1 - variableShare - taxShare)); // 722 ₽
const breakEvenGuestsPerDay = Math.ceil(fixedPerMonth / marginPerGuest / daysInMonth); // 36

let cumulative = -investment;
const months = guestsPerDay.map((g, i) => {
  const guests = g * daysInMonth;
  const revenue = guests * avgCheck;
  const variable = Math.round(revenue * (variableShare + taxShare));
  const profit = guests * marginPerGuest - fixedPerMonth;
  cumulative += profit;
  return {
    n: i + 1,
    label: `${monthNames[i % 12]} ${2027 + Math.floor(i / 12)}`,
    guestsPerDay: g,
    guests,
    revenue,
    variable,
    fixed: fixedPerMonth,
    profit,
    cumulative,
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

// Аннуитетный платёж по кредиту: 20% годовых, 36 месяцев.
const loanRate = 0.2 / 12;
const loanPayment = Math.round(
  (sources[1].sum * loanRate) / (1 - Math.pow(1 + loanRate, -36))
);

module.exports = {
  startup, sources, monthlyFixed, check, variableShare, taxShare, daysInMonth,
  seats, hoursOpen, hoursPerGuest, months, investment, fixedPerMonth, avgCheck,
  marginPerGuest, breakEvenGuestsPerDay, firstProfitMonth, paybackMonth,
  year1: yearTotals(1), year2: yearTotals(2), earlyLoss, loadAt, loanPayment,
};

if (require.main === module) {
  const m = module.exports;
  console.log({
    investment: m.investment, fixedPerMonth: m.fixedPerMonth, avgCheck: m.avgCheck,
    marginPerGuest: m.marginPerGuest, breakEvenGuestsPerDay: m.breakEvenGuestsPerDay,
    firstProfitMonth: m.firstProfitMonth, paybackMonth: m.paybackMonth,
    year1: m.year1, year2: m.year2, earlyLoss: m.earlyLoss, loanPayment: m.loanPayment,
    loadBreakEven: m.loadAt(m.breakEvenGuestsPerDay), loadM12: m.loadAt(57),
  });
  console.table(m.months.map(({ n, label, guestsPerDay, revenue, profit, cumulative }) => ({ n, label, guestsPerDay, revenue, profit, cumulative })));
}
