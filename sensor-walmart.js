// sensor-walmart.js — ScamScanned Alpha
// Walmart sensor engine: domain-adapted rules replacing the temporary
// sensor-amazon stopgap route. Walmart's marketplace pattern differs from
// Amazon's: acquisition phrasing is "Sold (and/&amp;) shipped by X", delivery
// is date-anchored ("arrives by Thu, Oct 30, 2026"), and checkout exits route
// to third-party businesses named with their own domains.
//
// Liability vocabulary policy applies unchanged: risk-framed tier titles,
// internal reason keys mapped through REASON_LIBRARY, hedged tooltip
// language. No assertion that any seller is fraudulent.

(function () {
    'use strict';

    // 1. Immutable Constants and Vocabulary Library

    const AFFILIATE_TAG = 'scamscanned-20'; // Amazon-side tag: only valid on amazon.com links.
    const MIN_RISK_DAYS = 14;
    const MIN_RISK_WEEKS = 2;
    const PRICE_MARKDOWN_THRESHOLD = 0.70;

    const SHIPPING_REASON = 'EXTENDED_SHIPPING';
    const GHOST_LISTING_REASON = 'HIDDEN_CHECKOUT';
    const MERCHANT_IDENTITY_REASON = 'MERCHANT_IDENTITY';
    const PRICING_ANOMALY_REASON = 'PRICING_ANOMALY';
    const OFF_PLATFORM_REASON = 'OFF_PLATFORM_SELLER';
    const LISTING_GENERATION_REASON = 'LISTING_GENERATION_PATTERN';

    const RED_TIER_TITLE = 'Elevated Risk — Multiple Caution Signals Detected';
    const BLUE_TIER_TITLE = 'Unclear Risk — Verify the Seller Before Purchasing';
    const ENFORCEMENT_TIER_TITLE = 'DO NOT BUY — Official Enforcement Record on Seller';

    const FONT_STACK = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    const REASON_LIBRARY = {
        EXTENDED_SHIPPING: {
            label: 'Extended waiting period before delivery',
            detail: 'Delivery estimates far beyond typical marketplace timelines can outlast Walmart protection options. If the item never arrives, the window to dispute may already be closed — the delay itself can be the trap.'
        },
        HIDDEN_CHECKOUT: {
            label: 'No standard checkout — purchase routes through secondary offers',
            detail: 'When the listing\'s featured offer is missing or sold out, "purchase" clicks route through secondary seller channels that may sit outside Walmart\'s normal fulfillment, refund, and dispute protections.'
        },
        MERCHANT_IDENTITY: {
            label: 'Seller name matches high-risk patterns',
            detail: 'Machine-generated letter strings and block-capital storefront names correlate with throwaway seller accounts created in bulk and abandoned once disputes begin.'
        },
        PRICING_ANOMALY: {
            label: 'Pricing inconsistent with typical retail markups',
            detail: 'Markdowns this deep are typically used to short-circuit comparison shopping. On mainstream products, an 80–90% "deal" from a third-party seller is usually the bait, not the bargain.'
        },
        OFF_PLATFORM_SELLER: {
            label: 'Seller routes buyers through its own storefront',
            detail: 'This seller advertises under its own web address. Purchase completion may occur off Walmart.com, outside the marketplace\'s standard buyer protections and dispute tooling.'
        },
        LISTING_GENERATION_PATTERN: {
            label: 'Listing text matches mass-generation patterns',
            detail: 'The product title and URL contain artifacts typical of bulk-generated listings — non-native punctuation from automated copy-paste workflows, or keyword-stacked phrasing. These patterns correlate strongly with throwaway storefronts.'
        },
        ENFORCEMENT_RECORD: {
            label: 'Seller appears in official fraud enforcement records',
            detail: 'A government agency or court has published an enforcement action naming a seller operating under this name. The linked source is the official public record — this notice reports that record and is not an independent determination by ScamScanned.'
        }
    };

    // Walmart checkout channels are not yet selector-mapped (documented
    // limitation); the freeze becomes active once selectors are added.
    const BLOCKED_CHECKOUT_SELECTORS = [];

    const PALETTE = {
        surface: '#1C1C1E',
        accent: '#DC143C',
        blueAccent: '#4A90D9',
        enforcement: '#F59E0B',
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

    // 2. Engine — evaluation core with module-error interception.

    function safeEvaluate(fn) {
        try {
            return fn();
        } catch (err) {
            console.warn('[ScamScanned] module error (intercepted):', err && err.message ? err.message : err);
            return null;
        }
    }

    // Domain gate: this engine must never run off walmart.com.
    function isSupportedHost() {
        try {
            return /(^|\.)walmart\.com$/i.test(window.location.hostname || '');
        } catch (err) {
            return false;
        }
    }

    // Deep shadow-DOM walker (same design as the Amazon engine): Walmart
    // widgets occasionally respawn inside light-DOM islands and custom
    // elements; the walker keeps text collection resilient either way.
    function getDeepPageText(node) {
        if (!node) return '';
        let out = '';
        const SKIP = {
            SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, IFRAME: 1
        };
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

        // Dual-source: if the deep walk is thin, body.innerText rescues.
        if (deepChars >= 500) {
            return { text: deep, source: 'deep' };
        }
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

    // Route A analog: FIRST (main-offer) logistics cluster binding. On
    // Walmart the main offer precedes "More offers" carousels; neutralization
    // binds to the earliest "sold (and/&amp;) shipped by" cluster window only.
    // Any "overseas" mention inside the cluster voids neutralization outright
    // ( homage to the Amazon advent-calendar field lesson).
    const CLUSTER_WINDOW = 150;

    // Shared seller anchor: covers "Sold & shipped by X", "Sold and shipped
    // by X", and "Sold by X". Runs on RAW-case text (all-caps burner detection
    // dies on normalized input); lazy capture + boundary lookahead keeps the
    // name from swallowing the trailing logistics phrase (same design as the
    // Amazon engine's extractSellerName).
    function findSellerAnchor(pageText) {
        if (!pageText) return null;
        try {
            // Boundary lookahead is DOMAIN-AWARE: a sentence-end '.' only
            // terminates the seller name when followed by whitespace (so
            // "SaveOnTextbooks.com" survives) while trailing domain periods,
            // commas and semicolons still end the name.
            return /sold (?:(?:&|and)\s*shipped|by)\s+(?:by\s+)?([a-z0-9 .,'&-]{2,60}?)(?=\s+(?:and\s+)?(?:fulfilled|ships|sold|delivery|arrives|free|usually|returns)\b|[.,;]\s|[.,;]$|\n)/i.exec(pageText);
        } catch (err) {
            return null;
        }
    }

    function hasSecureLogistics(pageText) {
        if (!pageText) return false;
        const m = safeEvaluate(function () { return findSellerAnchor(pageText); });
        if (!m) return false;
        const start = Math.max(0, m.index - CLUSTER_WINDOW);
        const end = Math.min(pageText.length, m.index + m[0].length + CLUSTER_WINDOW);
        const cluster = pageText.slice(start, end);

        if (/overseas/.test(cluster)) return false;
        return /walmart\.com|walmart fulfillment|fulfilled by walmart/.test(cluster);
    }

    // W-1: delivery horizon — Walmart anchors to calendar dates
    // ("arrives by Thu, Oct 30", "Get it by Oct 30, 2026") and week counts.
    // Without an explicit year, the date is refreshed into the NEXT year
    // whenever the parsed month has already passed (cross-year correction).
    function daysUntil(monthIdx, dayOfMonth, year) {
        try {
            const now = new Date();
            const y = year || (function () {
                if (monthIdx < now.getMonth()) return now.getFullYear() + 1;
                return now.getFullYear();
            })();
            const target = new Date(y, monthIdx, dayOfMonth);
            if (isNaN(target.getTime())) return null;
            return Math.ceil((target.getTime() - now.getTime()) / 86400000);
        } catch (err) {
            return null;
        }
    }

    function hasExtendedShippingByDate(pageText) {
        if (!pageText) return false;
        const re =
            /(?:arrives?|get it)\s*(?:by|on)?\s*,?\s*(?:[a-z]{3,9})?,?\s*([a-z]{3,9})\s+([0-9]{1,2})(?:,?\s*([0-9]{4}))?/g;
        let m;
        while ((m = re.exec(pageText)) !== null) {
            const month = MONTH_INDEX[m[1]];
            if (typeof month !== 'number') continue;
            const day = parseInt(m[2], 10);
            const year = m[3] ? parseInt(m[3], 10) : null;
            const days = daysUntil(month, day, year);
            if (days !== null && days >= MIN_RISK_DAYS) {
                return true;
            }
        }
        return false;
    }

    function hasExtendedShippingWeeks(pageText) {
        if (!pageText) return false;
        const m = pageText.match(/(?:arrives?|ships?)\s+in\s+([0-9]+)\s*(?:-|–|—|to)?\s*([0-9]+)?\s*weeks?/);
        if (!m) return false;
        const upper = m[2] ? parseInt(m[2], 10) : parseInt(m[1], 10);
        return upper >= MIN_RISK_WEEKS;
    }

    // W-1c: overseas fulfillment signature (same field lesson as Amazon B-1).
    function hasOverseasFulfillment(pageText) {
        return !!pageText && pageText.indexOf('ships from overseas') >= 0;
    }

    // W-2: seller-name capture (FIRST cluster only, RAW-case text).
    function getSellerName(pageText) {
        if (!pageText) return null;
        const m = safeEvaluate(function () { return findSellerAnchor(pageText); });
        if (!m) return null;
        const name = (m[1] || '')
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[.,;]+$/, '');
        return name || null;
    }

    function hasOffPlatformSeller(pageText) {
        const name = safeEvaluate(function () { return getSellerName(pageText); });
        if (!name) return false;
        try {
            // First-party sentinel: when the captured name IS walmart.com
            // (e.g., overseas-voided first-party pages), off-platform cannot
            // apply — Walmart.com is the platform.
            if (/walmart\.com/i.test(name)) return false;
            return /\.(?:com|net|us|shop|store|co)\b/.test(name);
        } catch (err) {
            return false;
        }
    }

    // W-3: burner-name entropy — verbatim B-6 logic from the proven Amazon
    // engine (operates on the captured name string):
    //   (a) entropy: 4+ consecutive consonants with zero vowels
    //   (b) all-caps: 4+ letters, 100% UPPERCASE, no word capitalization
    function hasGarbledMerchantName(name) {
        if (!name) return false;
        const nameText = String(name);
        if (/[b-df-hj-np-tv-z]{4,}/i.test(nameText)) return true;
        const letters = nameText.replace(/[^A-Za-z]/g, '');
        if (letters.length >= 4 && letters === letters.toUpperCase()) return true;
        return false;
    }

    // W-4: ghost/out-of-stock — Walmart's exact main-listing phrasings only
    // (generic carousels can contain "Out of stock" for unrelated items).
    function hasGhostListing(pageText) {
        if (!pageText) return false;
        return (
            pageText.indexOf('this item is currently out of stock') >= 0 ||
            pageText.indexOf('sorry, this item is out of stock') >= 0
        );
    }

    // W-5: pricing anomaly — Walmart discount phrasing "You save $12.90 (30%)"
    // and crossed-out price pairs "was $89.99 now $17.99".
    function hasPricingAnomaly(pageText) {
        if (!pageText) return false;
        const saveMatch = /you save \$[0-9.,]+\s*\(([0-9]{1,3})%\)/.exec(pageText);
        if (saveMatch) {
            const pct = parseInt(saveMatch[1], 10);
            if (pct >= Math.round(PRICE_MARKDOWN_THRESHOLD * 100)) return true;
        }
        const crossMatch = /was \$\s*([0-9.,]+)\s*now \$\s*([0-9.,]+)/.exec(pageText);
        if (crossMatch) {
            const was = parseFloat(crossMatch[1].replace(/[^0-9.]/g, ''));
            const now = parseFloat(crossMatch[2].replace(/[^0-9.]/g, ''));
            if (was > 0 && now >= 0 && now / was <= PRICE_MARKDOWN_THRESHOLD) return true;
        }
        return false;
    }

    // W-6: AI-listing generation fingerprint — same artifact rules as the
    // Amazon engine (decoded full-width CJK punctuation, adjacent duplicate
    // tokens, 3+ repeats), adapted surfaces: walmart slug + product headline.
    function hasGeneratedListingPattern() {
        const surfaces = [];
        try {
            const rawPath = String((window.location && window.location.pathname) || '');
            surfaces.push(rawPath);
            try {
                const decoded = decodeURIComponent(rawPath);
                if (decoded !== rawPath) surfaces.push(decoded);
            } catch (uriErr) { surfaces.push(''); }
        } catch (err) { surfaces.push(''); }
        try {
            const head =
                document.querySelector &&
                document.querySelector('[data-testid="product-headline"], #productTitle');
            if (head && (head.innerText || head.textContent)) {
                surfaces.push(String(head.innerText || head.textContent));
            }
        } catch (err) { surfaces.push(''); }

        const FULLWIDTH =
            /[\uFF0C\u3001\uFF01\uFF1F\uFF1A\uFF1B\uFF08\uFF09\u3010\u3011\u300A\u300B]/;
        for (let s = 0; s < surfaces.length; s++) {
            const surface = surfaces[s];
            if (!surface) continue;
            if (FULLWIDTH.test(surface)) return true;
            const tokens = surface.toLowerCase()
                .split(/[^a-z0-9]+/)
                .filter(function (t) { return t.length >= 3 && t.length <= 20; })
                .slice(0, 24);
            if (tokens.length < 4) continue;
            for (let i = 1; i < tokens.length; i++) {
                if (tokens[i] === tokens[i - 1]) return true;
            }
            const counts = {};
            for (let i = 0; i < tokens.length; i++) {
                counts[tokens[i]] = (counts[tokens[i]] || 0) + 1;
                if (counts[tokens[i]] >= 3) return true;
            }
        }
        return false;
    }

    function checkListingSafety() {
        const extracted = extractPageText();
        const rawText = extracted.text;
        const pageText = normalizePageText(rawText);

        if (!pageText) {
            return {
                isRisky: false, reasons: [], tier: null, blockCheckout: false,
                debug: {
                    textChars: rawText.length, source: extracted.source,
                    bodyChildren: document.body ? document.body.childNodes.length : -1,
                    head: '', excerpt: ''
                }
            };
        }

        // Route A: main-offer neutralizer (first logistics cluster).
        if (safeEvaluate(function () { return hasSecureLogistics(pageText); })) {
            return {
                isRisky: false, reasons: [], tier: null, blockCheckout: false,
                debug: {
                    textChars: rawText.length, source: extracted.source,
                    bodyChildren: document.body ? document.body.childNodes.length : -1,
                    head: (document.title || '').slice(0, 80),
                    excerpt: 'neutralized: walmart first-party logistics window'
                }
            };
        }

        const reasons = [];
        let ghostTriggered = false;

        if (safeEvaluate(function () { return hasGhostListing(pageText); })) {
            ghostTriggered = true;
            reasons.push(GHOST_LISTING_REASON);
        }

        if (safeEvaluate(function () { return hasGeneratedListingPattern(); })) {
            reasons.push(LISTING_GENERATION_REASON);
        }

        // W-1: date-anchored horizon (upper bound is the risk signal).
        if (safeEvaluate(function () { return hasExtendedShippingByDate(pageText); })) {
            reasons.push(SHIPPING_REASON);
        }

        // W-1b: week-count phrasing.
        if (safeEvaluate(function () { return hasExtendedShippingWeeks(pageText); })) {
            reasons.push(SHIPPING_REASON);
        }

        // W-1c: overseas fulfillment signature.
        if (safeEvaluate(function () { return hasOverseasFulfillment(pageText); })) {
            reasons.push(SHIPPING_REASON);
        }

        // W-2: off-platform seller.
        if (safeEvaluate(function () { return hasOffPlatformSeller(pageText); })) {
            reasons.push(OFF_PLATFORM_REASON);
        }

        // W-3: burner-name entropy (RAW-case capture — all-caps detection).
        const sellerName = safeEvaluate(function () { return getSellerName(rawText); }) || '';
        if (sellerName && safeEvaluate(function () { return hasGarbledMerchantName(sellerName); })) {
            reasons.push(MERCHANT_IDENTITY_REASON);
        }

        // W-5: pricing anomaly.
        if (safeEvaluate(function () { return hasPricingAnomaly(pageText); })) {
            reasons.push(PRICING_ANOMALY_REASON);
        }

        let tier = null;
        if (reasons.length > 0) {
            tier = ghostTriggered ? 'blue' : 'red';
        }

        return {
            isRisky: reasons.length > 0,
            reasons: reasons,
            tier: tier,
            blockCheckout: false, // Walmart checkout selectors not yet mapped.
            debug: {
                textChars: rawText.length, source: extracted.source,
                bodyChildren: document.body ? document.body.childNodes.length : -1,
                head: (document.title || '').slice(0, 80),
                excerpt: pageText.slice(0, 120)
            }
        };
    }

    // 4a. Secure Telemetry Dispatch (background fetch network layer).

    function isValidPivotUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'https:' &&
                   /(^|\.)amazon\.com$/i.test(parsed.hostname);
        } catch (err) {
            return false;
        }
    }

    function dispatchTelemetry() {
        const platformSource =
            window.location.hostname.indexOf('amazon.com') >= 0 ? 'amazon_us' : 'walmart_us';

        const telemetryPayload = {
            platform_source: platformSource,
            target_url: window.location.href,
            telemetry_data: {
                page_title: document.title || '',
                seller_name: safeEvaluate(function () {
                    return getSellerName(
                        (document.body && getDeepPageText(document.body)) || ''
                    );
                }) || null
            }
        };

        try {
            chrome.runtime.sendMessage(
                { type: 'SCAMSCANNED_TELEMETRY', payload: telemetryPayload },
                function (response) {
                    if (chrome.runtime.lastError) {
                        console.warn(
                            '[ScamScanned] telemetry: relay unavailable — (' +
                            (chrome.runtime.lastError.message || 'unknown') + ')'
                        );
                        return;
                    }
                    if (!response || !response.ok) {
                        console.warn(
                            '[ScamScanned] telemetry: server unreachable —' +
                            ' fallback active'
                        );
                        return;
                    }
                    if (response.verified_record &&
                        typeof response.verified_record === 'object' &&
                        response.verified_record.source_url) {
                        applyEnforcementRecord(response.verified_record);
                    }
                    if (isValidPivotUrl(response.safe_pivot_url)) {
                        const button = document.getElementById('scamscanned-action-button');
                        if (button) {
                            // Enforcing OUR domain safety: amazon.com pivots
                            // are valid on ANY marketplace page we scan
                            // (the tag contract lives with amazon links).
                            button.href = response.safe_pivot_url;
                            const sub = document.getElementById('scamscanned-action-subtext');
                            if (sub) {
                                sub.textContent =
                                    "Opens Amazon's Prime-eligible, 4-star-and-up results";
                            }
                        }
                    } else if (response.safe_pivot_url) {
                        console.warn('[ScamScanned] telemetry: pivot rejected by armor — fallback active');
                    }
                }
            );
        } catch (err) {
            console.warn('[ScamScanned] telemetry: dispatch error (intercepted)');
        }
    }

    // 3. Warning Renderer (same trust-grade disclosure as the Amazon build).

    function blockUnvettedCheckoutChannels() {
        if (!BLOCKED_CHECKOUT_SELECTORS.length) return;
        if (document.getElementById('scamscanned-checkout-block')) return;
        const style = document.createElement('style');
        style.id = 'scamscanned-checkout-block';
        style.textContent =
            BLOCKED_CHECKOUT_SELECTORS.join(', ') +
            ' { pointer-events: none !important; opacity: 0.35 !important; }';
        (document.head || document.documentElement).appendChild(style);
    }

    function applyEnforcementRecord(record) {
        try {
            const evaluation = {
                isRisky: true,
                reasons: ['ENFORCEMENT_RECORD'],
                tier: 'enforcement',
                blockCheckout: true,
                enforcement: record
            };
            const existing = document.getElementById('scamscanned-alert-shield');
            if (existing) {
                existing.setAttribute('data-tier', 'enforcement');
                existing.style.borderTopColor = PALETTE.enforcement;
                const headlineEl = existing.querySelector('#scamscanned-alert-headline');
                if (headlineEl) {
                    headlineEl.innerText = ENFORCEMENT_TIER_TITLE;
                }
            } else {
                injectSafetyBanner(evaluation);
            }
            blockUnvettedCheckoutChannels();
        } catch (err) {
            console.warn('[ScamScanned] enforcement render skipped (intercepted)');
        }
    }

    function injectSafetyBanner(evaluation) {
        if (!evaluation || !evaluation.isRisky) return;
        if (document.getElementById('scamscanned-alert-shield')) return;

        const isBlueTier = evaluation.tier === 'blue';
        const isEnforcement = evaluation.tier === 'enforcement';

        const banner = document.createElement('div');
        banner.id = 'scamscanned-alert-shield';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('data-tier', evaluation.tier);
        banner.style.cssText = [
            'position: fixed; top: 0; left: 0; width: 100%;',
            'background-color: ' + PALETTE.surface + '; color: ' + PALETTE.text + ';',
            'font-family: ' + FONT_STACK,
            'border-top: 2px solid ' + (
                isEnforcement ? PALETTE.enforcement :
                (isBlueTier ? PALETTE.blueAccent : PALETTE.accent)
            ) + ';',
            'text-align: left; padding: 16px 28px; z-index: 1000000;',
            'box-shadow: 0 6px 18px rgba(0,0,0,0.45);',
            'display: flex; flex-wrap: wrap; align-items: center;',
            'justify-content: center; gap: 20px; box-sizing: border-box;'
        ].join(' ');

        // Hazard triangle (pure CSS).
        const icon = document.createElement('div');
        icon.style.cssText =
            'width: 46px; height: 46px; border-radius: 6px;' +
            'display: flex; align-items: center; justify-content: center;' +
            'background: rgba(255,255,255,0.06); flex: none;';
        const mark = document.createElement('div');
        mark.textContent = '!';
        mark.style.cssText =
            'font-size: 24px; font-weight: 800; color: ' + PALETTE.accent + ';';
        icon.appendChild(mark);

        const content = document.createElement('div');
        content.style.cssText = 'flex: 1 1 320px; min-width: 260px;';

        const headline = document.createElement('div');
        headline.id = 'scamscanned-alert-headline';
        headline.style.cssText =
            'font-size: 18px; font-weight: 600; letter-spacing: 0.2px;';
        headline.innerText = isEnforcement ? ENFORCEMENT_TIER_TITLE :
            (isBlueTier ? BLUE_TIER_TITLE : RED_TIER_TITLE);

        const reasonList = document.createElement('ul');
        reasonList.style.cssText =
            'margin: 6px 0 0; padding-left: 18px; font-size: 13px;' +
            'color: rgba(255,255,255,0.85); line-height: 1.6;';
        (evaluation.reasons || []).forEach(function (key, index) {
            const info = REASON_LIBRARY[key] || { label: key, detail: 'Automated heuristic signal.' };
            const li = document.createElement('li');
            const label = document.createElement('span');
            label.textContent = info.label;
            label.tabIndex = 0;
            label.setAttribute('role', 'button');
            label.setAttribute('aria-describedby', 'scamscanned-tt-' + index);
            label.style.cssText =
                'border-bottom: 1px dotted rgba(255,255,255,0.4); cursor: help;';
            const tip = document.createElement('div');
            tip.id = 'scamscanned-tt-' + index;
            tip.textContent = info.detail;
            tip.style.cssText =
                'display: none; position: absolute; width: 300px;' +
                'background: #2C2C2E; border: 1px solid rgba(255,255,255,0.2);' +
                'border-radius: 6px; padding: 10px 12px; font-size: 12px;' +
                'color: rgba(255,255,255,0.9); z-index: 1000001; margin-top: 6px;';
            label.addEventListener('mouseenter', function () {
                tip.style.display = 'block';
            });
            label.addEventListener('mouseleave', function () {
                tip.style.display = 'none';
            });
            label.addEventListener('focus', function () {
                tip.style.display = 'block';
            });
            label.addEventListener('blur', function () {
                tip.style.display = 'none';
            });
            li.appendChild(label);
            li.appendChild(tip);
            reasonList.appendChild(li);
        });

        const footNote = document.createElement('div');
        footNote.textContent = isEnforcement
            ? 'This notice reports publicly available enforcement records.' +
              ' It is not an independent determination by ScamScanned.'
            : 'Automated heuristic assessment based on public listing signals.' +
              ' Not a determination about any seller.';
        footNote.style.cssText =
            'font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 6px; line-height: 1.4;';

        let citation = null;
        if (isEnforcement && evaluation.enforcement && evaluation.enforcement.source_url) {
            citation = document.createElement('a');
            citation.href = evaluation.enforcement.source_url;
            citation.target = '_blank';
            citation.rel = 'noopener noreferrer';
            citation.textContent = 'View official record: ' +
                (evaluation.enforcement.source_label || 'enforcement source');
            citation.style.cssText =
                'display: inline-block; margin-top: 8px; color: ' +
                PALETTE.enforcement + '; font-size: 12px; font-weight: 600;' +
                'text-decoration: underline; letter-spacing: 0.2px;';
        }

        content.appendChild(headline);
        content.appendChild(reasonList);
        content.appendChild(footNote);
        if (citation) {
            content.appendChild(citation);
        }

        // Action pivot: routes to safe alternatives. On Walmart pages the
        // fallback is an (unbranded) Walmart title search; a validated
        // server pivot may swap it to an Amazon search when telemetry runs.
        const pivotButton = document.createElement('a');
        pivotButton.id = 'scamscanned-action-button';

        const fallbackQuery = (document.title || '')
            .replace(/[^A-Za-z0-9\s]/g, ' ')
            .trim()
            .replace(/\s+/g, ' ')
            .split(' ')
            .filter(function (t) { return t.length > 1; })
            .slice(0, 8)
            .map(function (t) { return encodeURIComponent(t); })
            .join('+');
        pivotButton.href =
            'https://www.walmart.com/search?q=' +
            (fallbackQuery || 'safe%20alternatives');
        pivotButton.target = '_blank';
        pivotButton.rel = 'noopener noreferrer';
        pivotButton.style.cssText = [
            'display: inline-block; background-color: #FFFFFF;',
            'color: ' + PALETTE.deepCrimson + '; padding: 10px 22px;',
            'border-radius: 2px; text-decoration: none;',
            'font-family: ' + FONT_STACK + '; font-size: 15px; font-weight: 600;',
            'letter-spacing: 0.3px; white-space: nowrap;',
            'box-shadow: 0 2px 6px rgba(0,0,0,0.35);'
        ].join(' ');
        pivotButton.innerText = 'Search Safe Alternatives';

        const pivotSubtext = document.createElement('div');
        pivotSubtext.id = 'scamscanned-action-subtext';
        pivotSubtext.textContent = 'Opens a Walmart title search';
        pivotSubtext.style.cssText = [
            'font-size: 10px; color: rgba(255,255,255,0.5);',
            'letter-spacing: 0.3px; text-align: center; max-width: 220px;'
        ].join(' ');

        const pivotWrap = document.createElement('div');
        pivotWrap.style.cssText =
            'display: flex; flex-direction: column; align-items: center; gap: 6px;';
        pivotWrap.appendChild(pivotButton);
        pivotWrap.appendChild(pivotSubtext);

        banner.appendChild(icon);
        banner.appendChild(content);
        banner.appendChild(pivotWrap);

        document.body.prepend(banner);
        document.body.style.marginTop =
            (banner.offsetHeight + 12) + 'px';
    }

    // 4. Run — local live pathway.

    let scanCount = 0;
    let lastTiered = '';

    function logScanDebug(evaluation) {
        const d = evaluation.debug || {};
        scanCount++;
        console.log(
            '[ScamScanned] scan #' + scanCount + ' risky=' + evaluation.isRisky +
            ' src=' + d.source + ' textChars=' + d.textChars +
            ' bodyChildren=' + d.bodyChildren +
            ' head="' + d.head + '" excerpt="' + d.excerpt + '"'
        );
    }

    function runSafetyCheck() {
        if (window.top !== window.self) return;
        const evaluation = safeEvaluate(checkListingSafety) || {
            isRisky: false, reasons: [], tier: null, blockCheckout: false
        };
        logScanDebug(evaluation);

        if (evaluation.isRisky && evaluation.tier) {
            const signature = evaluation.tier + '|' + (evaluation.reasons || []).join(',');
            if (signature === lastTiered) return;
            lastTiered = signature;
            if (document.getElementById('scamscanned-alert-shield') &&
                document.getElementById('scamscanned-alert-shield').getAttribute('data-tier') ===
                (evaluation.tier === 'enforcement' ? 'enforcement' : evaluation.tier)) {
                return;
            }
            injectSafetyBanner(evaluation);
            if (evaluation.blockCheckout) {
                blockUnvettedCheckoutChannels();
            }
            dispatchTelemetry();
        }
    }

    window.addEventListener('load', function () {
        safeEvaluate(runSafetyCheck);
    });

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
