# Chrome Web Store Submission Pack

Status: agent-side preparation complete; account, fee, screenshots, and final submit are user-side.
Build: `scamscanned-alpha-v0.2.2.zip` (12 entries, 57,983 B, SHA256 `91C11F5C9CEA004DA6BE907716F12E399DF279A1DB1897AA0BEF185A3DB975E4`).

- Homepage: https://scamscanned.com/
- Privacy policy: https://scamscanned.com/privacy.html
- Support: https://github.com/ScamScanned/ScamScanned/issues
- Source: https://github.com/ScamScanned/ScamScanned

---

## 1. Pre-flight (user actions)

1. Sign in to the Google account that will own the listing.
2. Pay the one-time **$5 developer registration fee** at https://chrome.google.com/webstore/devconsole.
3. Complete any identity/contact verification Google requests.
4. Upload `download/scamscanned-alpha-v0.2.2.zip`.
5. Paste the listing copy from section 2.
6. Fill the Privacy practices tab from section 3.
7. Upload screenshots from section 5.
8. Add the reviewer note from section 4.
9. Submit for review. Typical first review: 1-3 business days.

Do not upload the live-site copy of v0.2.1: it is an older 53,276 B build. The canonical submission is v0.2.2.

---

## 2. Store listing copy

### Name (from manifest)
`ScamScanned Alpha`

If you want the store title to read `ScamScanned` without "Alpha", that is a manifest `name` change plus a rebuild and version bump. It is a stronger trust signal for launch, but it is your call; the copy below works with either name.

### Summary (132 characters max)
`Warns about risky marketplace listing patterns on Amazon, Walmart, eBay, Etsy and local trade. Scanned locally, no tracking.`

(124 characters.)

### Detailed description

```
ScamScanned reads the marketplace page you are already viewing and shows a warning banner only when the listing carries concrete patterns that commonly sit before a bad purchase.

WHAT IT CHECKS
- Seller history printed in the buy box: low feedback counts, weak positive-rating share, "new seller" badges.
- Delivery promises that outlast normal marketplace windows.
- Contradictions such as "Fulfilled by Amazon" printed next to a weeks-long delivery estimate.
- Missing standard checkout, deep price markdowns, and mass-generated listing text.
- The marketplace's own frequently-returned flag, when present.
- eBay, Etsy, Craigslist, and Facebook Marketplace get smaller, honest checks and a local-trade safety reminder.

HOW THE BANNER WORKS
Risk is graduated: no banner, low caution (yellow), elevated (red), or extreme. The banner names the signals that matched, shows a six-zone meter, and lists page facts that point the other way. It reports observations, never a verdict about a person or a guarantee that a listing is safe.

WHAT IT DOES NOT DO
- It does not analyze product photos or review images.
- It does not certify any listing, seller, or review as safe or fake.
- It does not run analytics, advertising, or tracking SDKs.
- It does not require an account.

YOUR DATA
Scanning happens in your browser. On Amazon and Walmart, when a warning banner actually fires, the extension sends one anonymous diagnostic to scamscanned.com: the marketplace, the flagged page URL, the page title, and the seller name printed on that page. It is used to build the safe-alternatives link and to check a curated public enforcement-record list (currently empty). eBay, Etsy, Craigslist, and Facebook scans send nothing. No accounts, no cookies, no identifiers, nothing sold or shared for advertising.

OPEN SOURCE
The full source is public under GPLv3. Every heuristic can be read, run, and challenged. If a request exists beyond the one diagnostic described above, that is a bug worth reporting publicly.

FREE
No paywall, no premium tier, no email gate. As an Amazon Associate, ScamScanned earns from qualifying purchases; that is disclosed on the site and in the banner.

LIMITS
Heuristics age as marketplaces change their pages. Parse failure means silence: the extension does not warn on uncertain reads. A silent banner means no configured check matched, not that a page was vetted and passed. ScamScanned is not affiliated with any marketplace named above.

Questions, corrections, or audit requests: https://github.com/ScamScanned/ScamScanned/issues
```

### Category and language
- Category: **Shopping**
- Language: **English (United States)**

---

## 3. Privacy practices tab

### Single purpose
`Warns shoppers about risky marketplace listing patterns before purchase by scanning the product or listing page they are already viewing and rendering a local warning banner.`

### Permission justification

