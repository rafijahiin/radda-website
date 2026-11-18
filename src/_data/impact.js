// Prepares the figures for the "Radda in numbers" page. The numbers themselves are
// in impactFigures.json, copied from the centre's Annual Reports for 2021-22 and
// 2019-20 (the page of the report behind each one is listed in docs/SOURCES.md). This file only
// does the arithmetic the charts need (bar lengths, shares, totals), so the page
// template never calculates anything.
const fs = require("fs");
const path = require("path");
const figures = require("./impactFigures.json");

const SRC = path.join(__dirname, "..");
const BYTES_IN_MB = 1024 * 1024;
const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
const TARGET_MET = 100;

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

// ---- Shapes for the drawings. Every size is in the units of that drawing's own
// viewBox (or in pixels for the circles), so the page only has to print them.
const round1 = (value) => Math.round(value * ONE_DECIMAL) / ONE_DECIMAL;
const LINE_CHART = { width: 640, height: 300, left: 34, right: 34, top: 44, bottom: 46 };
const GAP_IN_STEPS = 1.7;         // the first year sits this many year-widths away from the next
const SLOPE = { left: 14, right: 106, top: 10, floor: 60 };
const LARGEST_CIRCLE = 72;      // radius, in pixels, of the largest circle in a group
const SMALLEST_CIRCLE = 3;      // so that even the smallest number can still be seen

// A circle's AREA carries the number, so its radius grows with the square root.
const circleRadius = (value, largest) => round1(Math.max(SMALLEST_CIRCLE, LARGEST_CIRCLE * Math.sqrt(value / largest)));

// The first year stands apart from the rest (the report gives 1994, then 2014 onwards),
// so it is drawn at the left with a gap and joined by a dashed line.
function lineChart(bars) {
  const { width, height, left, right, top, bottom } = LINE_CHART;
  const longest = Math.max(...bars.map((bar) => bar.value));
  const floor = height - bottom;
  const step = (width - left - right) / (Math.max(0, bars.length - 2) + GAP_IN_STEPS);
  const gap = step * GAP_IN_STEPS;
  const points = bars.map((bar, index) => ({
    year: bar.year,
    value: bar.value,
    x: round1(index === 0 ? left : left + gap + (index - 1) * step),
    y: round1(floor - (bar.value / longest) * (floor - top))
  }));
  const run = points.slice(1);
  if (!run.length) return { points, line: "", area: "", gap: "", floor, width, height };
  const line = run.map((point, index) => (index ? "L" : "M") + point.x + " " + point.y).join(" ");
  return {
    points,
    line,
    area: line + " L" + run[run.length - 1].x + " " + floor + " L" + run[0].x + " " + floor + " Z",
    gap: "M" + points[0].x + " " + points[0].y + " L" + run[0].x + " " + run[0].y,
    floor,
    width,
    height
  };
}

const slopeHeight = (value, longest) => round1(SLOPE.floor - (value / longest) * (SLOPE.floor - SLOPE.top));

const withBars = (rows, longest) => rows.map((row) => ({ ...row, width: share(row.value, longest), radius: circleRadius(row.value, longest) }));

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
  const bars = entry.values.map((value, index) => ({ year: figures.years[index], value, width: share(value, longest) }));
  return { id: entry.id, bars, chart: lineChart(bars) };
});

const targets = (figures.targets || []).map((row) => {
  const longest = Math.max(row.target, row.achieved);
  const previousPercent = row.previous ? Math.round(share(row.previous.achieved, row.previous.target)) : null;
  return { ...row, previousPercent, percent: Math.round(share(row.achieved, row.target)), width: share(row.achieved, longest), mark: share(row.target, longest) };
});

// Two reports side by side: each row keeps its own scale, so a row about 45 clinics
// is as easy to read as one about half a million contacts.
const compareRows = ((figures.compare || {}).rows || []).map((row) => {
  const longest = Math.max(row.before, row.after);
  return {
    ...row,
    beforeWidth: share(row.before, longest),
    afterWidth: share(row.after, longest),
    slope: { x1: SLOPE.left, y1: slopeHeight(row.before, longest), x2: SLOPE.right, y2: slopeHeight(row.after, longest), floor: SLOPE.floor },
    change: row.before > 0 ? Math.round(((row.after - row.before) / row.before) * FULL) : 0
  };
});

// The annual reports offered for download, with the size of each file worked out
// from the file itself so the page never states a wrong size.
const reports = (figures.reports || []).map((report) => {
  const file = path.join(SRC, report.file);
  if (!fs.existsSync(file)) throw new Error("Annual report file is missing: src/" + report.file);
  return { ...report, sizeMb: Math.round((fs.statSync(file).size / BYTES_IN_MB) * ONE_DECIMAL) / ONE_DECIMAL };
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
  // One service contact every so many seconds, if the year's total were spread evenly over the year.
  everySeconds: figures.contacts > 0 ? Math.round(SECONDS_IN_YEAR / figures.contacts) : 0,
  targetsMet: targets.filter((row) => row.percent >= TARGET_MET).length,
  journeys: figures.journeys || [],
  milestones: figures.milestones || [],
  growth: { nowRadius: LARGEST_CIRCLE, thenRadius: figures.contacts > 0 ? circleRadius(figures.contacts_1994 || 0, figures.contacts) : 0 },
  timesSince1994: figures.contacts_1994 > 0 ? Math.round((figures.contacts / figures.contacts_1994) * ONE_DECIMAL) / ONE_DECIMAL : 0,
  mix,
  mixTotal: sum(mixRows.map((row) => row.value)),
  vaccines,
  vaccineTotal: sum(allVaccines.map((row) => row.value)),
  vaccineKinds: allVaccines.length,
  series,
  reports,
  targets,
  compare: { ...(figures.compare || {}), rows: compareRows },
  staff,
  staffTotal,
  studentTotal: sum((figures.students || []).map((row) => row.value)),
  funding,
  finance
};
