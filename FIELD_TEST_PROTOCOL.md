# Field Verification Protocol

Purpose: collect reproducible evidence from real marketplace pages so the detection rules can be calibrated from facts instead of guesses. One report can expose an under-detection (missed signal) or an over-detection (false warning); both are useful.

This protocol is for the current build: **ScamScanned Alpha v0.2.2**.

---

## Before testing (one time)

1. Install or update to v0.2.2:
   - `chrome://extensions` -> Developer mode -> Load unpacked -> select the extracted `scamscanned-alpha-v0.2.2` folder, **or**
   - install from the Chrome Web Store once the listing is live.
2. Confirm the version on the ScamScanned card reads **0.2.2**.
3. Open DevTools with **F12** (or Ctrl+Shift+I), go to the **Console** tab.
4. In the Console filter box, type `ScamScanned`. This hides everything else.
5. Open the Console settings (gear icon) and enable **Preserve log** so navigation does not erase the lines.
6. Keep a notes document open. One section per specimen.

The console lines are local diagnostics only. They are not extra telemetry.

---

## What to capture for every specimen

### A. Identity
- Date and time
- Extension version (`chrome://extensions`)
- Marketplace (Amazon, Walmart, eBay, Etsy, Craigslist, Facebook)
- URL with tracking parameters removed (everything from `?` onward can usually go)
- Page title, copied verbatim

### B. What the banner did
- Result: silent / yellow / red / extreme / blue / enforcement
- Meter line if present: `N of 6 signal zones flagged`
- Which zones were lit, if visible
- The exact headline and bottom line

### C. The page's own printed facts (verbatim)
- Seller line: the full buy-box sentence, for example `Sold by Example Store (1,225 ratings) 87% positive over the past 12 months`
- Delivery line: the exact estimate text
- Price and list price
- Platform badges: `New to Amazon`, `new seller`, `frequently returned`, etc.
- Product title exactly as printed

Verbatim matters: the parsers bind to the page's own wording, so a paraphrase cannot be tested.

### D. Console output
In the filtered Console:
- Right-click any line -> **Save as...** and save the log, **or**
- Select all filtered lines, copy, and paste them into the report.

Include suppression lines too. A line saying a weak signal was dropped is a successful calibration observation, not a failure.

### E. Screenshot
- One screenshot with the banner and enough page context to see the listing.
- A second close-up if the meter or counterweight text is small.
- Redact: account menu, orders, cart, addresses, payment details, messages, and any personal names or faces in review photos.

### F. Pivot result
- Click **Search safe alternatives** once.
- Copy the address bar URL of the results page.
- Note: are the results the same category? Does the flagged seller appear in them?

---

## Test matrix

Run these in order. Stop and report as soon as something looks wrong; do not "help" the extension by retrying a different page before capturing the first result.

### 1. Negative control — healthy listing
A mainstream product from a major brand or a seller with a large, healthy feedback record and normal delivery.
- Expected: **silent**. No banner.
- If a banner appears: this is the highest-value false-positive report. Capture everything in section C and D.

### 2. Single weak signal
A listing whose only oddity is one soft signal, such as an unusual storefront name but a healthy printed record.
- Expected: **yellow**, or **silent** if a stronger printed record suppresses the name inference.
- Report which of the two happened and the exact seller line.

### 3. Strong structural signal
A third-party listing with a delivery window weeks past normal marketplace timing.
- Expected: **red** (elevated).

### 4. Fulfillment contradiction
A listing that prints an Amazon-fulfillment claim next to a weeks-long delivery estimate.
- Expected: **red** (fulfillment-claim conflict), regardless of seller record.

### 5. Known specimen
The recorded mass-generated advent-calendar listing (ASIN `B0H69DP8CB`) or the original sister-incident specimen.
- Expected: calibrated tier for that pattern. Capture the current result; it is a regression check, not a pass/fail test.

### 6. Platform sweep
One real product or listing page on each:
- Walmart product page
- eBay item page
- Etsy listing page
- Craigslist or Facebook Marketplace item page

For Walmart and Amazon, capture the full diagnostic. For eBay, Etsy, Craigslist, and Facebook, expect no network request; capture the banner or reminder state.

### 7. Amazon seller-profile page
Open a seller profile from a banner's `Check this seller's record` link and capture the panel state. This path uses different rules from the product page.

### 8. Pivot hygiene
After one banner click, report the results URL. The `k=` parameter should not contain seller-name tokens, `amazoncom`, `amp`, deal-marketing phrases, or standalone years. Results should be in the same product category and should not route back into the flagged seller's own storefront.

---

## Copy-paste report template

```
SCAMSCANNED FIELD REPORT
Date/time:
Extension version (chrome://extensions):
Marketplace:
URL (tracking stripped):
Page title (verbatim):

RESULT
Banner tier:
Meter line / zones:
Headline (verbatim):
Bottom line (verbatim):

PAGE FACTS (verbatim)
Seller line:
Delivery line:
Price / list price:
Badges:
Product title:

WHAT HAPPENED
Expected:
Observed:
Anything unusual:

CONSOLE (filtered to "ScamScanned")
<paste>

PIVOT
Results URL:
Same category?:
Flagged seller present?:

ATTACHMENTS
Screenshot file name(s):
```

---

## Privacy rules for reports

- Public product or listing pages only.
- No account screens, order history, cart, checkout, addresses, payment details, or messages.
- No cookies, tokens, or full-page HTML dumps that may contain session data.
- Redact personal names and faces in review photos.
- If a page requires a login, skip it. Do not create an account to test.

---

## What happens with each report

1. The report is mapped to the rule or rules that fired (or should have fired).
2. Under-detection is fixed by extending the parser only with the exact printed text supplied; no guessed formats.
3. Over-detection is fixed by adding a suppression or calibration rule plus a harness case.
4. Every change gets a behavioral test and a ledger entry. No silent rule changes.
5. The extension is rebuilt and the version-sync rule is applied end to end.

Report format is deliberately boring: the more literal the page text, the more useful the result.
