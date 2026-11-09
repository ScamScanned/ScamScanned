# Release Checklist

Three deploy targets, plus the source of truth:

| Target | What lives there | When it changes |
|---|---|---|
| **GitHub** | Source, docs, site source, API source | Every meaningful change |
| **Website (cPanel)** | `public_html/` pages, download zip, API | Site copy, download links, new extension zip, API code |
| **Chrome Web Store** | The extension package | Only when extension code/manifest/UI changes |

## Decision table

| Change type | GitHub | Website | Chrome Web Store | API |
|---|---|---|---|---|
| Extension code, banner, manifest, permissions | Yes | New zip + landing version/link | **Yes** — new version required | Only if server code changed |
| Landing page / method / recovery / privacy copy | Yes | Upload changed pages | No | No |
| README / CHANGELOG / docs only | Yes | Usually no | No | No |
| API relay / query builder | Yes | No | No | **Yes** — upload `api/index.php` |
| Sitemap / robots | Yes | Yes | No | No |

## Extension release (the full path)

1. Make the code change.
2. Bump the version in `manifest.json` (for example `0.2.5` -> `0.2.6`). Never reuse a version already submitted to the store.
3. Update every version-synced surface:
   - `manifest.json`
   - zip filename
   - landing chip, download href, button text, filename
   - `README.md`, `INSTALL.md`
   - `INSTALL-NOW-v<version>.txt`
   - `CHANGELOG.md`
   - `CHROME_STORE.md` build hash
   - `verify-live.ps1` expectations
4. Run validation:
   - `node --check` on all sensors
   - the slice harness
   - HTML parser on changed pages
   - PHP check if `api/index.php` changed
5. Build the zip with `build-release.ps1`; record its size and SHA256.
6. Commit and push GitHub.
7. Upload to cPanel:
   - `index.html` (and any changed pages)
   - `download/scamscanned-alpha-v<version>.zip`
   - delete the previous zip online
   - `api/index.php` only if it changed
8. Upload the zip to the Chrome Web Store developer console and submit. Existing users update automatically after approval.
9. Run `verify-live.ps1`.
10. After store approval, optionally make the store link the primary landing CTA and keep the zip as the manual-install fallback.

## Website-only change

1. Edit the file in `ScamScanned Website files/`.
2. Validate HTML/links.
3. Mirror it into the repo.
4. Commit and push GitHub.
5. Upload the changed file(s) to cPanel.
6. No Chrome Web Store action.

## API-only change

1. Edit `ScamScanned Website files/api/index.php`.
2. Run a PHP 8.3 syntax check and a query test if relevant.
3. Mirror to `api/index.php` in the repo.
4. Commit and push GitHub.
5. Upload to `public_html/api/index.php`.
6. Bump `api_version` so the live upload is unambiguous.
7. No Chrome Web Store action.

## Docs-only change

1. Edit the doc.
2. Commit and push GitHub.
3. No deploy.

## Store update rules

- Every store submission needs a **higher version number**.
- Do not replace a live zip under the same version; the store will reject it and users can end up with mismatched builds.
- You do not need to re-enter the whole listing for an update, but you must upload a new package and submit it for review.
- Keep the privacy policy and data disclosures unchanged unless behavior changed. If behavior changed, update them first.

## Bad-state checklist

These should always match before deployment:

- `manifest.json` version == zip filename version == landing chip/href/filename version
- `CHANGELOG.md` has an entry for that version
- `INSTALL-NOW.txt` inside the zip has the same version
- `CHROME_STORE.md` build hash matches the zip
- `verify-live.ps1` expected size/hash matches the zip
- No stale version references on the landing page
- Old zips deleted from cPanel after the new one is live
