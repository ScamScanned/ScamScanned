# ScamScanned Mail — Architecture Plan

Status: design only, not implemented.

Goal: warn about phishing in **Spectrum Webmail** and the **Outlook app** without harvesting email content, auto-deleting messages, or silently clicking links.

## The platform split (important)

A browser extension cannot run inside the Outlook desktop app. Outlook is a native/webview application, not a normal browser page. Two adapters are required, sharing one detection engine.

| Surface | Integration | Notes |
|---|---|---|
| Spectrum Webmail (`webmail.spectrum.net`, `mail3.spectrum.net`) | Browser extension content script | Runs in Chrome/Edge/Firefox where Spectrum webmail is open. |
| Outlook on the web (`outlook.office.com`, `outlook.live.com`) | Same browser extension | Works because it is a web page. |
| Outlook app (classic Windows, new Outlook, Mac, mobile) | Outlook add-in (Office.js) | A task pane/notification inside Outlook; no browser extension. |
| Gmail web | Browser extension (later phase) | Same engine, different DOM adapter. |

If the Outlook app is the requirement, the deliverable is **two products**: a browser extension and an Outlook add-in. One extension alone cannot satisfy it.

## Shared detection engine

Keep `mail-engine.js` pure and platform-independent. Adapters only normalize data and render results.

Inputs (only what the adapter can see for the opened message):

- display name, From address, Reply-To
- subject
- body text and visible links (`href` plus anchor text)
- attachment names and extensions
- authentication results if the client exposes them (SPF/DKIM/DMARC, Received chain)
- optional: domain age/reputation from a privacy-preserving lookup

Findings for the MVP:

- From vs Reply-To domain mismatch
- lookalike domains (`google.com` vs `goog1e.com`, `rn`/`m`, punycode)
- link text says one domain but href goes to another
- raw IP links, URL shorteners, unusual TLDs
- credential/payment urgency language
- dangerous attachment patterns (double extensions, archives containing executables)
- authentication failures when headers are available

Output:

- a severity band and plain-language reasons
- "open the official app/site directly" guidance
- a report-as-phishing action
- never a "safe" certificate; silence means no configured check matched
- no auto-delete, no auto-click, no automatic credential entry

AI is a second opinion that explains language patterns. Deterministic checks decide the warning. AI must not be the only reason a message is called safe or unsafe.

## Outlook add-in

- Office.js add-in with `ReadItem` permission.
- Host the task-pane HTML/JS on `scamscanned.com`; message content stays in the client unless the user explicitly opts into a lookup.
- MVP: user opens a message, clicks **Scan with ScamScanned**; task pane shows findings.
- Phase 2: event-based activation on message read in supported modern clients to show a notification/task pane automatically. Availability depends on Outlook client/version; classic Outlook on Windows has minimum build requirements, and mobile support is more limited.
- AppSource listing or Microsoft 365 admin deployment. Add-in-only manifest for the broadest client support; unified manifest has Mac/mobile limitations.
- Inbox-wide automatic scanning of every incoming message is **not** a normal client-side add-in capability. That needs server-side mail flow/Graph integration, which changes the privacy model and admin requirements. Do not promise it in the client-side product.

## Spectrum Webmail extension

- Separate extension named **ScamScanned Mail**, so the marketplace extension does not request mail permissions.
- Host matches: `https://webmail.spectrum.net/*` and `https://mail3.spectrum.net/*`; add the exact final host after login if Spectrum redirects.
- `all_frames: true` only if the webmail UI renders messages in an iframe; confirm from a DOM sample.
- Start with the opened-message view. Inbox-list scanning is more fragile because webmail DOM changes often; add it only after field testing.
- DOM selectors must be isolated in one adapter file so a Spectrum redesign does not break the engine.
- Need real DOM samples from a logged-in session (sanitized) to build reliable selectors. Do not ask for credentials.

## Privacy and trust

- Process message content locally in the extension/add-in.
- No email-body retention; no analytics identifiers; no selling data.
- Optional domain-reputation lookup sends only the domain or a hash, never the body, and is disclosed before use.
- No auto-delete and no auto-report without confirmation.
- Update `privacy.html` before shipping: email content processing, what leaves the device, retention (none), and the add-in's server-hosted code.
- Microsoft AppSource and browser-store reviews will scrutinize mail permissions; the "local-only" posture is the strongest defense.

## Distribution

1. Internal alpha: sideloaded browser extension + sideloaded Outlook add-in manifest.
2. Small field test with Spectrum webmail and one Outlook client.
3. Store listings: separate Chrome/Edge extension and Microsoft AppSource add-in.
4. Later: Gmail web adapter and Outlook web adapter reuse the same engine.

## What is needed before coding

- Which Outlook app exactly: classic Outlook for Windows, new Outlook for Windows, Outlook for Mac, Outlook mobile, or Outlook on the web?
- A sanitized screenshot/DOM sample of a Spectrum Webmail opened message (sender row, subject, body container, link markup).
- One or two real phishing `.eml` samples (redacted) to test the engine.
- Decision: separate extension/add-in, or add mail permissions to the existing marketplace extension. Recommendation: separate.

## Non-goals for the first version

- No browser engine.
- No server-side mailbox access.
- No AI-only verdicts.
- No automatic clicking, deleting, or reporting.
- No guarantee that a message is safe.
