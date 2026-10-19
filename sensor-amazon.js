// sensor-amazon.js — ScamScanned Alpha
// Enterprise visual layer + expanded risk criteria matrix (B-1..B-8)
// with full error shielding against hidden buy-box DOM variations.
// Pipeline: domain gate -> SAFE text extraction -> neutralizers ->
//           risk matrix (ghost escalation first, every rule intercepted)
//           -> banner render (tier-aware, bulleted sub-reasons, checkout
//           blocklist for ghost listings) -> telemetry dispatch
//           -> dynamic pivot href from HostGator safe_pivot_url.

(function() {
    'use strict';

    // 1. Immutable Global Architecture Constants
    const AFFILIATE_TAG = 'scamscanned-20';
    const MIN_RISK_DAYS = 14;
    const MIN_RISK_WEEKS = 2;
    const PRICE_MARKDOWN_THRESHOLD = 0.70;

    const PALETTE = {
        surface: '#1C1C1E',      // Charcoal Matte
        accent: '#DC143C',       // Crimson (red-tier top border)
        blueAccent: '#4A90D9',   // Steel blue (blue-tier top border)
        enforcement: '#F59E0B',  // Amber/gold (enforcement-tier top border)
        deepCrimson: '#8B0000',  // Button text
        text: '#FFFFFF'
    };
    const FONT_STACK = "system-ui, -apple-system, 'Inter', 'Segoe UI', Arial, sans-serif";

    // LIABILITY-SAFE RISK VOCABULARY: never assert scam/fraud as fact. Every
    // reason is a pattern observation with a hedged, educational explanation
    // (shown as a hover/focus tooltip). Internal keys — labels live only in
    // the library so wording can be tuned without touching engine logic.
    const SHIPPING_REASON = 'EXTENDED_SHIPPING';
    const GHOST_LISTING_REASON = 'HIDDEN_CHECKOUT';
    const DEFECT_HISTORY_REASON = 'DEFECT_HISTORY';
    const MERCHANT_IDENTITY_REASON = 'MERCHANT_IDENTITY';
    const PRICING_ANOMALY_REASON = 'PRICING_ANOMALY';
    const LISTING_GENERATION_REASON = 'LISTING_GENERATION_PATTERN';
    const FRESH_SELLER_REASON = 'FRESH_SELLER_ACCOUNT';
    const SELLER_TRACK_RECORD_REASON = 'SELLER_TRACK_RECORD';

    const RED_TIER_TITLE = 'Elevated Risk — Multiple Caution Signals Detected';
    const BLUE_TIER_TITLE = 'Unclear Risk — Verify the Seller Before Purchasing';
    const ENFORCEMENT_TIER_TITLE = 'DO NOT BUY — Official Enforcement Record on Seller';

    const REASON_LIBRARY = {
        EXTENDED_SHIPPING: {
            label: 'Extended third-party shipping window',
            detail: 'Delivery estimates far beyond typical marketplace timelines can outlast the buyer-protection period. If the item never arrives, the refund window may already be closed — the delay itself can be the trap.'
        },
        HIDDEN_CHECKOUT: {
            label: 'No standard buy box — checkout routes through unvetted offers',
            detail: 'When a listing shows no featured offer, purchases route through secondary seller channels that may fall outside normal marketplace fulfillment, refund, and dispute protections.'
        },
        DEFECT_HISTORY: {
            label: 'Frequently returned item',
            detail: 'The marketplace itself flags this item as returned unusually often. High return rates on listings like this often signal misrepresented condition, quality, or compatibility.'
        },
        MERCHANT_IDENTITY: {
            label: 'Seller name matches high-risk patterns',
            detail: 'Machine-generated letter strings and block-capital storefront names correlate with throwaway seller accounts created in bulk and abandoned once chargebacks begin.'
        },
        PRICING_ANOMALY: {
            label: 'Pricing inconsistent with typical retail markups',
            detail: 'Markdowns this deep are typically used to short-circuit comparison shopping. On mainstream products, an 80–90% "deal" from a new third-party seller is usually the bait, not the bargain.'
        },
        ENFORCEMENT_RECORD: {
            label: 'Seller appears in official fraud enforcement records',
            detail: 'A government agency or court has published an enforcement action naming a seller operating under this name. The linked source is the official public record — this notice reports that record and is not an independent determination by ScamScanned.'
        },
        LISTING_GENERATION_PATTERN: {
            label: 'Listing text matches mass-generation patterns',
            detail: 'The product title and URL contain artifacts typical of bulk-generated listings — non-native punctuation from automated copy-paste workflows, or keyword-stacked phrasing. These patterns correlate strongly with throwaway storefronts and template-generated product pages.'
        },
        FRESH_SELLER_ACCOUNT: {
            label: 'Seller storefront history is recent',
            detail: 'This seller account began operating recently and has little verifiable track record. Marshal Very young storefronts correlate with bulk-created burner accounts that operate briefly and vanish once disputes arrive — longer histories are easier to hold accountable.'
        },
        SELLER_TRACK_RECORD: {
            label: 'Seller ratings trail marketplace norms',
            detail: 'This seller\'s own feedback history shows a positive-rating share below accepted marketplace levels. Reputation deficits tend to persist, so review individual feedback entries — especially negative ones — before purchasing.'
        }
    };

    // Unvetted secondary checkout selectors frozen when a ghost listing fires.
    const BLOCKED_CHECKOUT_SELECTORS = [
        '#buybox',
        '#all-offers-display',
        '#addToCart',
        '#buy-now-button',
        '#newAccordionRow',
        'div[id^="accordionRow"]',
        'span[data-action="add-to-cart"]'
    ];

    // Domain gate: amazon.com plus the manifest-routed secondary marketplace.
    const SUPPORTED_MARKETPLACE_PATTERN = /(^|\.)(amazon|walmart)\.com$/i;

    function isSupportedMarketplace() {
        return SUPPORTED_MARKETPLACE_PATTERN.test(window.location.hostname || '');
    }

    // 2. Core Heuristic Analysis Engine (expanded + error-shielded matrix)
    // Returns { isRisky, reasons[], tier: 'red'|'blue', blockCheckout }.
    // Every rule is intercepted so a null selector or undefined page object
    // bails that single check cleanly instead of crashing the whole loop.

    // ERROR INTERCEPTION: wrapper that converts a throwing heuristic into a
    // clean false result (no console TypeError ever escapes the matrix).
    function safeEvaluate(check) {
        try {
            return Boolean(check());
        } catch (err) {
            return false;
        }
    }

    // DEEP SHADOW DOM SCANNER: recursively parses page elements manually,
    // collecting each node's basic text value and — CRITICAL — diving
    // directly into any node.shadowRoot capsule to extract the hidden inner
    // text tokens locked inside shadow DOM encapsulation. Non-visual script
    // and style containers are skipped (innerText never exposed them).
    function getDeepPageText(node) {
        if (!node) return '';

        // Text nodes carry the actual character data.
        if (node.nodeType === 3) {
            return String(node.nodeValue || '');
        }

        // Skip non-visual containers so raw script bodies cannot inject
        // fake risk signatures into the scanned stream.
        if (node.nodeType === 1) {
            const tag = (node.tagName || '').toLowerCase();
            if (tag === 'script' || tag === 'style' ||
                tag === 'noscript' || tag === 'template') {
                return '';
            }
        }

        let text = '';

        // Shadow capsule first: if the node owns a shadowRoot, recurse into
        // its childNodes and harvest the encapsulated text tokens.
        if (node.shadowRoot) {
            const shadowChildren = node.shadowRoot.childNodes || [];
            for (let i = 0; i < shadowChildren.length; i++) {
                text += getDeepPageText(shadowChildren[i]) + ' ';
            }
        }

        // Then walk the light DOM children.
        const children = node.childNodes || [];
        for (let i = 0; i < children.length; i++) {
            text += getDeepPageText(children[i]) + ' ';
        }
        return text;
    }

    // Month token parser: maps "jan", "january", "sept" etc. to 1-12.
    function parseMonthToken(token) {
        const months = {
            jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
            jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
        };
        const key = String(token || '').replace(/\./g, '').toLowerCase();
        return months[key.slice(0, 3)] || null;
    }

    // DATE-RANGE SHIPPING PARSER (Rule B-2b): Amazon renders long-haul third-
    // party estimates as date ranges ("FREE delivery Tue, Jan 6 - Wed, Feb 11")
    // rather than "in N days" phrases. Scans keyword windows for month-day
    // tokens, resolves the LATEST date, applies cross-year correction, and
    // flags when the later bound breaches the day threshold.
    function hasLongShippingDateRange(pageText) {
        if (!pageText) return false;
        const keywordRe = /(arrives?|arrival|deliver(?:y|ies|ed)?|ships?)/g;
        const now = new Date();
        let km;
        while ((km = keywordRe.exec(pageText)) !== null) {
            const windowText = pageText.slice(km.index + km[0].length, km.index + km[0].length + 90);
            const dateRe = /([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/g;
            let dm;
            while ((dm = dateRe.exec(windowText)) !== null) {
                const month = parseMonthToken(dm[1]);
                const day = parseInt(dm[2], 10);
                if (!month || day < 1 || day > 31) continue;

                let estimate = new Date(now.getFullYear(), month - 1, day);
                // Cross-year correction: dates more than 2 days in the past
                // belong to next year (Dec window spanning into Jan).
                if (estimate.getTime() < now.getTime() - 2 * 86400000) {
                    estimate.setFullYear(estimate.getFullYear() + 1);
                }
                const daysOut = Math.round((estimate.getTime() - now.getTime()) / 86400000);
                if (daysOut >= MIN_RISK_DAYS) return true;
            }
        }
        return false;
    }

    // MAIN-OFFER SCOPED NEUTRALIZER (v3): "ships from amazon" / "fulfilled by
    // amazon" only neutralize when they belong to THE MAIN BUY BOX — either
    // inside its actual DOM containers (#buybox / #tabular-buybox /
    // #merchant-info / #seller-profile-container), or within the FIRST
    // logistics cluster in page order. FIELD INCIDENT 2026-10-02: the
    // "Other Sellers on Amazon" carousel packs "Sold by X and Fulfilled by
    // Amazon" text adjacent to the scammer's offer, so any-anchor window
    // matching neutralized confirmed scam listings.
    function hasSecureLogistics(pageText) {
        if (!pageText) return false;

        // Primary: the page's real buy-box containers. Carousel and
        // cross-sell text never lives here.
        try {
            const containers = document.querySelectorAll(
                '#buybox, #tabular-buybox, #merchant-info, #seller-profile-container, #desktop_buybox'
            );
            for (let i = 0; i < containers.length; i++) {
                const boxText = normalizePageText(containers[i].innerText || '');
                if (boxText.includes('overseas')) return false; // main box: third-party
                if (boxText.includes('ships from amazon') ||
                    boxText.includes('fulfilled by amazon')) {
                    return true;
                }
            }
        } catch (err) {
            /* container probe failed — fall through to text fallback */
        }

        // Fallback: FIRST logistics cluster only — the main offer's seller
        // rows always precede other-seller carousels in page order.
        const firstAnchor = /(sold by|ships from|delivered by)/.exec(pageText);
        if (!firstAnchor) return false;
        const windowText = pageText.slice(
            Math.max(0, firstAnchor.index - 150),
            firstAnchor.index + 300
        );
        if (windowText.includes('overseas')) return false; // third-party clause
        return windowText.includes('ships from amazon') ||
               windowText.includes('fulfilled by amazon');
    }

    // Merchant Identity Shield (Rule B-6, refined): parses the seller name
    // from the RAW page text (case-sensitive) and flags either signature —
    //   (a) entropy: 4+ consecutive consonants with zero vowels
    //   (b) all-caps: 4+ letters, 100% UPPERCASE, no word capitalization
    function hasGarbledMerchantName(rawText) {
        if (!rawText) return false; // bail cleanly on null/undefined text
        const soldBy = rawText.match(/sold by\s+([A-Za-z0-9 &'\.\-]{2,40})/i);
        if (!soldBy) return false;
        const name = soldBy[1];

        // (a) Consonant entropy run (burner storefront signature).
        if (/[b-df-hj-np-tv-z]{4,}/i.test(name)) return true;

        // (b) Standalone ALL-CAPS identity shield (e.g., "ROTORS", "XQZDT").
        const letters = name.replace(/[^A-Za-z]/g, '');
        if (letters.length >= 4 && letters === letters.toUpperCase()) return true;

        return false;
    }

    // Price Urgency Trap (Rule B-7): extreme markdown beyond 70% off the
    // reference price combined with third-party fulfillment.
    function hasDeceptiveMarkdown(pageText) {
        if (!pageText) return false; // bail cleanly on null/undefined text
        if (hasSecureLogistics(pageText)) return false;

        const listMatch = pageText.match(
            /(?:list price|typical price|was)\s*[:\-]?\s*\$?\s?(\d[\d,]*(?:\.\d{1,2})?)/i
        );
        const currentMatch = pageText.match(/\$\s?(\d[\d,]*(?:\.\d{1,2})?)/);
        if (!listMatch || !currentMatch) return false;

        const listPrice = parseFloat(listMatch[1].replace(/,/g, ''));
        const currentPrice = parseFloat(currentMatch[1].replace(/,/g, ''));
        if (!(listPrice > 0) || !(currentPrice > 0)) return false;

        return (1 - currentPrice / listPrice) > PRICE_MARKDOWN_THRESHOLD;
    }

    // Text normalization: lowercase the entire page content and collapse all
    // whitespace runs (spaces, tabs, newlines) to single spaces so DOM line
    // breaks inside buy-box phrases cannot break signature matching.
    function normalizePageText(rawText) {
        return String(rawText || '')
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }

    // Ghost Listing Fallback (Rule B-8): Amazon-native strings revealing the
    // buy box has collapsed into unvetted secondary checkout channels.
    function hasGhostListing(pageText) {
        if (!pageText) return false; // bail cleanly on null/undefined text
        // Defensive FBA guard, buy-box scoped (Route A also runs upstream).
        if (hasSecureLogistics(pageText)) return false;
        return (
            pageText.includes('no featured offers available') ||
            pageText.includes('available from these sellers') ||
            pageText.includes('see all buying options') ||
            // Price-context signatures (explicit variants).
            pageText.includes('price: no featured offers available') ||
            pageText.includes('price no featured offers available')
        );
    }

    // Debug excerpt builder: captures the text window around the first
    // shipping/logistics keyword so on-page console logs show exactly what
    // the scanner was looking at (alpha-phase diagnostics).
    function buildDebugExcerpt(rawText) {
        try {
            var probe = /deliver|arriv|ship|buying option|featured offer|sold by/i.exec(rawText || '');
            if (!probe) return '(no logistics keywords found)';
            return (rawText.slice(Math.max(0, probe.index - 40), probe.index + 140) || '')
                .replace(/\s+/g, ' ');
        } catch (err) {
            return '(excerpt unavailable)';
        }
    }

    // DUAL-SOURCE TEXT EXTRACTION: prefer the deep shadow-aware walk; if it
    // comes back implausibly thin (observed in the field: 0 chars on a fully
    // rendered page), fall back to document.body.innerText and report which
    // source won so console diagnostics pinpoint the failure layer.
    function extractPageText() {
        let deep = '';
        try {
            deep = (document.body && getDeepPageText(document.body)) || '';
        } catch (err) {
            deep = '';
        }
        if (deep.replace(/\s+/g, '').length >= 500) {
            return { text: deep, source: 'deep' };
        }
        let flat = '';
        try {
            flat = (document.body && document.body.innerText) || '';
        } catch (err) {
            flat = '';
        }
        if (flat.replace(/\s+/g, '').length >= 500) {
            return { text: flat, source: 'inner' };
        }
        if (flat.length > deep.length) {
            return { text: flat, source: 'inner-thin' };
        }
        return { text: deep, source: 'deep-thin' };
    }

    // Seller name extraction for registry matching: FIRST "sold by" cluster
    // only (main offer — consistent with neutralizer v3 binding; later
    // clusters belong to other-seller carousels). Lazy capture halts at
    // sentence boundaries or the next logistics label; trailing punctuation
    // is stripped so registry matching stays punctuation-insensitive.
    function extractSellerName(rawText) {
        if (!rawText) return null;
        const m = /sold by\s+([A-Za-z0-9&'\.\- ]{2,60}?)(?=\s+(?:and\s+)?(?:fulfilled|ships|sold|delivery|free|usually|returns)\b|[.,;\n]|$)/i.exec(rawText);
        if (!m) return null;
        const name = m[1].trim().replace(/\s+/g, ' ').replace(/\.+$/, '');
        return name || null;
    }

    // AI-LISTING FINGERPRINT (Rule B-9): mass-generated listings (AI text,
    // AI imagery, dropship workflows) leak structural artifacts into the URL
    // slug and product title. Pixel-level AI-image detection is deliberately
    // NOT attempted (models are heavyweight, adversarially fragile, and
    // marketplaces strip image metadata) — these text-level signals are
    // cheaper and higher-precision for the burner-storefront pattern.
    //   R1: full-width CJK punctuation (，、！？ etc.) in an English listing —
    //       a copy-paste generator fingerprint.
    //   R2: adjacent duplicate tokens ("calendar calendar").
    //   R3: any token repeated 3+ times within one surface (keyword stacking).
    function hasGeneratedListingPattern() {
        const surfaces = [];
        try {
            const rawPath = String((window.location && window.location.pathname) || '');
            surfaces.push(rawPath);
            // Percent-encoded slugs hide CJK artifacts (%EF%BC%8C = ，).
            // Decode for R1/R2/R3 analysis; malformed sequences keep the raw
            // form (already covered above).
            try {
                const decodedPath = decodeURIComponent(rawPath);
                if (decodedPath !== rawPath) surfaces.push(decodedPath);
            } catch (uriErr) { /* invalid encoding — raw path suffices */ }
        } catch (err) { surfaces.push(''); }
        try {
            const pt = document.querySelector && document.querySelector('#productTitle');
            if (pt && pt.innerText) surfaces.push(String(pt.innerText));
        } catch (err) { /* second surface simply absent */ }

        const FULLWIDTH =
            /[\uFF0C\u3001\uFF01\uFF1F\uFF1A\uFF1B\uFF08\uFF09\u3010\u3011\u300A\u300B]/;

        for (let s = 0; s < surfaces.length; s++) {
            const surface = surfaces[s];
            if (!surface) continue;

            // R1: full-width CJK punctuation.
            if (FULLWIDTH.test(surface)) return true;

            // Tokenize: non-alphanumerics separate; keep 3-20 char tokens;
            // analyze the head region only.
            const tokens = surface.toLowerCase()
                .split(/[^a-z0-9]+/)
                .filter(function (t) { return t.length >= 3 && t.length <= 20; })
                .slice(0, 24);
            if (tokens.length < 4) continue;

            // R2: adjacent duplicate tokens.
            for (let i = 1; i < tokens.length; i++) {
                if (tokens[i] === tokens[i - 1]) return true;
            }

            // R3: 3+ occurrences of one token within a single surface.
            const counts = {};
            for (let i = 0; i < tokens.length; i++) {
                counts[tokens[i]] = (counts[tokens[i]] || 0) + 1;
                if (counts[tokens[i]] >= 3) return true;
            }
        }
        return false;
    }

    // SELLER PAGE INSPECTOR: Amazon seller-profile pages (/sp) are governance
    // pages, not listings — logistics rules don't apply there. The Inspector
    // parses Amazon's OWN track-record text instead: storefront age and
    // positive-rating share. Silence is the default: pages that fail to
    // expose their anchors render no banner rather than guessing.
    const MONTH_INDEX = {
        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
        apr: 3, april: 3, may: 4, jun: 5, june: 5,
        jul: 6, july: 6, aug: 7, august: 7,
        sep: 8, sept: 8, september: 8, oct: 9, october: 9,
        nov: 10, november: 10, dec: 11, december: 11
    };

    function isSellerProfilePage() {
        try {
            if (window.location && /^\/sp\/?$/i.test(window.location.pathname || '')) {
                return true;
            }
            return (document.title || '')
                .toLowerCase()
                .indexOf('seller profile') === 0;
        } catch (err) {
            return false;
        }
    }

    function evaluateSellerProfilePage(pageText) {
        if (!pageText) return [];
        const reasons = [];

        // SP-1: storefront age — anchor forms "Seller since: March 2023" and
        // "Selling since March 2023". Accounts younger than 6 months collect
        // a Blue-tier caution; anything older stays silent.
        const sinceMatch = /(?:seller|selling)\s+since:? ?([a-z]+ [0-9]{4})/.exec(pageText);
        if (sinceMatch) {
            const parts = sinceMatch[1].split(' ');
            const month = MONTH_INDEX[parts[0]] ;
            const year = parseInt(parts[1], 10);
            if (typeof month === 'number' && !isNaN(year)) {
                const now = new Date();
                const monthsSince =
                    (now.getFullYear() - year) * 12 + (now.getMonth() - month);
                if (monthsSince <= 6) {
                    reasons.push(FRESH_SELLER_REASON);
                }
            }
        }

        // SP-1b: no-anchors fallback — a seller with zero visible metrics and
        // no history line is the same caution shape as a fresh storefront.
        if (reasons.length === 0 &&
            (/no ratings/.test(pageText) || /0 ratings/.test(pageText))) {
            reasons.push(FRESH_SELLER_REASON);
        }

        // SP-2: rating share — "82% positive (+1132 ratings)" style.
        // At or below 85% positive collects the track-record flag.
        const pctMatch = /([0-9]{1,3})% positive/.exec(pageText);
        if (pctMatch) {
            const pct = parseInt(pctMatch[1], 10);
            if (pct >= 0 && pct <= 85) {
                reasons.push(SELLER_TRACK_RECORD_REASON);
            }
        }

        return reasons;
    }

    // extractASINFromPath removed (2026-10-18) — its only consumer was the
    // retired price-history link.

    function checkListingSafety() {
        // RUNTIME PIPELINE MERGING: dual-source extraction replaces the raw
        // deep-walk read; normalizePageText() lowercases and collapses
        // whitespace on whichever source won.
        const extracted = extractPageText();
        const rawText = extracted.text;
        const pageText = normalizePageText(rawText);

        // ROUTE A: Logistics Neutralizer Evaluation (Runs First, buy-box scoped)
        if (!pageText) {
            return {
                isRisky: false, reasons: [], tier: null, blockCheckout: false,
                debug: {
                    textChars: rawText.length, source: extracted.source,
                    bodyChildren: document.body ? document.body.childNodes.length : -1,
                    head: '', excerpt: '(empty text)'
                }
            };
        }

        // PAGE-TYPE BRANCH: Seller profiles are evaluated as seller-governance
        // surfaces — the logistics matrix and Route A neutralizers don't apply.
        // NOTE: safeEvaluate is a Boolean-coercion wrapper; the reasons array
        // is gathered with its own direct try/catch instead.
        if (safeEvaluate(function () { return isSellerProfilePage(); })) {
            let spReasons = [];
            try {
                const parsed = evaluateSellerProfilePage(pageText);
                if (Array.isArray(parsed)) {
                    spReasons = parsed;
                }
            } catch (spErr) {
                console.warn(
                    '[ScamScanned] seller profile evaluation error (intercepted):',
                    spErr && spErr.message ? spErr.message : spErr
                );
            }
            const badTrack =
                spReasons.indexOf(SELLER_TRACK_RECORD_REASON) >= 0;
            return {
                isRisky: spReasons.length > 0,
                reasons: spReasons,
                tier: badTrack ? 'red' : (spReasons.length ? 'blue' : null),
                blockCheckout: false,
                debug: {
                    textChars: rawText.length, source: extracted.source,
                    bodyChildren: document.body ? document.body.childNodes.length : -1,
                    head: (document.title || '').slice(0, 80),
                    excerpt: 'seller profile: ' +
                        (spReasons.length ? spReasons.join(',') : 'anchors unparsed')
                }
            };
        }

        if (safeEvaluate(function () { return hasSecureLogistics(pageText); })) {
            return {
                isRisky: false, reasons: [], tier: null, blockCheckout: false,
                debug: {
                    textChars: rawText.length, source: extracted.source,
                    bodyChildren: document.body ? document.body.childNodes.length : -1,
                    head: rawText.replace(/\s+/g, ' ').slice(0, 80),
                    excerpt: 'neutralized: secure logistics window'
                }
            };
        }

        const reasons = [];
        let ghostTriggered = false;

        // ROUTE B: Expanded Risk Criteria Matrix (ghost escalation FIRST —
        // the Blue tier fires instantly and survives any later rule crash).

        // B-8: Ghost Listing Fallback (Blue tier) — featured purchase elements
        // missing from the page text footprint.
        if (safeEvaluate(function () { return hasGhostListing(pageText); })) {
            ghostTriggered = true;
            reasons.push(GHOST_LISTING_REASON);
        }

        // B-9: AI-listing generation fingerprint (slug/title artifacts).
        if (safeEvaluate(function () { return hasGeneratedListingPattern(); })) {
            reasons.push(LISTING_GENERATION_REASON);
        }

        // B-1: Overseas shipping signatures
        if (safeEvaluate(function () {
            return pageText.includes('ships from overseas') ||
                   pageText.includes('ships via overseas');
        })) {
            reasons.push(SHIPPING_REASON);
        }

        // B-2: Day-threshold parser — range-aware ("arrives in 30 days",
        // "arrives in 15-30 days"); the UPPER bound is the risk signal.
        if (safeEvaluate(function () {
            const dayMatch = pageText.match(/arrives in\s+(\d+)\s*(?:-|–|—|to)?\s*(\d+)?\s*days/);
            if (!dayMatch) return false;
            const upperBound = dayMatch[2] ? parseInt(dayMatch[2], 10) : parseInt(dayMatch[1], 10);
            return upperBound >= MIN_RISK_DAYS;
        })) {
            reasons.push(SHIPPING_REASON);
        }

        // B-2b: Date-range shipping estimates ("FREE delivery Tue, Jan 6 -
        // Wed, Feb 11") — later bound beyond the day threshold.
        if (safeEvaluate(function () { return hasLongShippingDateRange(pageText); })) {
            reasons.push(SHIPPING_REASON);
        }

        // B-2c: Lead-time phrasing ("Usually ships within 2 to 3 weeks",
        // "ships within 4-6 weeks") — upper bound against the unit threshold.
        if (safeEvaluate(function () {
            const leadMatch = pageText.match(
                /(?:ships?|delivery|arrives?)\s+within\s+(\d+)(?:\s*(?:to|-|–)\s*(\d+))?\s+(days?|weeks?)/
            );
            if (!leadMatch) return false;
            const upper = Math.max(
                parseInt(leadMatch[1], 10),
                leadMatch[2] ? parseInt(leadMatch[2], 10) : 0
            );
            const unit = (leadMatch[3] || '').toLowerCase();
            if (unit.charAt(0) === 'w') return upper >= MIN_RISK_WEEKS;
            if (unit.charAt(0) === 'd') return upper >= MIN_RISK_DAYS;
            return false;
        })) {
            reasons.push(SHIPPING_REASON);
        }

        // B-3: Week-threshold parser — range-aware ("delivery in 4 weeks",
        // "delivery in 4-6 weeks"); the UPPER bound is the risk signal.
        if (safeEvaluate(function () {
            const weekMatch = pageText.match(/delivery in\s+(\d+)\s*(?:-|–|—|to)?\s*(\d+)?\s*weeks/);
            if (!weekMatch) return false;
            const upperBound = weekMatch[2] ? parseInt(weekMatch[2], 10) : parseInt(weekMatch[1], 10);
            return upperBound >= MIN_RISK_WEEKS;
        })) {
            reasons.push(SHIPPING_REASON);
        }

        // B-4: Generic week cues
        if (safeEvaluate(function () {
            return pageText.includes('in weeks') || pageText.includes('in several weeks');
        })) {
            reasons.push(SHIPPING_REASON);
        }

        // B-5: Native Defect History (Amazon-native return-frequency marker)
        if (safeEvaluate(function () {
            return pageText.includes('frequently returned item');
        })) {
            reasons.push(DEFECT_HISTORY_REASON);
        }

        // B-6: Merchant Identity Shield (entropy + ALL-CAPS, raw-cased name)
        if (safeEvaluate(function () { return hasGarbledMerchantName(rawText); })) {
            reasons.push(MERCHANT_IDENTITY_REASON);
        }

        // B-7: Price Urgency Trap
        if (safeEvaluate(function () { return hasDeceptiveMarkdown(pageText); })) {
            reasons.push(PRICING_ANOMALY_REASON);
        }

        // Deduplicate (multiple shipping hits collapse to one entry).
        const uniqueReasons = Array.from(new Set(reasons));
        const redTierCount = ghostTriggered ? uniqueReasons.length - 1 : uniqueReasons.length;
        return {
            isRisky: uniqueReasons.length > 0,
            reasons: uniqueReasons,
            // Blue tier only when the ghost listing is the sole trigger.
            tier: uniqueReasons.length > 0 ? (redTierCount > 0 ? 'red' : 'blue') : null,
            blockCheckout: ghostTriggered,
            // Alpha diagnostics: what the scanner saw and where it came from.
            debug: {
                textChars: rawText.length,
                source: extracted.source,
                bodyChildren: document.body ? document.body.childNodes.length : -1,
                head: rawText.replace(/\s+/g, ' ').slice(0, 80),
                excerpt: buildDebugExcerpt(rawText)
            }
        };
    }

    // 4a. Secure Telemetry Dispatch (background fetch network layer).
    // Fires only when an un-neutralized risk triggers.

    // PIVOT URL VALIDATION ARMOR: the server-returned safe_pivot_url is only
    // trusted when it parses as a genuine https amazon.com URL. A malformed
    // response (observed in the wild: domain glued to title tokens) keeps
    // the affiliate fallback href instead of dead-linking the action button.
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
        // Dynamic platform attribution: resolve the active window's domain.
        const platformSource = window.location.hostname.includes('walmart.com')
            ? 'walmart_us'
            : 'amazon_us';

        const telemetryPayload = {
            platform_source: platformSource,
            target_url: window.location.href,
            telemetry_data: {
                page_title: document.title || '',
                seller_name: safeEvaluate(function () {
                    return extractSellerName(
                        (document.body && getDeepPageText(document.body)) || ''
                    );
                }) || null
            }
        };

        chrome.runtime.sendMessage(
            { type: 'SCAMSCANNED_TELEMETRY', payload: telemetryPayload },
            function (response) {
                // Diagnosed failure paths log distinctly; success is silent.
                if (chrome.runtime.lastError) {
                    console.warn(
                        '[ScamScanned] telemetry: relay unavailable —'
                        + ' (' + (chrome.runtime.lastError.message || 'unknown') + ')'
                    );
                    return;
                }
                if (!response || !response.ok) {
                    console.warn(
                        '[ScamScanned] telemetry: server unreachable or non-JSON —'
                        + ' affiliate search fallback active'
                    );
                    return;
                }

                // ENFORCEMENT RECORD: server matched the seller against the
                // adjudicated registry — render the DO-NOT-BUY tier.
                if (response.verified_record &&
                    typeof response.verified_record === 'object' &&
                    response.verified_record.source_url) {
                    applyEnforcementRecord(response.verified_record);
                }

                // Dynamic Pivot: remap the action button to the server's
                // safe_pivot_url — only after validation armor accepts it.
                if (isValidPivotUrl(response.safe_pivot_url)) {
                    const button = document.getElementById('scamscanned-action-button');
                    if (button) {
                        button.href = response.safe_pivot_url;
                        // Trust-grade disclosure follows the live href.
                        const sub = document.getElementById('scamscanned-action-subtext');
                        if (sub) {
                            sub.textContent =
                                "Opens Amazon's Prime-eligible, 4-star-and-up results";
                        }
                    }
                } else if (response.safe_pivot_url) {
                    console.warn(
                        '[ScamScanned] telemetry: pivot rejected by validation armor —'
                        + ' fallback active'
                    );
                }
            }
        );
    }

    // 3. Enterprise Visual Interface Renderer

    // Freeze unvetted secondary checkout channels (non-destructive CSS block).
    function blockUnvettedCheckoutChannels() {
        if (document.getElementById('scamscanned-checkout-block')) return;
        const style = document.createElement('style');
        style.id = 'scamscanned-checkout-block';
        style.textContent =
            BLOCKED_CHECKOUT_SELECTORS.join(', ') +
            ' { pointer-events: none !important; cursor: not-allowed !important;' +
            ' opacity: 0.45 !important; filter: grayscale(1); }';
        (document.head || document.documentElement).appendChild(style);
    }

    function buildAlertIcon() {
        // Pure CSS geometric warning triangle (no emoji, no image assets).
        const wrap = document.createElement('div');
        wrap.style.cssText =
            'position: relative; width: 30px; height: 26px; flex-shrink: 0; margin-top: 2px;';

        const triangle = document.createElement('div');
        triangle.style.cssText = [
            'position: absolute; top: 0; left: 1px;',
            'width: 0; height: 0;',
            'border-left: 14px solid transparent;',
            'border-right: 14px solid transparent;',
            `border-bottom: 24px solid ${PALETTE.text};`
        ].join(' ');

        const mark = document.createElement('div');
        mark.textContent = '!';
        mark.style.cssText = [
            'position: absolute; top: 8px; left: 50%;',
            'transform: translateX(-50%);',
            `color: ${PALETTE.surface};`,
            'font-weight: 800; font-size: 12px; line-height: 1;'
        ].join(' ');

        wrap.appendChild(triangle);
        wrap.appendChild(mark);
        return wrap;
    }

    function injectSafetyBanner(evaluation) {
        if (!evaluation || !evaluation.isRisky) return;

        // Prevent double injection overlays if user shifts tabs
        if (document.getElementById('scamscanned-alert-shield')) return;

        const isBlueTier = evaluation.tier === 'blue';
        const isEnforcement = evaluation.tier === 'enforcement';

        const banner = document.createElement('div');
        banner.id = 'scamscanned-alert-shield';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('data-tier', evaluation.tier);
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%;
            background-color: ${PALETTE.surface}; color: ${PALETTE.text};
            font-family: ${FONT_STACK};
            border-top: 2px solid ${
                isEnforcement ? PALETTE.enforcement :
                (isBlueTier ? PALETTE.blueAccent : PALETTE.accent)
            };
            text-align: left; padding: 16px 28px; z-index: 1000000;
            box-shadow: 0 6px 18px rgba(0,0,0,0.45);
            display: flex; flex-wrap: wrap; align-items: center;
            justify-content: center; gap: 20px; box-sizing: border-box;
        `;

        const icon = buildAlertIcon();

        const content = document.createElement('div');
        content.style.cssText =
            'display: flex; flex-direction: column; align-items: flex-start; gap: 6px; max-width: 720px;';

        // Main hazard category title — 18px semibold, tier-aware.
        const headline = document.createElement('div');
        headline.id = 'scamscanned-alert-headline';
        headline.style.cssText = 'font-size: 18px; font-weight: 600; letter-spacing: 0.2px;';
        headline.innerText = isEnforcement ? ENFORCEMENT_TIER_TITLE :
            (isBlueTier ? BLUE_TIER_TITLE : RED_TIER_TITLE);

        // Clean bulleted list of every triggered sub-reason. Each bullet is
        // hover/focus-focusable and reveals an educational tooltip from the
        // reason library (why the pattern is risky, not an accusation).
        const reasonList = document.createElement('ul');
        reasonList.style.cssText =
            'margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 3px;';
        (evaluation.reasons || []).forEach(function (reasonKey, idx) {
            const info = REASON_LIBRARY[reasonKey] ||
                { label: reasonKey, detail: '' };

            const item = document.createElement('li');
            item.style.cssText =
                'position: relative; font-size: 13px; font-weight: 400;' +
                'color: rgba(255,255,255,0.92); line-height: 1.55;';

            const label = document.createElement('span');
            label.textContent = info.label;
            label.tabIndex = 0; // keyboard focusable for a11y
            label.setAttribute('role', 'button');
            if (info.detail) {
                const tipId = 'scamscanned-tip-' + idx;
                label.setAttribute('aria-describedby', tipId);
                label.style.cssText =
                    'border-bottom: 1px dotted rgba(255,255,255,0.5);' +
                    'cursor: help; outline: none;';

                const tip = document.createElement('span');
                tip.id = tipId;
                tip.setAttribute('role', 'tooltip');
                tip.textContent = info.detail;
                tip.style.cssText =
                    'visibility: hidden; opacity: 0; position: absolute;' +
                    'top: calc(100% + 8px); left: 0; width: 300px;' +
                    'background: #2C2C2E; border: 1px solid rgba(255,255,255,0.2);' +
                    'padding: 10px 12px; font-size: 12px; line-height: 1.5;' +
                    'color: rgba(255,255,255,0.94); border-radius: 6px;' +
                    'box-shadow: 0 6px 16px rgba(0,0,0,0.55);' +
                    'transition: opacity 0.12s ease; z-index: 1000001;';
                label.appendChild(tip);

                const showTip = function () {
                    tip.style.visibility = 'visible';
                    tip.style.opacity = '1';
                };
                const hideTip = function () {
                    tip.style.visibility = 'hidden';
                    tip.style.opacity = '0';
                };
                label.addEventListener('mouseenter', showTip);
                label.addEventListener('mouseleave', hideTip);
                label.addEventListener('focus', showTip);
                label.addEventListener('blur', hideTip);
            }
            item.appendChild(label);
            reasonList.appendChild(item);
        });

        // Methodology footnote: reinforces the heuristic (non-assertive)
        // nature of the assessment directly in the UI. Enforcement tier
        // cites the public record instead.
        const footNote = document.createElement('div');
        footNote.textContent = isEnforcement
            ? 'This notice reports publicly available enforcement records. ' +
              'It is not an independent determination by ScamScanned.'
            : 'Automated heuristic assessment based on public listing signals. ' +
              'Not a determination about any seller.';
        footNote.style.cssText =
            'font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 6px; line-height: 1.4;';

        // Enforcement citation: link to the official public record.
        let citation = null;
        if (isEnforcement && evaluation.enforcement && evaluation.enforcement.source_url) {
            citation = document.createElement('a');
            citation.href = evaluation.enforcement.source_url;
            citation.target = '_blank';
            citation.rel = 'noopener noreferrer';
            citation.textContent = 'View official record: ' +
                (evaluation.enforcement.source_label || 'enforcement source');
            citation.style.cssText =
                'display: inline-block; margin-top: 8px; color: ' + PALETTE.enforcement + ';' +
                'font-size: 12px; font-weight: 600; text-decoration: underline;' +
                'letter-spacing: 0.2px;';
        }

        content.appendChild(headline);
        content.appendChild(reasonList);
        content.appendChild(footNote);
        if (citation) {
            content.appendChild(citation);
        }

        // Action pivot button — sharp corporate edges, dark crimson text.
        // Base href is a DOWN-GRADED-GRACEFULLY affiliate SEARCH built from
        // this page's own title (affiliate tag stays embedded per the
        // immutable monetization constraint); telemetry swaps in the
        // HostGator safe_pivot_url when the server responds. A homepage
        // fallback was rejected in the field: a dasboard click must at
        // minimum perform the consumer action the label promises.
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
            'https://amazon.com/s?k=' +
            (fallbackQuery || 'safe%20alternatives') +
            `&tag=${AFFILIATE_TAG}`;
        pivotButton.target = '_blank';
        pivotButton.rel = 'noopener noreferrer';
        pivotButton.style.cssText = `
            display: inline-block; background-color: #FFFFFF;
            color: ${PALETTE.deepCrimson}; padding: 10px 22px;
            border-radius: 2px; text-decoration: none;
            font-family: ${FONT_STACK}; font-size: 15px; font-weight: 600;
            letter-spacing: 0.3px; white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        `;
        pivotButton.innerText = 'Search Safe Alternatives';

        // Trust-grade disclosure: a tiny subtext naming what the pivot ACTUALLY
        // routes to — Amazon's own platform filters, not a ScamScanned
        // certification. Telemetry updates the string when the server pivot
        // lands; otherwise it describes the title-search fallback.
        const pivotSubtext = document.createElement('div');
        pivotSubtext.id = 'scamscanned-action-subtext';
        pivotSubtext.textContent = 'Opens an Amazon title search';
        pivotSubtext.style.cssText = [
            'font-size: 10px; color: rgba(255,255,255,0.5);',
            'letter-spacing: 0.3px; text-align: center; max-width: 220px;'
        ].join(' ');

        // Price-history link: REMOVED (user decision, 2026-10-18). Field
        // evidence showed a coverage inversion — the link was reachable only
        // inside warning banners, but price trackers index by popularity while
        // our flags cluster on never-tracked fresh listings, so the tool
        // dead-ended precisely where it appeared. Verification now rides on
        // the seller-profile inspector and delivery-window signals instead.

        const pivotWrap = document.createElement('div');
        pivotWrap.style.cssText =
            'display: flex; flex-direction: column; align-items: center; gap: 6px;';
        pivotWrap.appendChild(pivotButton);
        pivotWrap.appendChild(pivotSubtext);

        banner.appendChild(icon);
        banner.appendChild(content);
        banner.appendChild(pivotWrap);

        // Push page elements down: shift matches real rendered banner height.
        document.body.prepend(banner);
        document.body.style.marginTop = (banner.offsetHeight + 12) + 'px';

        // Ghost Listing guardrail: freeze unvetted checkout channels.
        if (evaluation.blockCheckout) {
            blockUnvettedCheckoutChannels();
        }
    }

    // ENFORCEMENT RECORD RENDERER: invoked from the telemetry callback when
    // the server matches the page's seller against the adjudicated registry.
    // Renders the DO-NOT-BUY tier even on listings that passed all heuristic
    // checks — and upgrades an existing heuristic banner in place. The client
    // can NEVER self-declare this tier; it only renders server-registry data.
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
                // Upgrade the existing heuristic banner in place.
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
            console.warn(
                '[ScamScanned] enforcement record render skipped:',
                err && err.message ? err.message : err
            );
        }
    }

    // 4. Run Live Local Execution Pathway — live DOM observer edition.
    // A native MutationObserver re-evaluates the page whenever Amazon lazily
    // injects product descriptions or pricing strings after initial load.

    // Scan coalescing window: Amazon mutation storms (hundreds of callbacks
    // per second during lazy load) collapse into one full-text scan.
    // MAX-WAIT CAP: continuous mutation streams (animation heartbeats,
    // carousel auto-advances) previously reset the trailing debounce forever,
    // starving the rescan completely. A scan is now guaranteed at most
    // SCAN_MAX_WAIT_MS after the first queued mutation.
    const SCAN_DEBOUNCE_MS = 300;
    const SCAN_MAX_WAIT_MS = 2000;
    let scanTimer = null;
    let firstPendingAt = null;
    let scanCount = 0;

    // ERROR INTERCEPTION: the whole pass is wrapped so any unforeseen DOM
    // anomaly logs a single warning instead of an unhandled TypeError.
    function scanPage() {
        try {
            const listingEvaluation = checkListingSafety();
            logScanSummary(listingEvaluation);
            injectSafetyBanner(listingEvaluation);
            if (listingEvaluation.isRisky) {
                dispatchTelemetry();
            }
        } catch (err) {
            console.warn(
                '[ScamScanned] sensor pass skipped:',
                err && err.message ? err.message : err
            );
        }
    }

    // Alpha diagnostics: one console line per completed scan exposing what
    // the deep scanner extracted and concluded — makes field debugging a
    // paste-the-log exercise instead of guesswork.
    function logScanSummary(evaluation) {
        try {
            const d = evaluation && evaluation.debug ? evaluation.debug : {};
            console.log(
                '[ScamScanned] scan #' + (++scanCount) +
                ' risky=' + evaluation.isRisky +
                ' tier=' + evaluation.tier +
                ' reasons=' + (evaluation.reasons || []).length +
                ' src=' + (d.source || '?') +
                ' textChars=' + (d.textChars || 0) +
                ' bodyChildren=' + (typeof d.bodyChildren === 'number' ? d.bodyChildren : '?') +
                ' head="' + (d.head || '') + '"' +
                ' excerpt="' + (d.excerpt || '') + '"'
            );
        } catch (err) {
            /* logging must never break the sensor */
        }
    }

    // INJECTION ID DEBOUNCING: if our banner is already in the DOM, drop the
    // check instantly and bail cleanly. Our own banner injection mutates
    // document.body (childList), which re-triggers this observer — without
    // this guard the loop would run forever and jitter the layout.
    function scheduleScan() {
        if (document.getElementById('scamscanned-alert-shield')) {
            if (scanTimer) {
                clearTimeout(scanTimer);
                scanTimer = null;
            }
            firstPendingAt = null;
            return;
        }
        const now = Date.now();
        if (firstPendingAt === null) {
            firstPendingAt = now;
        }
        // Trailing debounce, capped: never wait longer than MAX_WAIT past the
        // first queued mutation, even under a continuous mutation storm.
        const wait = Math.max(
            0,
            Math.min(SCAN_DEBOUNCE_MS, firstPendingAt + SCAN_MAX_WAIT_MS - now)
        );
        if (scanTimer) clearTimeout(scanTimer);
        scanTimer = setTimeout(function () {
            scanTimer = null;
            firstPendingAt = null;
            // Re-check the guard inside the timeout: another scan may have
            // injected the banner while the timer was pending.
            if (document.getElementById('scamscanned-alert-shield')) return;
            scanPage();
        }, wait);
    }

    function startLiveObserver() {
        // Initial pass fires immediately; later passes ride the observer.
        scanPage();

        // Legacy environments without MutationObserver degrade to the
        // single-pass behavior instead of crashing.
        if (typeof MutationObserver !== 'function' || !document.body) return;

        const observer = new MutationObserver(function () {
            scheduleScan();
        });
        observer.observe(document.body, {
            childList: true,  // track element add/remove on the stream
            subtree: true     // ...including every nested lazy-load container
        });
    }

    function run() {
        // TOP-FRAME GATE: only the top-level page scans and banners. Iframe
        // instances (all_frames) stand down — empty utility frames produced
        // zero-text scans and banners were rendering inside tiny frames.
        if (window.top !== window.self) return;
        if (!isSupportedMarketplace()) return;
        if ((document.readyState === 'interactive' ||
             document.readyState === 'complete') && document.body) {
            startLiveObserver();
        } else {
            document.addEventListener('DOMContentLoaded', startLiveObserver);
        }
    }

    run();
})();
