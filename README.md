# Radda MCH-FP Centre — website

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

## Add real photos (most important)

Photos make the biggest difference to how the site looks. Until a photo is added, its space shows a blue panel. Put JPG files in `assets/photos/` with these exact names:

| File | Where it appears | Suggested subject |
|---|---|---|
| `hero.jpg` | Home, top banner | A mother and baby at the centre (landscape, at least 2000 px wide) |
| `maternal.jpg` | Home card, Services | An antenatal check-up |
| `child.jpg` | Home card, Services | A child being vaccinated |
| `family-planning.jpg` | Home card, Services | A counselling session |
| `about.jpg` | Home, "Our story" | Health workers with mothers |
| `centre.jpg` | About, history | The centre building |
| `support.jpg` | Visit, "Support Radda" | A health worker with a mother and baby |

Use landscape photos, about 1600–2400 px wide, compressed to under 400 KB each (for example with squoosh.app). Only use photos Radda owns, with consent from the people shown.

## How visit requests work

GitHub Pages cannot store form data, so the visit form does not save anything. When a patient submits it, WhatsApp opens with a ready-written message addressed to the clinic (+880 1335-097710). There is also an SMS option. The clinic replies to confirm.

To change the WhatsApp number, edit `whatsapp:` at the top of `assets/js/site.js` (digits only, with country code 880).

## Editing content

- Phone, email and Facebook appear in the header, footer and `visit.html`. Search all files for `1335` to find every copy of the phone number.
- The update notice at the top of the home page is the `<div class="notice">` block in `index.html`. Delete it when it is no longer needed.
- Colours and fonts are set at the top of `assets/css/site.css` (`--blue` is the main brand colour).
- The logo is `assets/img/logo-mark.svg` (also inlined in each page's header and footer). Replace it with Radda's official logo if there is one.

## Details to confirm with the centre

- Full street addresses for the Mirpur-10 and Mirpur-1 centres.
- Whether morning/afternoon session times on the form match the clinic's practice.
- Spellings of trustee names and current board membership.
- Donation details (bank / bKash / Nagad) if the centre wants them published.
