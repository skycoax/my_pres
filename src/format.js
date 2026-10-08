// Запись денег в сумах: «550 млн сум», «1,6 млрд сум», «50 тыс. сум», «100 000 сум».
const fmt = (n, d = 1) => n.toLocaleString("ru-RU", { maximumFractionDigits: d }).replace(/ /g, " ");

function money(n, { unit = true } = {}) {
  const a = Math.abs(n);
  let s;
  if (a >= 1e9) s = fmt(n / 1e9, 1) + " млрд";
  else if (a >= 1e6) s = fmt(n / 1e6, a >= 1e8 ? 0 : 1) + " млн";
  else if (a >= 1e3) s = fmt(Math.round(n / 1000), 0) + " тыс.";
  else s = fmt(n, 0);
  return unit ? s + " сум" : s;
}
const full = (n) => fmt(Math.round(n), 0) + " сум"; // полная запись
const mlnNum = (n, d = 1) => fmt(n / 1e6, d); // число в миллионах без единиц

module.exports = { fmt, money, full, mlnNum };
