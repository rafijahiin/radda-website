# Where the figures and facts come from

Every number on the "Radda in numbers" page is copied from the centre's
**Annual Report 2021-22** (July 2021 to June 2022). The file is served from this site
(`src/assets/reports/radda-annual-report-2021-22.pdf`) and is the same file as
https://www.raddacentre.org/pdf/report-2021-22.pdf

The numbers are kept in `src/_data/impactFigures.json`. Change a number there only
together with the report it comes from, and update this list. Page numbers are the
printed ones ("Page | 15"), not the PDF's own page count.

| What the site shows | Where in the report |
|---|---|
| 6 permanent clinics, 45 satellite clinics, 13 wards, 176 staff, areas covered | pages 1 and 2 |
| Rädda Barnen history, 91 percent of the outlay in 1994, support ended 2004, list of partners thanked | page 3 (Foreword) |
| Staff by department | page 9 |
| Antenatal, postnatal, immunization, family planning, physiotherapy and dental figures | pages 12 and 13 |
| Community health programme: target against achievement | page 14 |
| Every service by year, 1994 and 2014 to 2021-22 (all charts, the 100-figure pictogram, vaccine counts) | page 15, "Performance at a glance" |
| Radda Paramedic Institute: course, first batch 2011, 112 students (76 women, 36 men) | page 18 |
| Joint projects (Plan, IDKIDS, MDF and Nuffic, Swisscontact, Alive & Thrive, Mutual Trust Bank) | pages 21 to 23 |
| National days and campaigns (Vitamin A Plus, school deworming) | page 25 |
| Self-funding "from 9 to 100 percent" | page 26 |
| Income, spending and foreign donation by year | pages 27 and 28 |

Notes on how the figures are used:

- The "Out of every 100 contacts" pictogram groups the rows of the page 15 table. The
  groups add up to the report's own total of 525,845 service contacts; `npm test`
  checks this.
- Percentages in the targets chart are worked out from the two numbers shown. The
  report prints 71 percent for antenatal care; 4,542 of 6,450 is 70 percent.
- The report gives the year of establishment as 1973 on page 1 and says operations
  began in 1974 on pages 3 and 5. The site uses 1974.

## Annual Report 2019-20

The comparison "From 2019-20 to 2021-22", the earlier-year line under each target and
the 2015 and 2016-17 rows of the income chart come from the **Annual Report 2019-20**
(a PDF supplied by the centre; it is not on raddacentre.org at the time of writing).

| What the site shows | Where in the 2019-20 report |
|---|---|
| 169 staff; 6 static clinics, 10 satellite clinics in Dhaka North and 5 in Dhaka South | page 1 |
| Community health programme: target against achievement, 2019-20 | page 16 |
| Every service by year up to 2019-20 | pages 17 and 18 |
| Income and spending for 2015 and 2016-17 | page 32 |

Where the two reports overlap they agree, with one exception: spending in 2019-20 is
Tk 609.74 lakh in the 2019-20 report (which also records a surplus of Tk 19.68 lakh, the
difference from that year's income) and Tk 612.74 lakh in the 2021-22 report. The site
shows the later report's figure. The centre should say which is right.

## Health tools

The vaccine dates on the health tools page follow the national immunization
programme (EPI) schedule in `src/_data/careSchedule.json`: BCG at birth; pentavalent,
oral polio and PCV at 6, 10 and 14 weeks, with injectable polio at 6 and 14 weeks;
measles-rubella at 9 and 15 months; typhoid conjugate vaccine at 9 months. The
pregnancy tool adds 280 days to the first day of the last period and asks for a first
check-up within 16 weeks, the timing in the national guideline of four antenatal visits.

**The centre's doctors should confirm this schedule before the tools are promoted,
and again whenever the national schedule changes.**

## News

Each press and partner item in `src/_data/newsItems.json` links to the article it
summarises. Summaries are written for this site; they are not quotations.
