// Prepares the figures for the "Radda in numbers" page. The numbers themselves are
// in impactFigures.json, copied from the centre's Annual Report 2021-22 (which page
// of the report each one comes from is listed in docs/SOURCES.md). This file only
// does the arithmetic the charts need (bar lengths, shares, totals), so the page
// template never calculates anything.
const figures = require("./impactFigures.json");

const FULL = 100;
const ONE_DECIMAL = 10;
const sum = (values) => values.reduce((total, value) => total + value, 0);
const share = (part, whole) => (whole > 0 ? Math.round((part / whole) * FULL * ONE_DECIMAL) / ONE_DECIMAL : 0);

// Shares out 100 squares so that they always add up to exactly 100: every row gets
// its whole-number share, and the squares left over go to the largest remainders.
function squaresOutOfHundred(values) {
  const total = sum(values);
  if (total <= 0) return values.map(() => 0);
  const exact = values.map((value) => (value / total) * FULL);
  const squares = exact.map(Math.floor);
  const byRemainder = exact.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest);
  const spare = FULL - sum(squares);   // counted once: the loop below changes the squares
  for (let i = 0; i < spare; i++) squares[byRemainder[i].index] += 1;
  return squares;
}

const withBars = (rows, longest) => rows.map((row) => ({ ...row, width: share(row.value, longest) }));

const mixRows = (figures.mix || []).flatMap((family) => family.rows);
const mixSquares = squaresOutOfHundred(mixRows.map((row) => row.value));
const mix = (figures.mix || []).map((family) => {
  const rows = family.rows.map((row, index) => ({ ...row, squares: mixSquares[mixRows.indexOf(row)], shade: index }));
  return { id: family.id, rows, value: sum(rows.map((row) => row.value)), squares: sum(rows.map((row) => row.squares)) };
});

const allVaccines = (figures.vaccines || []).flatMap((group) => group.rows);
const longestVaccine = Math.max(0, ...allVaccines.map((row) => row.value));
const vaccines = (figures.vaccines || []).map((group) => ({
  id: group.id, rows: withBars(group.rows, longestVaccine), value: sum(group.rows.map((row) => row.value))
}));

const series = (figures.series || []).map((entry) => {
  const longest = Math.max(...entry.values);
  return {
    id: entry.id,
    bars: entry.values.map((value, index) => ({ year: figures.years[index], value, width: share(value, longest) }))
  };
});

const targets = (figures.targets || []).map((row) => {
  const longest = Math.max(row.target, row.achieved);
  return { ...row, percent: Math.round(share(row.achieved, row.target)), width: share(row.achieved, longest), mark: share(row.target, longest) };
});

const staffTotal = sum((figures.staff || []).map((row) => row.value));
const staff = (figures.staff || []).map((row) => ({ ...row, width: share(row.value, staffTotal) }));

const funding = (figures.funding || []).map((row) => {
  const total = row.foreign + row.local;
  return { ...row, total, foreignShare: share(row.foreign, total), localShare: share(row.local, total) };
});

const longestFinance = Math.max(0, ...(figures.finance || []).flatMap((row) => [row.income, row.spending]));
const finance = (figures.finance || []).map((row) => ({
  ...row, incomeWidth: share(row.income, longestFinance), spendingWidth: share(row.spending, longestFinance)
}));

module.exports = {
  ...figures,
  timesSince1994: figures.contacts_1994 > 0 ? Math.round((figures.contacts / figures.contacts_1994) * ONE_DECIMAL) / ONE_DECIMAL : 0,
  mix,
  mixTotal: sum(mixRows.map((row) => row.value)),
  vaccines,
  vaccineTotal: sum(allVaccines.map((row) => row.value)),
  vaccineKinds: allVaccines.length,
  series,
  targets,
  staff,
  staffTotal,
  studentTotal: sum((figures.students || []).map((row) => row.value)),
  funding,
  finance
};
