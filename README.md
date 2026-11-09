# ScamScanned

ScamScanned is a free, open-source browser extension that checks marketplace listing pages for risky seller and fulfillment patterns before you check out.

It reads the page you are already viewing and shows a warning banner when a listing matches concrete checks — extended delivery windows, an unusual seller-name shape, a missing buy box, a deep markdown, or mass-generated listing text. The banner names the signals it found. It does not assert that a specific seller is a scammer.

## Install (Alpha, ~1 minute)

Full walkthrough with troubleshooting: [INSTALL.md](INSTALL.md).

1. Download `scamscanned-alpha-v0.2.5.zip` from [scamscanned.com](https://scamscanned.com/download/scamscanned-alpha-v0.2.5.zip).
2. Right-click → **Extract All…**
3. Open `chrome://extensions`, switch on **Developer mode**.
4. Click **Load unpacked** and select the extracted folder, then pin the shield.

## What it detects

- **Extended shipping horizons** — delivery estimates that run past normal marketplace timing ("4-6 weeks", calendar dates 2+ weeks out, cross-year rollover).
- **Shipping-cost check** — a printed shipping charge over $5, shown as an escalating cost disclosure rather than a scam verdict.
- **Seller-name shape signals** — 4+ consonant runs or all-caps storefront names; a weak signal, not proof.
- **Off-platform checkout exits** — a listing with no standard buy box, or one that points to the seller's own web address.
- **Pricing anomalies** — markdowns at or beyond 70% off the reference price.
- **Mass-generation fingerprints** — full-width CJK punctuation, adjacent duplicate tokens, keyword repeats in slugs and titles.
- **Seller track record** — on Amazon seller profile pages: storefront age under 6 months, positive-rating share at or below 85%.
- **eBay / Etsy listing basics** — share or messaging markers (context, not proof) and delivery windows that stretch two-plus weeks out, on eBay item and Etsy listing pages.
- **Local-trade reminder** — a dismissible safety reminder (never a risk verdict) on Craigslist and Facebook Marketplace item pages.

## Privacy

Scanning runs locally. On Amazon and Walmart, when a warning banner fires, one anonymous diagnostic of that listing (URL, page title, seller name) is sent to scamscanned.com to build the alternative-search link and check the public enforcement-record list (currently empty). eBay, Etsy, Craigslist and Facebook scans send nothing. No accounts, no cookies, no identifiers.

## Scope

Amazon carries the deepest rule set (listing checks plus seller-profile inspection). Walmart has its own ruleset. eBay and Etsy carry minimal, honest checks on listing pages only. Craigslist and Facebook Marketplace item pages get a small dismissible safety reminder — general guidance, never a verdict. Coverage improves as field reports come in. The enforcement-record feature ships disabled until there is a public list to check.

## Project docs

- [CHANGELOG.md](CHANGELOG.md) — user-facing version history.
- [SECURITY.md](SECURITY.md) — security posture and the verifiable-claims release gate.
- [FIELD_TEST_PROTOCOL.md](FIELD_TEST_PROTOCOL.md) — exact steps and template for sending field specimens and logs.
- [CHROME_STORE.md](CHROME_STORE.md) — Chrome Web Store listing copy, privacy answers, and submission checklist.
- [EMAIL_GUARD_PLAN.md](EMAIL_GUARD_PLAN.md) — architecture for Spectrum Webmail and Outlook phishing protection.
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — what to update on GitHub, the website, the store, and the API.
- [api/index.php](api/index.php) — relay endpoint and alternative-search link builder.
- [privacy.html](privacy.html) — the privacy policy, mirrored for source-level auditability.
- [recover.html](recover.html) — the refund-recovery guide, mirrored for source-level auditability.
- Methodology: https://scamscanned.com/method.html

## License

GPLv3 — see [LICENSE](LICENSE).
