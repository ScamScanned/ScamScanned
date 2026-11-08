# Security Policy

## Verifiable claims are security surface

Every privacy statement this project publishes — the extension listing, the site's privacy page, the README — is treated as a factual claim anyone can check in the source code. If we say "the extension sends nothing unless a banner fires," then any network request beyond that is, in your terms, a security bug. Report deviations first and loudly.

## Supported versions

We patch the latest published release only. See [CHANGELOG.md](CHANGELOG.md) for the current version.

## Reporting

- Preferred: open a GitHub issue.
- Sensitive findings: use GitHub's "Report a vulnerability" feature on the repository page.
- Helpful details: extension version (see `chrome://extensions`), the URL you were on, and — if you can — the console output (F12 → filter "ScamScanned").

## Scope

In scope:
- The extension's permission footprint and network behavior (background.js and every sensor file)
- Any request to a host the privacy page does not name
- The relay API (`https://scamscanned.com/api/index.php`): request handling, CORS, injection behaviors
- Site content that makes factual claims (the recovery steps, the privacy promises)

Out of scope:
- Social engineering of maintainers, or anything involving other people's accounts or devices
- Disagreements about detection quality — a warning you believe was a false positive is still useful, but file it as an ordinary issue. Accuracy reports ("this listing was flagged and turned out fine") are treated as calibration data and are always welcome.

## Standing commitments

- No analytics or advertising SDKs, ever.
- No unique identifiers in telemetry, ever.
- If a privacy promise must change, the policy changes first, in the same release, never silently.
- The extension only ever reports observations made on the page. It never asserts that an offer, seller, or review is safe, genuine, or satisfies any guarantee.
