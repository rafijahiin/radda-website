# Radda MCH-FP Centre: website

The public website for Radda MCH-FP Centre, Mirpur, Dhaka, in English and Bangla.

Live site: https://rafijahiin.github.io/radda-website/ (Bangla: https://rafijahiin.github.io/radda-website/bn/)

## How it works

All the words, settings and news live in a few data files. A build step ([Eleventy](https://www.11ty.dev/)) turns them into finished pages in both languages. Whenever a change is pushed to the `main` branch, GitHub builds the site and publishes it to GitHub Pages automatically, usually within two minutes. Hosting is free.

| What you want to change | File to edit |
|---|---|
| News, updates and the notice bar | `src/_data/newsItems.json` (staff editing screen) |
| Government holidays | `src/_data/holidays.json` (staff editing screen) |
| Board of Trustees | `src/_data/trustees.json` (staff editing screen) |
| Phone, WhatsApp number, email, Facebook | `src/_data/contact.json` (staff editing screen) |
| Rebuild appeal: on or off, bank and mobile banking details | `src/_data/appealSettings.json` (staff editing screen) |
| Opening hours, map links, the site's web address | `src/_data/siteBase.json` |
| Any English text | `src/_data/i18n/en.json` |
| Any Bangla text | `src/_data/i18n/bn.json` |
| Page layout | `src/*.njk` and `src/_includes/` |
| Colours, fonts, spacing | `src/assets/css/site.css` (tokens at the top) |

You can edit these files in the browser on GitHub (open the file, click the pencil, then "Commit changes"). The site rebuilds by itself.

## Staff editing screen

Staff do not need GitHub. The four files marked "staff editing screen" above, and the photos, can be changed through forms in [Pages CMS](https://pagescms.org), a free editing screen that saves straight into this repository. The forms are defined in `.pages.yml` at the top of the repository. A plain guide for staff, in English and Bangla, is in [docs/STAFF-GUIDE.md](docs/STAFF-GUIDE.md).

**Setting it up (the repository owner does this once):**

1. Go to https://app.pagescms.org and sign in with the GitHub account that owns this repository.
2. When asked, install the Pages CMS GitHub App and give it access to **only** the `radda-website` repository.
3. Open `radda-website` in Pages CMS. You should see News and updates, Government holidays, Board of Trustees, Contact details and Media.
4. Invite each staff member by email: open **Collaborators** in the left menu and press **Invite a collaborator**. They sign in from the email they receive and can edit content and photos, but cannot change the forms or invite others.

**Why a mistake cannot break the live site.** Every save triggers the same build as any other change. The build tidies what it can (see `src/_data/news.js` and `src/_data/site.js`): an empty language falls back to the other one, an entry with no title is skipped, a bad link is ignored. If something essential is wrong, such as an empty phone number, the build stops and the live site keeps showing the last good version. GitHub emails the repository owner when a build fails. `npm test` runs the checks for these rules.

**Two things to know about `.pages.yml`.** For a file that holds a list (news, holidays, trustees), the setting must be exactly `list: true`; the longer form with `collapsible` makes Pages CMS show the file as one blank entry, and saving that would wipe the list. And optional dates are plain text fields, because the date picker fills an empty field with today's date.

**What staff cannot change from the forms:** the wording of the pages, the opening hours and the page layout. Those stay with whoever maintains the repository.

## The two languages

Every page exists twice: English at the top level (`index.html`, `services.html`, ...) and Bangla under `bn/` (`bn/index.html`, ...). The button in the top bar switches between them and keeps the reader on the same page.

`en.json` and `bn.json` have exactly the same structure. When you add or change text in one, make the same change in the other, or the build will leave a gap on that page.

On Bangla pages, numbers, dates and the "Open now" label are shown in Bangla automatically.

## News and the notice bar

Each item in `src/_data/newsItems.json` has English and Bangla fields (`title_en`, `title_bn`, and so on).

- An item with a `"url"` is a link to another site (press coverage). It appears in the news lists and opens that site.
- An item without a `"url"` is Radda's own update. It gets its own page at `news/<id>.html`, with the text from `"body_en"` and `"body_bn"`.
- An item with `"notice": true` also appears in the bar at the top of the home page. Set `"notice_until": "2027-01-31"` and the bar hides itself after that date. Leave it empty to show the bar until you set `"notice"` to `false`.

New items go at the **end** of the file. The site shows the last item first, and the three newest appear on the home page.

## The rebuild appeal

`rebuild.html` (and `bn/rebuild.html`) is the "Help rebuild Radda" page about the September 2026 attack on the Mirpur-1 centre.

- **Giving details.** Until the centre adds its accounts, the page asks people to contact the office. Once the bank details or a bKash or Nagad number are entered under **Rebuild appeal** in the staff editing screen, they appear on the page with a copy button. Bank details show only when the account name, bank and account number are all filled in, so a half-finished form never shows a partial number.
- **Switching it off.** Turn off "Show the Help rebuild Radda page" in the same form. The page, every link to it, and its search and sitemap entries all disappear on the next build.
- **The facts on the page.** Every figure carries a small number pointing to a published report listed at the bottom. The wording is in `src/_data/i18n/en.json` and `bn.json` under `rebuild`. Change a fact only together with its source, and update the "Last checked" date. The situation at the centre is changing, so the "What is still missing" list in particular should be reviewed by the centre.
- **Who can edit it.** Anyone invited to the staff editing screen can change the account numbers shown to donors. Invite only people the centre trusts with that.

## Clinic hours and the "Open now" label

The site works out whether the clinic is open, in Dhaka time.

- **Opening hours** are in `src/_data/siteBase.json` under `clinic.hours`: opening and closing time for each weekday (0 is Sunday), in minutes from midnight (540 is 9:00 AM, 1020 is 5:00 PM, 840 is 2:00 PM). `null` means closed.
- **Government holidays** are in `src/_data/holidays.json`, one entry per date (`"date": "YYYY-MM-DD"`). **Add each year's holidays**, through the staff editing screen or in the file. On those dates the site shows the clinic as closed and the visit form will not accept them. If the list is empty, the site cannot know about holidays.

The hours also appear as plain text in the top bar, the footer and the Visit page. Those lines are in `en.json` and `bn.json`: search both for `9 AM` and `৯টা`.

## Search

The search box (the magnifying glass, or press `/`) searches services, vaccines, locations, news and contact details in the current language. Its index is rebuilt from the data files on every build, so it never needs separate upkeep.

## Being found and shared

- **Share image.** When someone pastes a link to the site into Facebook, WhatsApp or a message, a picture with the centre's name and headline appears. There is one per language (`src/assets/img/share-en.jpg`, `share-bn.jpg`). If the headline or the centre's name changes, redraw them with `python tools/make_share_images.py` (needs Google Chrome and the Pillow package).
- **Sitemap.** `sitemap.xml` lists every page in both languages and is rebuilt automatically.
- **Clinic details for Google.** Every page carries the centre's name, phone, opening hours and holidays in a form search engines read (`src/_data/clinicSchema.js`). It updates itself from the same settings as the pages.
- **Smooth page changes.** Moving between pages cross-fades and, in browsers that support it, the next page is fetched as the pointer rests on its link. Both are a few lines in `src/assets/css/site.css` and `src/_includes/base.njk`; no framework is involved.
- **Page not found.** A mistyped address shows a friendly page in both languages (`src/404.njk`).

**One step only the site owner can do:** tell Google the site exists. Go to https://search.google.com/search-console, add the site's address as a "URL prefix" property, verify it with the HTML file method (put the file Google gives you in `src/` and add it to the passthrough list in `.eleventy.js`, or ask whoever maintains the site), then submit `sitemap.xml` under Sitemaps.

## Photos

The site shows no stand-in pictures. A photo area appears only when its photo exists; until then the page simply leaves that space out. The pages do not ask the browser for any photo that is not there.

To add a photo, put a JPG in `src/assets/photos/` (or upload it under Media in the staff editing screen) with one of these exact names:

| File | Where it appears | Suggested subject |
|---|---|---|
| `hero.jpg` | Home, beside the headline | A mother and baby at the centre (portrait, at least 1000 px wide) |
| `maternal.jpg` | Home card, Services | An antenatal check-up |
| `child.jpg` | Home card, Services | A child being vaccinated |
| `family-planning.jpg` | Home card, Services | A counselling session |
| `about.jpg` | Home, "Our story" | Health workers with mothers |
| `centre.jpg` | About, history | The centre building |
| `support.jpg` | Visit, "Support Radda" | A health worker with a mother and baby |

Use photos about 1600 to 2400 px wide, compressed to under 400 KB each, for example with squoosh.app. Only use photos Radda owns, with consent from the people shown.

`python tools/prepare_photos.py <folder>` does the cropping and compressing for you: it takes the originals named at the top of the script, crops each to the shape of its space keeping faces in frame, and writes web-sized files with the camera's hidden details removed.

**Where the current photos came from.** All seven were taken from the gallery on the centre's own earlier website (raddacentre.org) in November 2026:

| File | Original | What it shows |
|---|---|---|
| `hero.jpg` | Family Planning, IMG_6826 | A health worker talking with a mother who holds her child |
| `maternal.jpg` | Antenatal, IMG_6843 | A blood pressure check |
| `child.jpg` | COVID-19, 30 March 2020, IMG_5083 | A baby being vaccinated |
| `family-planning.jpg` | Family Planning, IMG_6825 | A counselling session |
| `about.jpg` | COVID-19, 29 March 2020, IMG_5044 | Mothers and babies on the centre's veranda |
| `centre.jpg` | COVID-19, 29 March 2020, IMG_5032 | Mothers waiting in the courtyard |
| `support.jpg` | News, IMG_1906 | Visitors and staff with a mother and newborn |

The centre should confirm that the people shown, especially the mothers, agreed to appear, and replace any photo where that is in doubt.

## The logo

The logo in the header, footer, browser tab and share images is the centre's own: a house with a mother and child inside. It was taken from the centre's earlier website, where the only copy was an 80 pixel JPEG (`images/logo.jpg`). `python tools/prepare_logo.py <logo-file>` enlarged it, smoothed the edges and separated the ink from the background; it was not redrawn. If the centre has a larger or vector version, run the script on that and then `python tools/make_share_images.py`.

Note: the file called `logo.png` on that earlier website is not Radda's logo. It is a leftover from the website template ("Consultix") and must not be used.

## Trustee portraits

Each trustee can have a portrait, shown as a small round picture beside the name. The six current portraits came from the same earlier website and are stored as `src/assets/photos/trustee-<name>.jpg`. To add or change one, upload a square JPG under Media in the staff editing screen and type its file name in the trustee's "Portrait file name" box. If the file name does not match an uploaded photo, the trustee's initials are shown instead.

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

`npm start` builds the site and serves it at http://localhost:8101, rebuilding as you edit. `npm run build` builds once into `_site/`. `npm run check` then confirms that every link, anchor and search entry in the built site resolves. `npm test` checks the rules that tidy staff-edited content.

## Custom domain (optional)

To serve the site at `www.raddacentre.org`: add the domain under *Settings → Pages → Custom domain* on GitHub, add a `CNAME` DNS record for `www` pointing to `rafijahiin.github.io`, and change `"url"` in `src/_data/siteBase.json` to the new address.

## Details to confirm with the centre

- The Bangla text: it was drafted alongside the English and should be read through by the centre.
- Trustee names are shown in English on both versions until their Bangla spellings are added (Board of Trustees in the staff editing screen).
- Full street addresses for the Mirpur-10 and Mirpur-1 centres.
- Whether morning and afternoon session times on the form match the clinic's practice.
- Spellings of trustee names and current board membership.
- Donation details (bank, bKash, Nagad) if the centre wants them published.
- The list of government holidays for the year.
- A larger or vector copy of the logo. The site uses the centre's own logo, but the only copy available was 80 pixels wide (see "The logo" above).
- Whether Mr. A. S. M. Quasem should be styled "Engr.": his portrait file on the earlier website was named "Eng_A_S_M_Quasem".
