// sensor-local.js — ScamScanned Alpha
// Local-trade engine v2 (minimal honest scope): one calm, dismissible
// safety reminder on in-person trade DETAIL pages only — Craigslist
// detail listings and Facebook Marketplace item pages (/marketplace/
// item/) — never on feeds, search pages or the Facebook main product.
// The reminder is general safety guidance, NOT an assessment of any
// listing or seller; it shows no risk tier and makes no claims.

(function () {
    'use strict';

    // 1. Immutable Constants

    const FONT_STACK = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const PALETTE = {
        surface: '#1C1C1E',
        blueAccent: '#4A90D9',
        text: '#FFFFFF'
    };

    // 2. Engine — page-type gates with error interception.

    function safeEvaluate(fn) {
        try {
            return fn();
        } catch (err) {
            console.warn('[ScamScanned] module error (intercepted):', err && err.message ? err.message : err);
            return null;
        }
    }

    function isSupportedHost() {
        try {
            const host = window.location.hostname || '';
            return /(^|\.)craigslist\.org$/i.test(host) ||
                   /(^|\.)facebook\.com$/i.test(host);
        } catch (err) {
            return false;
        }
    }

    // Page-type gate: detail surfaces only.
    //  - Craigslist detail listings: modern "/d/<region>/<category>/<id>"
    //    and legacy "*.htm" single-ad paths.
    //  - Facebook Marketplace: item detail pages only
    //    ("/marketplace/item/<id>"). Feeds, search and browse never qualify.
    function shouldRenderReminder() {
        try {
            const path = window.location.pathname || '';
            if (/(^|\.)craigslist\.org$/i.test(window.location.hostname || '')) {
                const modernDetail = /^\/d\/[^/]+\/[^/]+\/[^/]+/.test(path);
                const legacyDetail = /\.(html?|htm)$/i.test(path);
                return modernDetail || legacyDetail;
            }
            return /\/marketplace\/item\//.test(path);
        } catch (err) {
            return false;
        }
    }

    // 3. Reminder Renderer — standalone safety reminder.

    function injectReminder() {
        if (document.getElementById('scamscanned-local-shield')) return;

        const banner = document.createElement('div');
        banner.id = 'scamscanned-local-shield';
        banner.setAttribute('role', 'note');
        banner.style.cssText = [
            'position: fixed; top: 0; left: 0; width: 100%;',
            'background-color: ' + PALETTE.surface + '; color: ' + PALETTE.text + ';',
            'font-family: ' + FONT_STACK + '; box-sizing: border-box;',
            'border-top: 2px solid ' + PALETTE.blueAccent + ';',
            'text-align: left; padding: 12px 44px 12px 24px; z-index: 1000000;',
            'box-shadow: 0 4px 14px rgba(0,0,0,0.4);',
            'display: flex; align-items: center; gap: 14px;'
        ].join(' ');

        const shield = document.createElement('div');
        shield.textContent = 'i';
        shield.style.cssText = [
            'width: 22px; height: 22px; flex: none; border-radius: 50%;',
            'display: flex; align-items: center; justify-content: center;',
            'background: rgba(255,255,255,0.08); color: ' + PALETTE.blueAccent + ';',
            'font-weight: 700; font-size: 13px; font-style: normal;'
        ].join(' ');

        const content = document.createElement('div');

        const headline = document.createElement('div');
        headline.style.cssText = 'font-size: 13.5px; font-weight: 600;';
        headline.innerText = 'Local-trade basics';

        const body = document.createElement('div');
        body.style.cssText = 'font-size: 12.5px; color: rgba(255,255,255,0.8); margin-top: 2px; line-height: 1.5;';
        body.innerText =
            'Meet in public places, inspect items in person before paying, and ' +
            'never send deposits in advance. General reminder — not an ' +
            'assessment of this listing.';

        content.appendChild(headline);
        content.appendChild(body);
        banner.appendChild(shield);
        banner.appendChild(content);

        // Dismiss control: one click removes the reminder and restores
        // the page's original top margin.
        const close = document.createElement('button');
        close.type = 'button';
        close.setAttribute('aria-label', 'Dismiss reminder');
        close.textContent = '×';
        close.style.cssText = [
            'position: absolute; right: 14px; top: 12px;',
            'background: transparent; border: none; color: rgba(255,255,255,0.55);',
            'font-size: 18px; cursor: pointer; line-height: 1; padding: 4px;'
        ].join(' ');
        close.addEventListener('click', function () {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
            document.body.style.marginTop = '';
        });
        banner.appendChild(close);

        document.body.prepend(banner);
        document.body.style.marginTop = (banner.offsetHeight + 10) + 'px';
    }

    // 4a. (No telemetry dispatch: platform relay contract pending for
    // non-Amazon/Walmart marketplaces during Alpha.)

    // 4. Run — local live pathway.

    function runSafetyCheck() {
        if (window.top !== window.self) return;
        if (!safeEvaluate(function () { return shouldRenderReminder(); })) return;
        safeEvaluate(injectReminder);
    }

    function wireObserver() {
        try {
            let scanQueued = null;
            let firstQueuedAt = 0;
            const SCAN_DEBOUNCE_MS = 300;
            const SCAN_MAX_WAIT_MS = 2000;
            const observer = new MutationObserver(function () {
                if (scanQueued) {
                    if (Date.now() - firstQueuedAt < SCAN_MAX_WAIT_MS) {
                        clearTimeout(scanQueued);
                    } else {
                        return;
                    }
                } else {
                    firstQueuedAt = Date.now();
                }
                scanQueued = setTimeout(function () {
                    scanQueued = null;
                    safeEvaluate(runSafetyCheck);
                }, SCAN_DEBOUNCE_MS);
            });
            const target =
                document.body ||
                document.documentElement ||
                document;
            observer.observe(target, { childList: true, subtree: true });
        } catch (err) {
            console.warn('[ScamScanned] observer setup skipped (intercepted)');
        }
    }

    function startEngine() {
        if (!isSupportedHost()) return;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                safeEvaluate(runSafetyCheck);
                wireObserver();
            });
        } else {
            safeEvaluate(runSafetyCheck);
            wireObserver();
        }
    }

    startEngine();
})();
