// sensor-etsy.js — ScamScanned Alpha
// Etsy engine v2 (minimal honest scope): Etsy listing pages
// (/listing/) only. Rules: messaging-channel share markers (blue) and
// delivery windows with cross-year correction (red at or beyond
// 14 days). Hedged vocabulary throughout: tier titles name risk
// framing, never assert fraud. No telemetry relay and no pivot button
// during Alpha (platform contracts pending); scanning is fully local.

(function () {
    'use strict';

    // 1. Immutable Constants and Vocabulary Library

    const MIN_RISK_DAYS = 14;

    const RED_TIER_TITLE = 'Elevated Risk — Multiple Caution Signals Detected';
    const BLUE_TIER_TITLE = 'Unclear Risk — Verify the Seller Before Purchasing';

    const FONT_STACK = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    const SHIPPING_REASON = 'EXTENDED_SHIPPING';
    const SHARED_LINK_REASON = 'SHARED_LINK_SOURCE';

    const REASON_LIBRARY = {
        EXTENDED_SHIPPING: {
            label: 'Extended waiting period before delivery',
            detail: 'Delivery windows that stretch past typical refund timelines can outlast buyer protection. If the item never arrives, the window to dispute may already be closed.'
        },
        SHARED_LINK_SOURCE: {
            label: 'Link was passed through a messaging channel',
            detail: 'Listing links that travel through SMS, WhatsApp or Messenger sometimes lead to high-pressure funnels intended to bypass marketplace checkout. Legitimate shares look identical from the link alone, so treat this as context and verify the seller before buying.'
        }
    };

    const PALETTE = {
        surface: '#1C1C1E',
        accent: '#DC143C',
        blueAccent: '#4A90D9',
        deepCrimson: '#8B0000',
        text: '#FFFFFF'
    };

    const MONTH_INDEX = {
        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
        apr: 3, april: 3, may: 4, jun: 5, june: 5,
        jul: 6, july: 6, aug: 7, august: 7,
        sep: 8, sept: 8, september: 8, oct: 9, october: 9,
        nov: 10, november: 10, dec: 11, december: 11
    };

    // 2. Engine — evaluation core with error interception.

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
            return /(^|\.)etsy\.com$/i.test(window.location.hostname || '');
        } catch (err) {
            return false;
        }
    }

    // Page-type gate: listing detail pages only.
    function isItemPage() {
        try {
            return /\/listing\//.test(window.location.pathname || '');
        } catch (err) {
            return false;
        }
    }

    // Deep shadow-DOM walker (same design as the proven Amazon engine).
    function getDeepPageText(node) {
        if (!node) return '';
        let out = '';
        const SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, IFRAME: 1 };
        function walk(el) {
            if (!el || SKIP[el.tagName]) return;
            if (el.nodeType === 3) {
                out += el.nodeValue;
                return;
            }
            if (el.nodeType !== 1) return;
            if (el.shadowRoot) {
                Array.prototype.forEach.call(el.shadowRoot.childNodes, walk);
            }
            Array.prototype.forEach.call(el.childNodes, walk);
        }
        walk(node);
        return out;
    }

    function extractPageText() {
        let deep = '';
        try {
            deep = getDeepPageText(document.body);
        } catch (err) { deep = ''; }
        const deepChars = deep.replace(/\s/g, '').length;
        if (deepChars >= 500) return { text: deep, source: 'deep' };
        try {
            const inner = document.body ? (document.body.innerText || '') : '';
            return {
                text: (inner.length > deep.length ? inner : deep),
                source: inner.length > deep.length ? 'inner' : 'deep-thin'
            };
        } catch (err) {
            return { text: deep, source: 'deep-thin' };
        }
    }

    function normalizePageText(raw) {
        return (raw || '')
            .toLowerCase()
            .replace(/[\u00a0\u2028\u2029]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Date arithmetic without an explicit year resolves into the next
    // year whenever the parsed month has already passed.
    function daysUntil(monthIdx, dayOfMonth, year) {
        try {
            const now = new Date();
            let resolved = year;
            if (!resolved) {
                resolved = (monthIdx < now.getMonth())
                    ? now.getFullYear() + 1
                    : now.getFullYear();
            }
            const target = new Date(resolved, monthIdx, dayOfMonth);
            if (isNaN(target.getTime())) return null;
            return Math.ceil((target.getTime() - now.getTime()) / 86400000);
        } catch (err) {
            return null;
        }
    }

    // T-1: delivery horizons — Etsy anchors to window ranges
    // ("Delivery estimate: Between Thu, Oct 22 and Sat, Nov 7") and
    // occasionally single dates. An optional weekday token precedes
    // each date; the UPPER end of the window is the risk signal (the
    // longest wait the buyer may face).
    function hasExtendedDelivery(pageText) {
        if (!pageText) return false;
        const rangeRe =
            /between\s+(?:[a-z]{3,9}\.?,?\s*)?([a-z]{3,9})\.?,?\s+([0-9]{1,2})\s+(?:and|to|through|-|–|—)\s+(?:[a-z]{3,9}\.?,?\s*)?([a-z]{3,9})\.?,?\s+([0-9]{1,2})/g;
        let m;
        let worstUpper = null;
        while ((m = rangeRe.exec(pageText)) !== null) {
            const first = MONTH_INDEX[m[1]];
            const second = MONTH_INDEX[m[3]];
            if (typeof first !== 'number' || typeof second !== 'number') continue;
            const dayA = parseInt(m[2], 10);
            const dayB = parseInt(m[4], 10);
            if (isNaN(dayA) || isNaN(dayB)) continue;
            const later = ((second * 100 + dayB) >= (first * 100 + dayA))
                ? { m: second, d: dayB } : { m: first, d: dayA };
            const days = daysUntil(later.m, later.d, null);
            if (days !== null && (worstUpper === null || days > worstUpper)) {
                worstUpper = days;
            }
        }
        if (worstUpper !== null && worstUpper >= MIN_RISK_DAYS) return true;

        const singleRe =
            /(?:delivery|arrives|estimated)\s+(?:by|on|estimate\s*(?:dates?)?|date|dates?)?\s*:?\s*(?:[a-z]{3,9})\.?,?\s*([a-z]{3,9})\.?,?\s*([0-9]{1,2})(?:,?\s*([0-9]{4}))?/g;
        while ((m = singleRe.exec(pageText)) !== null) {
            const month = MONTH_INDEX[m[1]];
            if (typeof month !== 'number') continue;
            const year = m[3] ? parseInt(m[3], 10) : null;
            const days = daysUntil(month, parseInt(m[2], 10), year);
            if (days !== null && days >= MIN_RISK_DAYS) return true;
        }
        return false;
    }

    // T-2: messaging-channel share markers — URL parameters only.
    function hasSharedLinkMarker() {
        try {
            const params = new URLSearchParams(window.location.search || '');
            const src = (params.get('utm_source') || params.get('utm_medium') || '').toLowerCase();
            return !!(src && /(sms|whatsapp|text|textlink|messenger)/.test(src));
        } catch (err) {
            return false;
        }
    }

    function checkListingSafety() {
        const extracted = extractPageText();
        const rawText = extracted.text;
        const pageText = normalizePageText(rawText);

        if (!pageText) {
            return {
                isRisky: false, reasons: [], tier: null,
                debug: {
                    textChars: rawText.length, source: extracted.source,
                    head: '', excerpt: '(empty text)'
                }
            };
        }

        const reasons = [];

        if (safeEvaluate(function () { return hasSharedLinkMarker(); })) {
            reasons.push(SHARED_LINK_REASON);
        }
        if (safeEvaluate(function () { return hasExtendedDelivery(pageText); })) {
            reasons.push(SHIPPING_REASON);
        }

        let tier = null;
        if (reasons.length > 0) {
            tier = reasons.indexOf(SHIPPING_REASON) >= 0 ? 'red' : 'blue';
        }

        return {
            isRisky: reasons.length > 0,
            reasons: reasons,
            tier: tier,
            debug: {
                textChars: rawText.length,
                source: extracted.source,
                head: (document.title || '').slice(0, 80),
                excerpt: pageText.slice(0, 120)
            }
        };
    }

    // 3. Warning Renderer — hedged, tiered, footnoted. No pivot button
    // and no telemetry dispatch during Alpha.

    function injectSafetyBanner(evaluation) {
        if (!evaluation || !evaluation.isRisky) return;
        if (document.getElementById('scamscanned-etsy-shield')) return;

        const isBlueTier = evaluation.tier === 'blue';

        const banner = document.createElement('div');
        banner.id = 'scamscanned-etsy-shield';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('data-tier', evaluation.tier);
        banner.style.cssText = [
            'position: fixed; top: 0; left: 0; width: 100%;',
            'background-color: ' + PALETTE.surface + '; color: ' + PALETTE.text + ';',
            'font-family: ' + FONT_STACK + '; box-sizing: border-box;',
            'border-top: 2px solid ' + (isBlueTier ? PALETTE.blueAccent : PALETTE.accent) + ';',
            'text-align: left; padding: 14px 24px; z-index: 1000000;',
            'box-shadow: 0 4px 14px rgba(0,0,0,0.4);',
            'display: flex; flex-wrap: wrap; align-items: center; gap: 16px;'
        ].join(' ');

        const content = document.createElement('div');
        content.style.cssText = 'flex: 1 1 420px; min-width: 260px;';

        const headline = document.createElement('div');
        headline.style.cssText = 'font-size: 16px; font-weight: 600;';
        headline.innerText = isBlueTier ? BLUE_TIER_TITLE : RED_TIER_TITLE;

        const reasonList = document.createElement('ul');
        reasonList.style.cssText =
            'margin: 4px 0 0; padding-left: 18px; font-size: 12.5px;' +
            'color: rgba(255,255,255,0.85); line-height: 1.55;';
        (evaluation.reasons || []).forEach(function (key) {
            const info = REASON_LIBRARY[key] ||
                { label: key, detail: 'Automated heuristic signal.' };
            const li = document.createElement('li');
            const label = document.createElement('span');
            label.textContent = info.label;
            label.tabIndex = 0;
            label.style.cssText =
                'border-bottom: 1px dotted rgba(255,255,255,0.4); cursor: help;';
            const tip = document.createElement('div');
            tip.textContent = info.detail;
            tip.style.cssText =
                'display: none; position: absolute; width: 300px; background: #2C2C2E;' +
                'border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;' +
                'padding: 10px 12px; font-size: 12px; color: rgba(255,255,255,0.9);' +
                'z-index: 1000001; margin-top: 4px;';
            label.addEventListener('mouseenter', function () { tip.style.display = 'block'; });
            label.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
            label.addEventListener('focus', function () { tip.style.display = 'block'; });
            label.addEventListener('blur', function () { tip.style.display = 'none'; });
            li.appendChild(label);
            li.appendChild(tip);
            reasonList.appendChild(li);
        });

        const footNote = document.createElement('div');
        footNote.textContent =
            'Automated heuristic assessment based on public listing signals.' +
            ' Not a determination about any seller.';
        footNote.style.cssText =
            'font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;';

        content.appendChild(headline);
        content.appendChild(reasonList);
        content.appendChild(footNote);
        banner.appendChild(content);

        document.body.prepend(banner);
        document.body.style.marginTop = (banner.offsetHeight + 10) + 'px';
    }

    // 4a. (No telemetry dispatch: platform relay contract pending for
    // non-Amazon/Walmart marketplaces during Alpha.)

    // 4. Run — local live pathway.

    let scanCount = 0;

    function logScanDebug(evaluation) {
        const d = evaluation.debug || {};
        scanCount++;
        console.log(
            '[ScamScanned] scan #' + scanCount + ' risky=' + evaluation.isRisky +
            ' src=' + d.source + ' textChars=' + d.textChars +
            ' head="' + d.head + '" excerpt="' + d.excerpt + '"'
        );
    }

    let lastTiered = '';

    function runSafetyCheck() {
        if (window.top !== window.self) return;
        if (!isItemPage()) return;
        const evaluation = safeEvaluate(checkListingSafety) || {
            isRisky: false, reasons: [], tier: null
        };
        logScanDebug(evaluation);

        if (evaluation.isRisky && evaluation.tier) {
            const signature = evaluation.tier + '|' + (evaluation.reasons || []).join(',');
            if (signature === lastTiered) return;
            lastTiered = signature;
            injectSafetyBanner(evaluation);
        }
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
