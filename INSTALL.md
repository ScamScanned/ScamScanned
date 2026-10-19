# Install ScamScanned (Alpha)

Working in any modern Chrome or Edge browser on Windows or macOS.
No command line, no account, no configuration.

## The short version

1. **Download** `scamscanned-alpha-v0.1.0.zip`
   (from the [Releases](https://github.com/ScamScanned/ScamScanned/releases) page or
   [scamscanned.com](https://scamscanned.com/download/scamscanned-alpha-v0.1.0.zip)).
2. **Right-click the ZIP** in your Downloads folder → **Extract All…**
   (macOS: double-click to unzip).
3. **Open the extensions page**: type `chrome://extensions` into the address bar.
4. **Switch on Developer mode** — the toggle in the top-right corner.
5. **Click "Load unpacked"** (top-left), then select the extracted folder.
6. **Pin it**: click the puzzle-piece icon in the toolbar and pin
   **ScamScanned Alpha** so the shield is always one glance away.

That's it. Nothing is configured, nothing is collected at setup — the shield
appears on Amazon product pages when a listing trips its risk signals.

## Things that are normal during Alpha

- Chrome may occasionally show a small reminder banner that a manually added
  ("developer mode") extension is running. That reminder is expected for any
  side-loaded extension and it disappears once ScamScanned is accepted into
  the Chrome Web Store.
- Chrome sometimes rewrites `chrome://extensions` into plain text if you type
  it in a search box — make sure it lands in the **address bar**.

## Updating to a newer Alpha

1. Download the new ZIP and extract it (delete the old folder first).
2. Go to `chrome://extensions`, and on the ScamScanned card click the
   **reload** (circular arrow) icon.

## Uninstalling

Go to `chrome://extensions`, find the ScamScanned card, click **Remove**.

## Why not the Chrome Web Store yet?

A store listing is the next milestone: it turns this into a one-click install
with automatic updates. It requires a Google review pass — this Alpha is
being finalized first. Both install paths run the same public source code.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Load unpacked" is missing | Developer mode toggle (step 4) is off. |
| Banner never appears | You're likely on a non-product page (search results, Amazon seller profile pages show a different panel). Test on a product page. |
| No shield anywhere | Check the extension is enabled on `chrome://extensions` and pinned. |
| Wrong folder selected | Remove the extension card and re-run "Load unpacked" on the folder that contains `manifest.json`. |

The extension is GPLv3 open source — every heuristic it applies can be read
in [this repository](https://github.com/ScamScanned/ScamScanned).