**Host permission: `https://scamscanned.com/*`**
`Used only to send the banner-gated anonymous diagnostic to ScamScanned's own API and to receive the safe-alternatives link. No other host is contacted by the extension.`

**Content scripts on Amazon, Walmart, eBay, Etsy, Craigslist, and Facebook**
`The extension's core function is to read the marketplace listing page the user is already viewing and render a warning banner locally. These are declared content-script matches, not broad host permissions. No API permissions are requested.`

**No API permissions**
`The manifest requests no chrome.* API permissions. Messaging uses the extension's own runtime; the only host permission is the ScamScanned API domain.`

### Remote code
`No. All executable code is packaged in the extension. The extension fetches JSON data only; it does not load or execute remote scripts.`

### Data collection disclosure

| Category | Collected? | What exactly |
| --- | --- | --- |
| Website content | **Yes** | On Amazon/Walmart, when a banner fires: the flagged page URL, page title, and seller name printed on the page. |
| Web history | **No** | The extension does not build or transmit a browsing history. Only the single page being viewed when a banner fires is described to the API. |
| Personally identifiable information | No | No names, emails, accounts, or identifiers tied to the user. |
| Health information | No | — |
| Financial and payment information | No | — |
| Authentication information | No | — |
| Personal communications | No | — |
| Location | No | — |
| User activity | No | — |

**Purpose:** App functionality (building the safe-alternatives link and checking the public enforcement-record list).

**Certifications:** select all three:
- Data is not sold to third parties.
- Data is not used or transferred for purposes unrelated to the item's single purpose.
- Data is not used or transferred to determine creditworthiness or for lending purposes.

**Retention:** not written to a database at this time. If persistence is ever added, the privacy policy and listing will be updated before the code ships.

If the form or a reviewer treats the flagged page URL as "web history", point to the privacy policy: the extension sends one current page URL/title when a banner fires, never a list of visited pages.

---

## 4. Note for reviewer

```
ScamScanned is a local, privacy-first listing checker. It has no accounts, no analytics, and no remote code.

To test:
1. Install the extension.
2. Open a supported product page. A banner is intentionally absent on healthy pages; silence is the honest result when no configured check matches.
3. For a banner specimen, open the Amazon listing with ASIN B0H69DP8CB (a recorded mass-generated listing) and compare against a mainstream listing from a major brand, which should stay silent.
4. The extension contacts only https://scamscanned.com/api/index.php, and only when a banner renders on Amazon or Walmart. eBay, Etsy, Craigslist, and Facebook scans are fully local.
5. The full source, privacy policy, and methodology page are public: https://scamscanned.com/method.html

Permission note: the only host permission is the ScamScanned API domain. Marketplace access comes from declared content-script matches so the extension can read the page the user is already viewing. No chrome.* API permissions are requested.
```

---

## 5. Screenshots and promo assets

Required: at least one screenshot, **1280x800** or **640x480**, PNG or JPEG. Up to five.

Recommended real shots (do not fabricate UI):
1. **Banner on a flagged Amazon listing** — full browser window, banner and page context visible.
2. **Meter + "What's on your side"** — close enough to read the six zones and the counterweight column.
3. **Silent healthy listing** — no banner; caption: "No matched signals, no banner."
4. **Pivot results** — the safe-alternatives results page after clicking the banner link.
5. **Methodology page** — optional; shows the public rules and limits.

Rules: no account menus, orders, carts, addresses, messages, or reviewer names. Crop or blur anything personal.

Optional promo assets:
- Small promo tile: **440x280**
- Marquee: **1400x560**
- Existing brand source: `brand/scamscanned-og.png` (1200x630) and `brand/scamscanned-icon-master.png`

Suggested captions:
- "A warning only when the page matches concrete caution signals."
- "See what matched, and what is on your side."
- "Graduated risk: silent, low caution, elevated, extreme."
- "Every claim is checkable in the public GPLv3 source."

---

## 6. After approval

1. Replace the landing's primary sideload button with the Chrome Web Store link; keep the ZIP as a manual-install alternative.
2. Add the store URL to README, INSTALL, and CHANGELOG.
3. Verify the store listing's privacy text matches the live privacy policy word-for-word on the data fields.
4. Run the release gate from `SECURITY.md` before every future store update: privacy wording == behavior, no new domains, copy passes the banned-words list, docs match code, no new permissions.
