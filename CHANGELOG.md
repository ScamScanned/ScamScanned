# Changelog

All notable user-facing changes to the ScamScanned browser extension are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.3] — 2026-11-08

### Added
- Shipping-cost check: on Amazon, when the page prints an explicit shipping charge that is over $5, escalating at $15 and again at $30 or above the item price, the banner shows a cost disclosure with both amounts; the warning escalates from yellow to orange to red as the charge rises. It is a cost fact, not a scam verdict, and it stays silent on "free delivery over $35" or "shipping calculated at checkout."
- The alternative-search builder now splits digit/letter runs, so a title like "1:64Collectible" no longer becomes the token `64collectible`; the bare `64` is dropped and `collectible` is kept.

## [0.2.2] — 2026-11-07

### Changed
- Store-readiness: removed the unused `activeTab` permission — the extension now requests no API permissions at all — and added a `homepage_url` pointing at scamscanned.com.
- Clearer banner wording: reason labels now describe the printed evidence instead of asserting a motive, and Walmart, eBay, and Etsy now use a singular headline when only one signal fires. The tooltip for the fulfillment conflict now tells the shopper what to check rather than asking them to read console output.
- Shipping precision: extended-delivery and fulfillment-conflict checks now read only the main offer's logistics block, never recommendation carousels or stale hidden text. Return-policy dates (for example "FREE refund/replacement until Jan 31, 2027") are excluded, the word "Shipper" no longer counts as a shipping keyword, and "Ships from and sold by Amazon.com" / "Shipper / Seller Amazon.com" now correctly count as Amazon fulfillment. A date only rolls into next year at a true December-to-January boundary.
- Extreme-tier visual weight: the extreme banner now uses a bright red border, dark-red gradient, red glow, larger warning icon, and a solid EXTREME badge. Elevated keeps the standard crimson outline, so extreme now reads as more severe rather than less.
- Diagnostics: the console scan summary now prints `shippingTrigger`, the matched `shippingEvidence` (for example `december 2 (~25 days out)`), and the scoped logistics excerpt, so a field report can pinpoint a shipping finding without guessing.

## [0.2.1] — 2026-11-07

### Added
- Graduated risk tiers: a listing can now come back silent, low-caution (yellow), elevated (red), or extreme (multiple aligned signals). Signal *strength* decides the band, not raw count.
- In-banner signal meter: six named zones (seller record, seller name, price, fulfillment and checkout, listing text, platform return data). A zone lights only when one of its checks actually fired — nothing aggregates into a number that implies odds.
- Balanced verdicts: every banner pairs "Watch for" with "What's on your side". Both columns contain only facts printed on the page; neither column certifies anything.
- Fast-verification tip: how to double-check a listing yourself in seconds — look at the photos buyers added in the reviews, then read several of them; texts that all sound alike are a mass-generation signal.
- Seller snapshot: "Sold by X (N ratings, P% positive)" with a direct record link.
- Fulfillment-claim conflict detection: an Amazon-fulfillment claim printed alongside a weeks-long delivery window is its own strong signal — the two claims cannot both be true.
- Product-review-volume cross-check: a very large printed buyer-rating count suppresses the weakest inference (odd-looking seller names) while counterparty checks keep running.
- Recommendation-page hygiene: seasonal deal-marketing phrases ("limited time deal", "Black Friday", "Prime Day", "Cyber Monday") are stripped out of the generated similar-products search links. Genuine seasonal words (advent, christmas) are kept.

### Changed
- Weighting calibration: a brand-new seller with no Amazon-fulfillment claim weighs in at elevated on its own; with a fulfillment claim it stays low-caution (platform handling keeps recovery robust). Lone weak signals — for example, only a strange seller name — land as low caution instead of a full warning.

## [0.2.0] — 2026-11-07

### Added
- Seller-history checks: the extension now reads the buy box's own printed feedback stats ("N ratings, P% positive") as band rules, honors platform-printed "New to Amazon" / "new seller" badges, and only stacks corroborators (no-review listing, mid-band discounts) after a primary signal exists. An Amazon-fulfillment claim no longer whitewashes the seller checks.
- Website additions: a refund-recovery guide (Amazon A-to-z ladder, card chargeback lane, FTC/IC3 steps) and a privacy policy; the relay API was hardened (wildcard CORS removed).

### Fixed
- The banner no longer says "multiple caution signals" when a single rule fired — headlines and bottom lines are count-honest.

## [0.1.0] — Initial public alpha

- Amazon prototype: structural checks (extended third-party shipping windows, missing standard buy box, mass-generation listing-text patterns, deep price bands), a one-click similar-products search, and the first release zip with a normie-proof install guide.
