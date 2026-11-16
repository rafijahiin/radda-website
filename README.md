# Radda MCH-FP Centre: website

The public website for Radda MCH-FP Centre, Mirpur, Dhaka, in English and Bangla.

Live site: https://rafijahiin.github.io/radda-website/ (Bangla: https://rafijahiin.github.io/radda-website/bn/)

## How it works

All the words, settings and news live in a few data files. A build step ([Eleventy](https://www.11ty.dev/)) turns them into finished pages in both languages. Whenever a change is pushed to the `main` branch, GitHub builds the site and publishes it to GitHub Pages automatically, usually within two minutes. Hosting is free.

| What you want to change | File to edit |
|---|---|
| Phone, WhatsApp number, email, Facebook, map links | `src/_data/site.json` |
| Opening hours and government holidays | `src/_data/site.json`, under `clinic` |
| Board of Trustees | `src/_data/site.json`, under `trustees` |
| Any English text | `src/_data/i18n/en.json` |
| Any Bangla text | `src/_data/i18n/bn.json` |
| News, updates and the notice bar | `src/_data/news.json` |
| Page layout | `src/*.njk` and `src/_includes/` |
| Colours, fonts, spacing | `src/assets/css/site.css` (tokens at the top) |

You can edit these files in the browser on GitHub (open the file, click the pencil, then "Commit changes"). The site rebuilds by itself.

## The two languages

Every page exists twice: English at the top level (`index.html`, `services.html`, ...) and Bangla under `bn/` (`bn/index.html`, ...). The button in the top bar switches between them and keeps the reader on the same page.

`en.json` and `bn.json` have exactly the same structure. When you add or change text in one, make the same change in the other, or the build will leave a gap on that page.

On Bangla pages, numbers, dates and the "Open now" label are shown in Bangla automatically.

## News and the notice bar

Each item in `src/_data/news.json` has an English and a Bangla version.

- An item with a `"url"` is a link to another site (press coverage). It appears in the news lists and opens that site.
- An item without a `"url"` is Radda's own update. It gets its own page at `news/<id>.html`, with the text from `"body"`.
- An item with `"notice": true` also appears in the bar at the top of the home page. Set `"notice_until": "2027-01-31"` and the bar hides itself after that date. Leave it empty to show the bar until you set `"notice"` to `false`.

The first three items in the file appear on the home page, so put the newest first.

## Clinic hours and the "Open now" label

The site works out whether the clinic is open, in Dhaka time. The settings are in `src/_data/site.json`:

- `hours`: opening and closing time for each weekday (0 is Sunday), in minutes from midnight (540 is 9:00 AM, 1020 is 5:00 PM, 840 is 2:00 PM). `null` means closed.
- `holidays`: government holidays as `"YYYY-MM-DD"`. **Add each year's holidays here.** On those dates the site shows the clinic as closed and the visit form will not accept them. If the list is empty, the site cannot know about holidays.

The hours also appear as plain text in the top bar, the footer and the Visit page. Those lines are in `en.json` and `bn.json`: search both for `9 AM` and `৯টা`.

## Search

The search box (the magnifying glass, or press `/`) searches services, vaccines, locations, news and contact details in the current language. Its index is rebuilt from the data files on every build, so it never needs separate upkeep.

## Photos and illustrations

Every photo space shows a Radda illustration by default. When a real photo is added, it fades in over the illustration automatically.

To add a photo, put a JPG in `src/assets/photos/` with one of these exact names:

| File | Where it appears | Suggested subject |
|---|---|---|
| `hero.jpg` | Home, the arch at the top | A mother and baby at the centre (portrait, at least 1000 px wide) |
| `maternal.jpg` | Home card, Services | An antenatal check-up |
| `child.jpg` | Home card, Services | A child being vaccinated |
| `family-planning.jpg` | Home card, Services | A counselling session |
| `about.jpg` | Home, "Our story" | Health workers with mothers |
| `centre.jpg` | About, history | The centre building |
| `support.jpg` | Visit, "Support Radda" | A health worker with a mother and baby |

Use photos about 1600 to 2400 px wide, compressed to under 400 KB each, for example with squoosh.app. Only use photos Radda owns, with consent from the people shown.

The illustrations are the `art-*.svg` files in `src/assets/img/`. `node tools/make-art.js src/assets/img` redraws them if their colours or figures need to change.

## How visit requests work

The site stores nothing. When a patient submits the visit form, WhatsApp opens with a ready-written message addressed to the clinic, in the language of the page they are on. There is also an SMS option. The clinic replies to confirm.

## Working on the site on your own computer

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
```

```bash
npm start
```

`npm start` builds the site and serves it at http://localhost:8101, rebuilding as you edit. `npm run build` builds once into `_site/`. `npm run check` then confirms that every link, anchor and search entry in the built site resolves.

## Custom domain (optional)

To serve the site at `www.raddacentre.org`: add the domain under *Settings → Pages → Custom domain* on GitHub, add a `CNAME` DNS record for `www` pointing to `rafijahiin.github.io`, and change `"url"` in `src/_data/site.json` to the new address.

## Details to confirm with the centre

- The Bangla text: it was drafted alongside the English and should be read through by the centre.
- Trustee names are shown in English on both versions until their Bangla spellings are confirmed.
- Full street addresses for the Mirpur-10 and Mirpur-1 centres.
- Whether morning and afternoon session times on the form match the clinic's practice.
- Spellings of trustee names and current board membership.
- Donation details (bank, bKash, Nagad) if the centre wants them published.
- The list of government holidays for the year.
- Radda's official logo, to replace the placeholder mark in `src/_includes/base.njk` and `src/assets/img/`.
