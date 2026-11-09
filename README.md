# ScamScanned

A free, open-source browser extension that warns you about risky marketplace listings before you check out.

**Status:** Alpha, v0.2.5 (November 8, 2026). Manual install for Chrome and Edge. Chrome Web Store submission is pending.

Website: https://scamscanned.com

## What it does

ScamScanned reads the marketplace page you are already viewing and shows a warning banner when the listing matches concrete checks. The banner names the signals it found and lets you decide what to do.

It is built for one job: show the printed evidence that is easy to miss before checkout. It does not claim to know whether a seller is honest.

## What it does not do

- No accounts, no sign-ups, no cookies, no analytics, no ad networks.
- No collection of your browsing history, other tabs, keystrokes, or form data.
- No product-photo analysis and no review-authenticity claims.
- No auto-delete or auto-click. On a ghost-listing result, the extension can temporarily freeze unvetted secondary checkout controls.
- No "safe" certification. A silent banner means no configured check matched, not that a listing passed.
- No affiliation with Amazon, Walmart, eBay, Etsy, Craigslist, or Facebook.

## Install (Alpha, ~1 minute)

Full walkthrough with troubleshooting: [INSTALL.md](INSTALL.md).

1. Download `scamscanned-alpha-v0.2.5.zip` from [scamscanned.com](https://scamscanned.com/download/scamscanned-alpha-v0.2.5.zip).
2. Right-click → **Extract All…**
3. Open `chrome://extensions`, switch on **Developer mode**.
4. Click **Load unpacked**, select the extracted folder, then pin the shield.

Chrome and Edge are supported. Firefox is not supported yet.

**Release integrity:** the v0.2.5 zip is 63,828 bytes with SHA256 `B5D71DBF4D7A4E3954A892FEFB071D5B350B6B92DC26A4E69D63D8DABFD2953C`.

## What it checks

- **Extended delivery windows** — estimates that run past normal marketplace timing. The warning gets stronger as the window gets longer.
- **Shipping cost** — a printed shipping charge over $5, shown as an escalating cost disclosure, not a scam verdict.
- **Seller-name shape** — unusual strings or all-caps storefront names. A weak signal, not proof.
- **Missing standard buy box** — checkout may route through a secondary seller offer.
- **Off-platform seller links** — listings that point to the seller's own web address.
- **Deep markdowns** — prices far below the reference price.
- **Mass-generation fingerprints** — copy-paste artifacts and keyword-stacked titles or URLs.
- **Seller track record** — on Amazon seller profile pages: storefront age and printed positive-rating share.
- **eBay and Etsy basics** — share/messaging markers (context, not proof) and long delivery windows.
- **Local-trade reminder** — a dismissible safety reminder, never a risk verdict, on Craigslist and Facebook Marketplace item pages.

## Privacy and data

Scanning happens locally in your browser.

On Amazon and Walmart, when a warning banner actually fires, one diagnostic of that listing is sent to `scamscanned.com`:

- the marketplace name,
- the flagged page URL,
- the page title,
- the seller name printed on that page.

It is used to build the alternative-search link and to check a curated list of public enforcement records (currently empty). eBay, Etsy, Craigslist, and Facebook scans send nothing. There are no accounts, cookies, or user identifiers, and nothing is sold.

The full policy is [privacy.html](https://scamscanned.com/privacy.html); the raw page is mirrored in this repository for source-level auditability.

## Verify the claims

The source is public under GPLv3. You do not have to trust the marketing copy; you can check each claim:

- **Source and detection logic:** the files in this repository, especially `sensor-amazon.js` and `background.js`.
- **Privacy policy:** https://scamscanned.com/privacy.html (source mirror: [privacy.html](privacy.html)).
- **Methodology and limits:** https://scamscanned.com/method.html.
- **Security posture and release gate:** [SECURITY.md](SECURITY.md).
- **Version history:** [CHANGELOG.md](CHANGELOG.md).
- **Corrections and audit requests:** https://github.com/ScamScanned/ScamScanned/issues.

If a network request exists beyond the one diagnostic described above, that is a bug worth reporting publicly.

## Scope

Amazon carries the deepest rule set, including seller-profile inspection. Walmart has its own rule set. eBay and Etsy use minimal checks on listing pages. Craigslist and Facebook Marketplace item pages get a dismissible safety reminder.

Coverage improves as field reports come in. The enforcement-record feature ships disabled until there is a public list to check.

## Project docs

- [CHANGELOG.md](CHANGELOG.md) — user-facing version history.
- [SECURITY.md](SECURITY.md) — security posture and the verifiable-claims release gate.
- [FIELD_TEST_PROTOCOL.md](FIELD_TEST_PROTOCOL.md) — how to send field specimens and logs.
- [CHROME_STORE.md](CHROME_STORE.md) — Chrome Web Store listing copy and submission checklist.
- [EMAIL_GUARD_PLAN.md](EMAIL_GUARD_PLAN.md) — parked architecture for email phishing protection.
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — what to update on GitHub, the website, the store, and the API.
- [api/index.php](api/index.php) — relay endpoint and alternative-search link builder.
- [recover.html](https://scamscanned.com/recover.html) — the refund-recovery guide (source mirror: [recover.html](recover.html)).

## License

GPLv3 — see [LICENSE](LICENSE).
