# Radda MCH-FP Centre: website

The public website for Radda MCH-FP Centre, Mirpur, Dhaka. It is plain HTML, CSS and JavaScript with no build step, so it can be hosted free on GitHub Pages.

## Pages

| File | Page |
|---|---|
| `index.html` | Home |
| `services.html` | Our services |
| `about.html` | About Radda, history, Board of Trustees |
| `visit.html` | Clinic hours, visit request form, locations, support |

## Publish on GitHub Pages (free)

1. Create a new **public** repository on GitHub, for example `radda-website`.
2. Push this folder to it:
   ```bash
   git remote add origin https://github.com/<your-username>/radda-website.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/radda-website/`.

**Custom domain (optional).** To serve the site at `www.raddacentre.org`, add the domain under *Settings → Pages → Custom domain*, then add a `CNAME` DNS record for `www` pointing to `<your-username>.github.io` at the domain registrar.

## Photos and illustrations

Every photo space shows a Radda illustration by default, so the site looks finished without any photos. When a real photo is added, it fades in over the illustration automatically. Nothing else needs to change.

To add a photo, put a JPG in `assets/photos/` with one of these exact names:

| File | Where it appears | Suggested subject |
|---|---|---|
| `hero.jpg` | Home, the arch at the top | A mother and baby at the centre (portrait, at least 1000 px wide) |
| `maternal.jpg` | Home card, Services | An antenatal check-up |
| `child.jpg` | Home card, Services | A child being vaccinated |
| `family-planning.jpg` | Home card, Services | A counselling session |
| `about.jpg` | Home, "Our story" | Health workers with mothers |
| `centre.jpg` | About, history | The centre building |
| `support.jpg` | Visit, "Support Radda" | A health worker with a mother and baby |

Use photos about 1600 to 2400 px wide (the hero is a tall arch, so a portrait photo works best there), compressed to under 400 KB each, for example with squoosh.app. Only use photos Radda owns, with consent from the people shown.

The illustrations are the `art-*.svg` files in `assets/img/`. They are built from one shape, an arch with a head above it, taken from the Radda mark.

## Clinic hours and the "Open now" label

The site works out whether the clinic is open, in Dhaka time, and shows it in the top bar, on the home page and on the Visit page. The hours are set once, at the top of `assets/js/site.js`, in the `CLINIC` settings:

- `hours`: opening and closing time for each weekday, in minutes from midnight (540 is 9:00 AM, 1020 is 5:00 PM, 840 is 2:00 PM).
- `holidays`: a list of government holidays as `"YYYY-MM-DD"`. **Add each year's holidays here.** On those dates the site shows the clinic as closed and the visit form will not accept them. If the list is empty, the site cannot know about holidays.

The hours also appear as plain text in the top bar, the footer and the table on `visit.html`. If the hours change, search all files for `9 AM` to find every copy.

## How visit requests work

GitHub Pages cannot store form data, so the visit form does not save anything. When a patient submits it, WhatsApp opens with a ready-written message addressed to the clinic (+880 1335-097710). There is also an SMS option. The clinic replies to confirm.

To change the WhatsApp number, edit `whatsapp:` at the top of `assets/js/site.js` (digits only, with country code 880).

## Editing content

- The header and footer are repeated in each of the four pages, between the `<!-- header:start -->` and `<!-- footer:end -->` comments. A change to one must be copied to the other three.
- Phone, email and Facebook appear in the header, the footer, the bar at the bottom of phone screens, and `visit.html`. Search all files for `1335` to find every copy of the phone number.
- The update notice at the top of the home page is the `<div class="notice">` block in `index.html`. Delete it when it is no longer needed.
- Colours and fonts are set at the top of `assets/css/site.css` (`--blue` is the main brand colour, `--sun` is the warm accent).
- The logo is `assets/img/logo-mark.svg` (also inlined in each page's header and footer). Replace it with Radda's official logo if there is one.

## Details to confirm with the centre

- Full street addresses for the Mirpur-10 and Mirpur-1 centres.
- Whether morning and afternoon session times on the form match the clinic's practice.
- Spellings of trustee names and current board membership.
- Donation details (bank, bKash, Nagad) if the centre wants them published.
- The list of government holidays for the year, for the "Open now" label.
