# ScamScanned

Official open-source client-side files for the ScamScanned browser extension framework.

ScamScanned watches marketplace product pages while you shop and shows a warning
banner when a listing carries the concrete patterns that tend to sit right before a
bad purchase — extended shipping windows that outlast refund deadlines, burner
seller identities, off-platform checkout routing, implausible markdowns, and
mass-generated listing text. Risk framing stays hedged by design: it names
signals, it never asserts fraud.

## Install (Alpha, ~1 minute)

Full walkthrough with troubleshooting: [INSTALL.md](INSTALL.md).

1. Download `scamscanned-alpha-v0.1.0.zip` (Releases page).
2. Right-click → **Extract All…**
3. Open `chrome://extensions`, switch on **Developer mode**.
4. Click **Load unpacked** and select the extracted folder, then pin the shield.

## What it detects

- **Extended shipping horizons** — delivery estimates past marketplace refund windows ("4-6 weeks", calendar dates 2+ weeks out, cross-year rollover).
- **Burner seller identities** — 4+ consonant runs or all-caps storefront names.
- **Off-platform checkout exits** — sellers routing purchase completion through their own web addresses.
- **Ghost listings** — no standard buy box / exact out-of-stock phrasing.
- **Pricing anomalies** — markdowns at or beyond 70% off reference pricing.
- **AI-listing fingerprints** — full-width CJK punctuation, adjacent duplicate tokens, keyword repeats in slugs and titles.
- **Seller track record** — on Amazon seller profile pages: storefront age under 6 months, positive-rating share at or below 85%.
- **Price history link** — one-click independent price curve (camelcamelcamel) on flagged Amazon listings.
- **eBay / Etsy listing basics** — messaging-channel share markers (context, not proof) and delivery windows that stretch two-plus weeks out, on eBay item and Etsy listing pages.
- **Local-trade reminder** — a dismissible safety reminder (never a risk verdict) on Craigslist and Facebook Marketplace item pages.

## Privacy

Scanning runs locally. When a listing is flagged, an anonymous diagnostic of
that listing (URL, page title, seller name) is relayed to scamscanned.com so
the risk signals can be validated. No accounts, no cookies, no identifiers.

## Scope

Amazon carries the deep engine (listing rules, seller-profile inspection,
price history). Walmart has its own ruleset, ready for field validation.
eBay and Etsy carry minimal, honest engines (listing pages only). Craigslist
and Facebook Marketplace item pages get a small dismissible safety reminder —
general guidance, never a verdict. Coverage matures as field reports come in.
The adjudicated enforcement-record feature ships disabled until field
conditions warrant it.

## License

GPLv3 — see [LICENSE](LICENSE).
