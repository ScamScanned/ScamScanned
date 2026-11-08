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
    // Stacked-corroboration band (Field wave 2026-11-07): once another risk
    // rule has already collected, 50%+ markdowns also read as evidence —
    // the sleeper-FBA undercut zone is 40-60% off, below the lone threshold.
    const PRICE_MARKDOWN_STACK_THRESHOLD = 0.50;
    // PRODUCT REVIEW VOLUME (wave 2026-11-07j): printed buyer-rating counts
    // on the PDP. 250+ earns an observable counterweight note; 1000+
    // additionally suppresses the sole name-shape inference (weakest
    // inference defers to the strongest printed evidence — 12d doctrine).
    const PRODUCT_REVIEW_VOLUME_NOTE_THRESHOLD = 250;
    const PRODUCT_REVIEW_VOLUME_SUPPRESS_THRESHOLD = 1000;

    const PALETTE = {
        surface: '#1C1C1E',      // Charcoal Matte
        accent: '#DC143C',       // Crimson (red-tier top border)
        blueAccent: '#4A90D9',   // Steel blue (blue-tier top border)
        enforcement: '#F59E0B',  // Amber/gold (enforcement-tier top border)
        caution: '#FDE047',      // Bright yellow (low-risk caution top border)
        deepCrimson: '#8B0000',  // Button text
        extreme: '#EF4444',      // Bright red (extreme-tier border, badge, icon)
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
    const ZERO_REVIEW_REASON = 'LISTING_NO_REVIEWS';
    const FULFILLMENT_CONFLICT_REASON = 'FULFILLMENT_CLAIM_CONFLICT';

    const RED_TIER_TITLE = 'Elevated Risk — Multiple Caution Signals Detected';
    // Single-signal variant (field 2026-11-07): the multi headline may not
    // lie about its own count when exactly one reason fired.
    const RED_TIER_TITLE_SINGLE = 'Elevated Risk — Caution Signal on This Listing';
    // Graduated tiers (user direction, 2026-11-07): risk must land on a
    // scale, not a switch — silent (no reasons), YELLOW (single soft
    // signal, probably fine), RED (strong signal or stacking), EXTREME
    // (pattern alignment).
    const YELLOW_TIER_TITLE = 'Low Risk — Single Caution Signal on This Listing';
    const EXTREME_TIER_TITLE = 'Extreme Risk — Multiple Signals Align on This Offer';
    const BLUE_TIER_TITLE = 'Unclear Risk — Verify the Seller Before Purchasing';
    const ENFORCEMENT_TIER_TITLE = 'DO NOT BUY — Official Enforcement Record on Seller';

    const REASON_LIBRARY = {
        EXTENDED_SHIPPING: {
            label: 'Extended third-party shipping window',
            detail: 'Delivery estimates far beyond typical marketplace timelines can outlast the buyer-protection period. If the item never arrives, the refund window may already be closed — the delay itself can be the trap.'
        },
        FULFILLMENT_CLAIM_CONFLICT: {
            label: 'Contradictory fulfillment and delivery claims',
            detail: 'The main offer prints Amazon fulfillment ("Ships from Amazon" / "Fulfilled by Amazon") while its own main delivery estimate is two or more weeks out. Amazon-handled orders normally arrive in days, so the two printed statements cannot both be true. This check reads only the offer\'s logistics block — never recommendation carousels. If the main delivery line shows normal timing, this signal should not appear; report it with the console evidence.'
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
            detail: 'This seller has little verifiable public history so far — the account began recently or has been sparsely active. Young or low-activity storefronts correlate with bulk-created burner accounts that operate briefly and vanish once disputes arrive; longer track records are easier to hold accountable.'
        },
        SELLER_TRACK_RECORD: {
            label: 'Seller ratings trail marketplace norms',
            detail: 'This seller\'s own feedback history shows a positive-rating share below accepted marketplace levels. Reputation deficits tend to persist, so review individual feedback entries — especially negative ones — before purchasing.'
        },
        LISTING_NO_REVIEWS: {
            label: 'This exact listing has no customer reviews yet',
            detail: 'Zero reviews can simply mean a brand-new product — but there is no third-party history on this page either. Consider comparing equivalent listings that already carry verified feedback before buying.'
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
    // tokens, resolves the LATEST date, applies year-boundary correction, and
    // returns the matched evidence when the later bound breaches the day
    // threshold. The caller scopes this to the MAIN OFFER's logistics block;
    // recommendation-rail dates must never enter this parser.
    function findLongShippingDateRange(pageText) {
        if (!pageText) return null;
        // Word boundaries matter: "Shipper / Seller" must not count as a
        // shipping keyword. Field false positive: the return-policy line
        // "FREE refund/replacement until Jan 31, 2027" sat within 90 chars
        // of "Shipper", producing a fake 84-day delivery horizon.
        const keywordRe = /\b(?:arrives?|arrival|deliver(?:y|ies|ed)?|ships?)\b/g;
        const returnContextRe = /(?:return|refund|replacement|warranty|guarantee|policy)/i;
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        let km;
        while ((km = keywordRe.exec(pageText)) !== null) {
            const windowText = pageText.slice(km.index + km[0].length, km.index + km[0].length + 90);
            const dateRe = /([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/g;
            let dm;
            while ((dm = dateRe.exec(windowText)) !== null) {
                // A date inside a returns/refund/warranty sentence is not a
                // delivery estimate, even when a logistics word precedes it.
                if (returnContextRe.test(windowText.slice(0, dm.index))) continue;

                const month = parseMonthToken(dm[1]);
                const day = parseInt(dm[2], 10);
                if (!month || day < 1 || day > 31) continue;

                let estimate = new Date(now.getFullYear(), month - 1, day);
                let daysOut = Math.round((estimate.getTime() - now.getTime()) / 86400000);

                // A delivery estimate more than six months out is not a
                // delivery estimate — it is a previous-year date being read
                // in the current year (e.g., "December 30" seen on January 3
                // is last month's stale copy, not next December).
                if (daysOut > 180) {
                    estimate.setFullYear(estimate.getFullYear() - 1);
                    daysOut = Math.round((estimate.getTime() - now.getTime()) / 86400000);
                }

                // YEAR-BOUNDARY CORRECTION ONLY: a December window can print
                // a January date that belongs to next year. A stale date in
                // the same or an earlier month is NOT next year's estimate —
                // treating it as one manufactured a 300+ day horizon from old
                // page copy (field false-positive class).
                if (daysOut < -2) {
                    const isYearWrap =
                        (currentMonth === 11 || currentMonth === 12) && month <= 2;
                    if (!isYearWrap) continue;
                    estimate.setFullYear(estimate.getFullYear() + 1);
                    daysOut = Math.round((estimate.getTime() - now.getTime()) / 86400000);
                }

                if (daysOut >= MIN_RISK_DAYS) {
                    return dm[0] + ' (~' + daysOut + ' days out)';
                }
            }
        }
        return null;
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

        // Recognize every layout Amazon uses for its own fulfillment:
        // "Ships from Amazon", "Fulfilled by Amazon", the common tabular
        // "Ships from and sold by Amazon.com", and the offer-display row
        // "Shipper / Seller Amazon.com". The older exact-string check missed
        // the tabular form, so Amazon-sold pages were treated as third-party
        // (field false positive, LEGO 60442).
        const isAmazonFulfillmentText = function (text) {
            return text.includes('ships from amazon') ||
                   text.includes('fulfilled by amazon') ||
                   text.includes('ships from and sold by amazon') ||
                   text.includes('ships from & sold by amazon') ||
                   text.includes('shipper / seller amazon') ||
                   /\bsold by amazon(?:\.com)?\b/.test(text);
        };

        // Primary: the page's real buy-box containers. Carousel and
        // cross-sell text never lives here.
        try {
            const containers = document.querySelectorAll(
                '#buybox, #tabular-buybox, #merchant-info, #seller-profile-container, #desktop_buybox, #fulfillerInfoFeature_feature_div'
            );
            for (let i = 0; i < containers.length; i++) {
                const boxText = normalizePageText(containers[i].innerText || '');
                if (boxText.includes('overseas')) return false; // main box: third-party
                if (isAmazonFulfillmentText(boxText)) {
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
        return isAmazonFulfillmentText(windowText);
    }

    // MAIN-OFFER LOGISTICS SCOPE (2026-11-07 field precision fix): delivery
    // and fulfillment checks must read the offer's own logistics block — not
    // recommendation rails, hidden templates, or unrelated product cards.
    // A "FREE delivery Dec 2" line in a related-products carousel is not this
    // offer's delivery estimate, and treating it as one manufactures a fake
    // fulfillment contradiction. DOM containers win; the first logistics
    // cluster is the ordered fallback (same binding as the neutralizer).
    function getMainOfferLogisticsText(pageText) {
        const selectors = [
            '#buybox',
            '#desktop_buybox',
            '#deliveryBlockMessage',
            '#mir-layout-DELIVERY_BLOCK',
            '#fulfillerInfoFeature_feature_div',
            '#merchant-info',
            '#availability'
        ];
        const chunks = [];
        try {
            selectors.forEach(function (sel) {
                const nodes = document.querySelectorAll(sel);
                for (let i = 0; i < nodes.length; i++) {
                    let chunk = '';
                    try { chunk = nodes[i].innerText || ''; } catch (e1) { chunk = ''; }
                    if (!chunk) {
                        try { chunk = nodes[i].textContent || ''; } catch (e2) { chunk = ''; }
                    }
                    chunk = normalizePageText(chunk);
                    if (chunk) chunks.push(chunk);
                }
            });
        } catch (err) {
            /* DOM probe failed — text fallback below */
        }
        const scope = chunks.join(' ').replace(/\s+/g, ' ').trim();
        if (scope.length >= 20) return scope;

        // Ordered fallback: the main offer's seller/logistics rows always
        // precede recommendation carousels in page order.
        const anchor = /(sold by|ships from|delivered by|delivery|arrives?)/.exec(pageText || '');
        if (!anchor) return pageText || '';
        return pageText.slice(Math.max(0, anchor.index - 100), anchor.index + 600);
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

    // Price Urgency Trap (Rule B-7): markdown versus the reference price.
    // STANDALONE band stays above 70% off and keeps its third-party
    // fulfillment scope (the original "combined with third-party fulfillment"
    // intent). The STACKED band (stacked = true, called with corroboration
    // already collected) fires above 50% off and deliberately overrides the
    // FBA veto — the 2026-11-07 sleeper-FBA class prints a healthy logistics
    // window while undercutting the market on an unwarranted listing.
    function hasDeceptiveMarkdown(pageText, stacked) {
        if (!pageText) return false; // bail cleanly on null/undefined text
        if (!stacked && hasSecureLogistics(pageText)) return false;

        const listMatch = pageText.match(
            /(?:list price|typical price|was)\s*[:\-]?\s*\$?\s?(\d[\d,]*(?:\.\d{1,2})?)/i
        );
        const currentMatch = pageText.match(/\$\s?(\d[\d,]*(?:\.\d{1,2})?)/);
        if (!listMatch || !currentMatch) return false;

        const listPrice = parseFloat(listMatch[1].replace(/,/g, ''));
        const currentPrice = parseFloat(currentMatch[1].replace(/,/g, ''));
        if (!(listPrice > 0) || !(currentPrice > 0)) return false;

        const threshold = stacked ?
            PRICE_MARKDOWN_STACK_THRESHOLD : PRICE_MARKDOWN_THRESHOLD;
        return (1 - currentPrice / listPrice) > threshold;
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

    // ASIN PROBE (wave 2026-11-07b): narrow-purpose, single consumer — the
    // banner's "compare other sellers" shortcut. The registry/camel-era
    // extractASINFromPath was retired with the price-history link (2026-10-18)
    // and stays retired; this replacement keeps the same conservative URL
    // shapes (dp / gp/product) and does NOT learn the mobile path variants.
    function extractAsinFromPath() {
        try {
            const rawPath = String((window.location && window.location.pathname) || '');
            let path = rawPath;
            try { path = decodeURIComponent(rawPath); } catch (decErr) { /* keep raw */ }
            const m = /\/(dp|gp\/product|product)\/([A-Z0-9]{10})(?:\/|$|\?)/i.exec(path);
            return m ? m[2].toUpperCase() : null;
        } catch (err) {
            return null;
        }
    }

    // SIGNAL METER + COUNTERWEIGHTS (user direction, 2026-11-07): the
    // banner should convey DEGREE and BALANCE without inventing a
    // probability it cannot back. The meter is a literal 6-zone count —
    // zones are real detectable signal families; a zone lights when any
    // member rule fired. The counterweight list is observables-only:
    // page-printed fulfiller claims and the ABSENCE of printed
    // defect/generation/ghost findings on a structural PDP scan. It never
    // asserts trust/verified/safe (honesty doctrine: suppression is the
    // engine declining to warn, not a stamp of approval).
    const SIGNAL_FAMILY_KEYS = ['record', 'name', 'price', 'fulfillment', 'text', 'defect'];
    const SIGNAL_FAMILY_LABELS = {
        record: 'Seller record',
        name: 'Seller name',
        price: 'Price signals',
        fulfillment: 'Fulfillment & checkout',
        text: 'Listing text',
        defect: 'Platform return data'
    };
    const SIGNAL_FAMILY_OF_REASON = {
        SELLER_TRACK_RECORD: 'record',
        FRESH_SELLER_ACCOUNT: 'record',
        LISTING_NO_REVIEWS: 'record',
        MERCHANT_IDENTITY: 'name',
        PRICING_ANOMALY: 'price',
        EXTENDED_SHIPPING: 'fulfillment',
        HIDDEN_CHECKOUT: 'fulfillment',
        FULFILLMENT_CLAIM_CONFLICT: 'fulfillment',
        LISTING_GENERATION: 'text',
        DEFECT_HISTORY: 'defect'
    };
    function signalFamiliesFlagged(reasons) {
        const lit = {};
        (reasons || []).forEach(function (reasonKey) {
            const fam = SIGNAL_FAMILY_OF_REASON[reasonKey];
            if (fam) { lit[fam] = true; }
        });
        return SIGNAL_FAMILY_KEYS.filter(function (fam) { return !!lit[fam]; });
    }
    function buildCounterweightNotes(evaluation) {
        // Seller-profile and enforcement evaluators never ran the PDP
        // structural scan, so offer-shape "good" notes are unavailable —
        // returning nothing is the honest state.
        if (!evaluation || !evaluation.structuralScanRan) { return []; }
        const reasons = evaluation.reasons || [];
        const has = function (key) { return reasons.indexOf(key) >= 0; };
        const notes = [];
        if (evaluation.claimedFba && !has('FULFILLMENT_CLAIM_CONFLICT')) {
            // Conflict surfaces the fulfillment problem itself; repeating
            // the claim as a counterweight there would soften it.
            notes.push('Fulfillment is stated to be handled by Amazon on this listing.');
        }
        if (!has('HIDDEN_CHECKOUT')) {
            notes.push('Standard checkout flow is present on this listing.');
        }
        if (!has('DEFECT_HISTORY')) {
            notes.push('The platform prints no frequently-returned flag on this listing.');
        }
        if (!has('LISTING_GENERATION')) {
            notes.push('Listing text and URL show no mass-generation artifacts.');
        }
        // Printed product-review volume (wave 2026-11-07j): an observable
        // about the page — no adjective, no certification, just the count
        // the widget itself prints. Absent (null/undefined) renders nothing.
        if (typeof evaluation.productReviewVolume === 'number' &&
            evaluation.productReviewVolume >= PRODUCT_REVIEW_VOLUME_NOTE_THRESHOLD) {
            notes.push('The product page shows ' + evaluation.productReviewVolume +
                ' buyer ratings.');
        }
        return notes;
    }

    // SLEEPER-SELLER GUARD (Field wave 2026-11-07): the buy box prints the
    // seller's OWN feedback stats — "(1,225 ratings) 87% positive over the
    // last 12 months". The product review widget also says "ratings", but
    // never adjacent to "% positive"; requiring the co-phrase inside a short
    // gap binds the match to the seller cluster. Profile-page format
    // ("82% positive (+1132 ratings)") is pct-then-count, so it cannot match
    // this count-then-pct path — seller profiles keep SP-1/SP-2 handling in
    // the page-type branch. Silence is the default on any parse failure.
    function getSellerFeedbackCluster(pageText) {
        if (!pageText) return null;
        const clusterMatch = pageText.match(
            /([0-9][0-9,]{0,8})\s*(?:total\s+|feedback\s+)?ratings?\b.{0,24}?([0-9]{1,3})\s*%\s*positive/
        );
        if (!clusterMatch) return null;
        const count = parseInt(clusterMatch[1].replace(/,/g, ''), 10);
        const pct = parseInt(clusterMatch[2], 10);
        if (isNaN(count) || isNaN(pct)) return null;
        if (pct < 0 || pct > 100) return null;
        return { count: count, pct: pct };
    }

    // ZERO-TRACK LISTING (stack-only corroborator): listing-level review
    // absence — "0 global ratings", "no reviews yet", "be the first to
    // review". Never fires alone; the matrix gates it behind a collected
    // reason so genuinely-new products stay unbannered.
    function hasZeroTrackListing(pageText) {
        if (!pageText) return false;
        return pageText.indexOf('0 global ratings') >= 0 ||
               /\bno reviews? yet\b/.test(pageText) ||
               /\bbe the first to review\b/.test(pageText);
    }

    // PRODUCT REVIEW VOLUME (wave 2026-11-07j): the PDP product widget's
    // own review counter ("N global ratings"), keyed on the same phrase
    // hasZeroTrackListing uses — deliberately DISTINCT from the seller
    // cluster, which requires the "% positive" adjacency so the two
    // counters can never be confused.
    function getProductReviewVolume(pageText) {
        if (!pageText) return null;
        const m = pageText.match(/([0-9][0-9,]{0,8})\s+global\s+ratings/);
        if (!m) return null;
        const count = parseInt(m[1].replace(/,/g, ''), 10);
        if (isNaN(count) || count < 0) return null;
        return count;
    }

    // SELLER PROFILE URL PROBE: hrefs only — "Sold by X" anchors carry the
    // seller profile path (/sp?seller=A...). No text scraping; silence when
    // the anchor is absent. Feeds the banner's navigational track-record
    // shortcut, where SP-1/SP-2 evaluate the seller directly.
    function getSellerProfileUrl() {
        try {
            const anchors = document.querySelectorAll('a[href*="/sp?seller="]');
            for (let i = 0; i < anchors.length; i++) {
                const abs = anchors[i].href;
                if (abs && abs.indexOf('amazon.com') >= 0) return abs;
            }
        } catch (err) {
            /* probe unavailable — the link simply does not render */
        }
        return null;
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

        // SNAPSHOT (wave 2026-11-07b): single-source seller/ASIN facts the
        // banner prints inline — the platform's OWN printed stats, zero new
        // claims of our own. Silence on any parse failure; the banner
        // null-guards every field via evaluation.snapshot.
        const snapshot = { sellerName: null, feedbackCount: null, feedbackPct: null, asin: null };
        try {
            snapshot.sellerName = extractSellerName(rawText);
        } catch (snapErrName) {
            snapshot.sellerName = null;
        }
        try {
            const asinProbe = extractAsinFromPath();
            if (asinProbe) snapshot.asin = asinProbe;
        } catch (snapErrAsin) {
            /* probe unavailable — offers link simply does not render */
        }

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

        // ROUTE A no longer ends the scan with a total pass. FIELD INCIDENT
        // WAVE 2026-11-07 (sleeper-FBA class): a fresh seller whose MAIN buy
        // box prints "Ships from Amazon" was whitewashed wholesale — the
        // seller-history dimensions never evaluated. The claim now waives
        // ONLY the logistics dimensions (B-1..B-4 shipping, B-8 ghost);
        // pricing, defect-history, merchant-identity, generation patterns
        // and the seller cluster still run. The old clean pass is preserved
        // verbatim whenever nothing else fires — see the tier object below.
        const routeAWaivesLogistics = safeEvaluate(function () {
            return hasSecureLogistics(pageText);
        });

        const reasons = [];
        let ghostTriggered = false;

        // ROUTE B: Expanded Risk Criteria Matrix (ghost escalation FIRST —
        // the Blue tier fires instantly and survives any later rule crash).

        // B-8: Ghost Listing Fallback (Blue tier) — featured purchase elements
        // missing from the page text footprint. Waived under Route A: a
        // confirmed main-box logistics claim and a collapsed buy box
        // contradict each other; Route A's DOM-scoped finding wins.
        if (!routeAWaivesLogistics &&
            safeEvaluate(function () { return hasGhostListing(pageText); })) {
            ghostTriggered = true;
            reasons.push(GHOST_LISTING_REASON);
        }

        // B-9: AI-listing generation fingerprint (slug/title artifacts).
        if (safeEvaluate(function () { return hasGeneratedListingPattern(); })) {
            reasons.push(LISTING_GENERATION_REASON);
        }

        // B-1..B-4 + B-2b/2c: long-horizon logistics triggers, evaluated
        // against the MAIN OFFER's logistics block only (2026-11-07 precision
        // fix: recommendation-rail dates no longer feed this matrix). The
        // fulfillment claim does NOT cleanse these — real Amazon handling does
        // not take weeks — so a horizon trigger under a claimed-fulfillment
        // page is a printed CONTRADICTION (A-escalator): stronger evidence
        // than the horizon alone, never erased.
        const logisticsText = getMainOfferLogisticsText(pageText);
        const shippingChecks = [
            {
                id: 'overseas',
                run: function () {
                    if (logisticsText.includes('ships from overseas')) return 'ships from overseas';
                    if (logisticsText.includes('ships via overseas')) return 'ships via overseas';
                    return null;
                }
            },
            {
                id: 'arrives-in-days',
                run: function () {
                    const dayMatch = logisticsText.match(/arrives in\s+(\d+)\s*(?:-|–|—|to)?\s*(\d+)?\s*days/);
                    if (!dayMatch) return null;
                    const upperBound = dayMatch[2] ? parseInt(dayMatch[2], 10) : parseInt(dayMatch[1], 10);
                    return upperBound >= MIN_RISK_DAYS
                        ? dayMatch[0] + ' (upper bound ' + upperBound + ' days)'
                        : null;
                }
            },
            {
                id: 'date-range',
                run: function () {
                    return findLongShippingDateRange(logisticsText);
                }
            },
            {
                id: 'within-days-weeks',
                run: function () {
                    const leadMatch = logisticsText.match(
                        /(?:ships?|delivery|arrives?)\s+within\s+(\d+)(?:\s*(?:to|-|–)\s*(\d+))?\s+(days?|weeks?)/
                    );
                    if (!leadMatch) return null;
                    const upper = Math.max(
                        parseInt(leadMatch[1], 10),
                        leadMatch[2] ? parseInt(leadMatch[2], 10) : 0
                    );
                    const unit = (leadMatch[3] || '').toLowerCase();
                    const risky = unit.charAt(0) === 'w'
                        ? upper >= MIN_RISK_WEEKS
                        : (unit.charAt(0) === 'd' ? upper >= MIN_RISK_DAYS : false);
                    return risky
                        ? leadMatch[0] + ' (upper bound ' + upper + ' ' + unit + ')'
                        : null;
                }
            },
            {
                id: 'delivery-in-weeks',
                run: function () {
                    const weekMatch = logisticsText.match(/delivery in\s+(\d+)\s*(?:-|–|—|to)?\s*(\d+)?\s*weeks/);
                    if (!weekMatch) return null;
                    const upperBound = weekMatch[2] ? parseInt(weekMatch[2], 10) : parseInt(weekMatch[1], 10);
                    return upperBound >= MIN_RISK_WEEKS
                        ? weekMatch[0] + ' (upper bound ' + upperBound + ' weeks)'
                        : null;
                }
            },
            {
                id: 'in-weeks',
                run: function () {
                    if (logisticsText.includes('in several weeks')) return 'in several weeks';
                    if (logisticsText.includes('in weeks')) return 'in weeks';
                    return null;
                }
            }
        ];
        let anyLongHorizonTriggered = false;
        let shippingTrigger = null;
        let shippingEvidence = null;
        for (let sci = 0; sci < shippingChecks.length; sci++) {
            try {
                const evidence = shippingChecks[sci].run();
                if (evidence) {
                    anyLongHorizonTriggered = true;
                    shippingTrigger = shippingChecks[sci].id;
                    shippingEvidence = evidence;
                    break;
                }
            } catch (chkErr) {
                /* one check failing must never abort the rest */
            }
        }
        if (anyLongHorizonTriggered) {
            if (routeAWaivesLogistics) {
                reasons.push(FULFILLMENT_CONFLICT_REASON);
            } else {
                reasons.push(SHIPPING_REASON);
            }
        }

        // B-5: Native Defect History (Amazon-native return-frequency marker)
        if (safeEvaluate(function () {
            return pageText.includes('frequently returned item');
        })) {
            reasons.push(DEFECT_HISTORY_REASON);
        }

        // SELLER CLUSTER (parsed before B-6 so the merchant-name rule can
        // cross-check against the seller's own record).
        let sellerCluster = null;
        try {
            sellerCluster = getSellerFeedbackCluster(pageText);
        } catch (clusterErr) {
            console.warn(
                '[ScamScanned] seller cluster parse error (intercepted):',
                clusterErr && clusterErr.message ? clusterErr.message : clusterErr
            );
        }
        if (sellerCluster) {
            snapshot.feedbackCount = sellerCluster.count;
            snapshot.feedbackPct = sellerCluster.pct;
        }

        // SLEEPER-SELLER BANDS, SP-parity with the profile page (SP-2 <= 85%):
        //   pct <= 85            -> SELLER_TRACK_RECORD
        //   count <= 5           -> FRESH_SELLER_ACCOUNT (tiny samples make
        //                           the percentage meaningless either way)
        //   count <= 25 and <=85 -> both.
        // (Parse failure stays SILENT — the banner shows nothing it cannot
        // prove, and the snapshot fields simply don't fill.)
        if (sellerCluster) {
            if (sellerCluster.pct <= 85) {
                reasons.push(SELLER_TRACK_RECORD_REASON);
            }
            if (sellerCluster.count <= 5 ||
                (sellerCluster.count <= 25 && sellerCluster.pct <= 85)) {
                reasons.push(FRESH_SELLER_REASON);
            }
        }

        // B-6: Merchant Identity Shield (entropy + ALL-CAPS, raw-cased name).
        // PRECISION CROSS-CHECK (field 2026-11-07, advent-calendar specimen):
        // a name-SHAPE inference is the weakest standalone evidence and real
        // non-English storefront brands legitimately trip it. When the seller
        // cluster shows a large healthy record (100+ ratings, 90%+ positive),
        // the page's own seller data CONTRADICTS the burner-shape inference —
        // the signal is suppressed entirely; silence is the honest verdict.
        // No/weak record: the shape still fires.
        // PRODUCT-REVIEW VOLUME SUPPRESSION (wave 2026-11-07j): a product
        // with 1,000+ printed buyer ratings carries genuine third-party
        // transaction history — the weakest inference about the SELLER must
        // not outrun the strongest printed evidence about the OFFER.
        // Counterparty risk stays gated by the fresh/track rules regardless
        // (a burner riding an old high-volume ASIN still trips FRESH_SELLER).
        const merchantShapeHit = safeEvaluate(function () {
            return hasGarbledMerchantName(rawText);
        });
        const healthySellerRecord = !!(sellerCluster &&
            sellerCluster.count >= 100 && sellerCluster.pct >= 90);
        const productReviewVolume = getProductReviewVolume(pageText);
        if (merchantShapeHit) {
            if (productReviewVolume !== null &&
                productReviewVolume >= PRODUCT_REVIEW_VOLUME_SUPPRESS_THRESHOLD) {
                console.log(
                    '[ScamScanned] merchant name shape suppressed:' +
                    ' product buyer-review volume (' + productReviewVolume +
                    ') contradicts burner-shape inference');
            } else if (healthySellerRecord) {
                console.log(
                    '[ScamScanned] merchant name shape suppressed:' +
                    ' healthy seller record contradicts burner-shape inference');
            } else {
                reasons.push(MERCHANT_IDENTITY_REASON);
            }
        }

        // B-7: Price Urgency Trap (standalone band: 70%+ markdown)
        if (safeEvaluate(function () { return hasDeceptiveMarkdown(pageText, false); })) {
            reasons.push(PRICING_ANOMALY_REASON);
        }

        // Amazon's OWN seller-age annotation: "New to Amazon" badges and
        // "New seller" labels are printed by the platform for accounts inside
        // the first ~120-day window. Platform-printed evidence, same caution.
        if (safeEvaluate(function () {
            return pageText.indexOf('new to amazon') >= 0 ||
                   pageText.indexOf('new seller') >= 0;
        })) {
            reasons.push(FRESH_SELLER_REASON);
        }

        // STACK-ONLY CORROBORATORS: fire only when another rule has already
        // collected — zero-track listing (no third-party history on this
        // product) and the 50-70% markdown band once seller-history risk
        // exists. This keeps genuinely-new products and honest deep
        // discounts unbannered.
        if (reasons.length > 0 && safeEvaluate(function () {
            return hasZeroTrackListing(pageText);
        })) {
            reasons.push(ZERO_REVIEW_REASON);
        }
        if (reasons.length > 0 &&
            safeEvaluate(function () { return hasDeceptiveMarkdown(pageText, true); })) {
            reasons.push(PRICING_ANOMALY_REASON); // dedupe collapses double-push
        }

        // Deduplicate (multiple shipping hits collapse to one entry).
        // GRADUATED TIER DECISION (2026-11-07): tiers weigh EVIDENCE
        // STRENGTH, not raw count. STRONG class = the rules whose signal
        // stands on its own (logistics horizons, Amazon-native defect
        // history, deep standalone markdown, big-record rating-share
        // breach) PLUS the fresh-seller identity alarm when no fulfillment
        // claim mitigates it, PLUS the fulfillment-claim print conflict
        // (wave 2026-11-07i). All remaining single-shape inferences
        // (merchant name, generation artifacts, corroborator stacks) are
        // soft.
        //   no reasons                 -> silent (no banner)
        //   ghost sole                 -> blue (structural ambiguity)
        //   strong >= 2, or 1 strong
        //     + 2 corroborators        -> extreme (pattern alignment)
        //   exactly one reason         -> red if strong, YELLOW if soft
        //   everything else (2+)       -> red (elevated)
        const uniqueReasons = Array.from(new Set(reasons));
        const isStrongReason = function (reasonKey) {
            if (reasonKey === SHIPPING_REASON || reasonKey === DEFECT_HISTORY_REASON) {
                return true;
            }
            if (reasonKey === FULFILLMENT_CONFLICT_REASON) {
                // The claim-vs-horizon contradiction is proof-shaped: the
                // page itself prints two statements that cannot both hold.
                return true;
            }
            if (reasonKey === FRESH_SELLER_REASON) {
                // USER CALIBRATION (2026-11-07): a brand new seller is the
                // biggest standalone identity alarm. Without Amazon-side
                // fulfillment, an unknown counterparty carries full weight
                // alone (red). With claimed fulfillment, the platform
                // handling keeps recovery robust, so it stays soft (yellow)
                // and the counterweight column carries the context.
                return !routeAWaivesLogistics;
            }
            if (reasonKey === SELLER_TRACK_RECORD_REASON) {
                // pct <= 85 with a LARGE record is the platform's own
                // verdict forming; small samples stay soft.
                return !!(sellerCluster && sellerCluster.count >= 100);
            }
            if (reasonKey === PRICING_ANOMALY_REASON) {
                // Standalone deep band (70%+) is strong; the stacked mid
                // band was a corroborator by design.
                return safeEvaluate(function () {
                    return hasDeceptiveMarkdown(pageText, false);
                });
            }
            return false;
        };
        const strongCount = uniqueReasons.filter(isStrongReason).length;
        let tier = null;
        if (uniqueReasons.length > 0) {
            if (ghostTriggered && uniqueReasons.length === 1) {
                tier = 'blue';
            } else if (strongCount >= 2 ||
                       (strongCount >= 1 && uniqueReasons.length >= 3)) {
                tier = 'extreme';
            } else if (uniqueReasons.length === 1) {
                tier = strongCount >= 1 ? 'red' : 'yellow';
            } else {
                tier = 'red';
            }
        }
        return {
            isRisky: uniqueReasons.length > 0,
            reasons: uniqueReasons,
            tier: tier,
            blockCheckout: ghostTriggered,
            snapshot: snapshot,
            // Meter/counterweight inputs: the FBA-claim context (reused
            // from the Route-A waiver computation) and the fact that this
            // evaluation ran the full PDP structural scan. SP/enforcement
            // evaluators omit these, which gates offer-shape notes off.
            claimedFba: routeAWaivesLogistics,
            structuralScanRan: true,
            productReviewVolume: productReviewVolume,
            // Alpha diagnostics: what the scanner saw and where it came from.
            debug: {
                textChars: rawText.length,
                source: extracted.source,
                bodyChildren: document.body ? document.body.childNodes.length : -1,
                head: rawText.replace(/\s+/g, ' ').slice(0, 80),
                excerpt: buildDebugExcerpt(rawText),
                logisticsChars: logisticsText.length,
                logisticsExcerpt: logisticsText.slice(0, 220),
                shippingTrigger: shippingTrigger,
                shippingEvidence: shippingEvidence,
                seller: snapshot ? snapshot.sellerName : null,
                asinFound: snapshot ? !!snapshot.asin : false
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

    function buildAlertIcon(accentColor, emphasize) {
        // Pure CSS geometric warning triangle (no emoji, no image assets).
        // Extreme tier gets a larger bright-red triangle so visual weight
        // increases with severity instead of collapsing to a dark maroon.
        const wrap = document.createElement('div');
        wrap.style.cssText =
            'position: relative; width: ' + (emphasize ? '34px' : '30px') + ';' +
            ' height: ' + (emphasize ? '30px' : '26px') + '; flex-shrink: 0; margin-top: 2px;';

        const triangle = document.createElement('div');
        triangle.style.cssText = [
            'position: absolute; top: 0; left: 1px;',
            'width: 0; height: 0;',
            'border-left: ' + (emphasize ? '16px' : '14px') + ' solid transparent;',
            'border-right: ' + (emphasize ? '16px' : '14px') + ' solid transparent;',
            'border-bottom: ' + (emphasize ? '27px' : '24px') + ' solid ' +
                (emphasize ? accentColor : PALETTE.text) + ';'
        ].join(' ');

        const mark = document.createElement('div');
        mark.textContent = '!';
        mark.style.cssText = [
            'position: absolute; top: ' + (emphasize ? '9px' : '8px') + '; left: 50%;',
            'transform: translateX(-50%);',
            `color: ${PALETTE.surface};`,
            'font-weight: 800; font-size: ' + (emphasize ? '13px' : '12px') + '; line-height: 1;'
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
        const isYellowTier = evaluation.tier === 'yellow';
        const isExtremeTier = evaluation.tier === 'extreme';

        const tierColor = isEnforcement ? PALETTE.enforcement :
            (isBlueTier ? PALETTE.blueAccent :
                (isYellowTier ? PALETTE.caution :
                    (isExtremeTier ? PALETTE.extreme : PALETTE.accent)));

        // Visual hierarchy must track severity: extreme gets a brighter red,
        // a thicker top border, a dark-red gradient, and a red glow; elevated
        // keeps the standard crimson hairline. A darker maroon read as LESS
        // alarming than elevated in the field (2026-11-07).
        const bannerBackground = isExtremeTier
            ? 'linear-gradient(180deg, #2A0B0B 0%, #1C1C1E 72%)'
            : PALETTE.surface;
        const bannerBorderWidth = isExtremeTier ? 3 : 2;
        const bannerShadow = isExtremeTier
            ? '0 0 0 1px rgba(239,68,68,0.32) inset, 0 10px 30px rgba(239,68,68,0.26)'
            : '0 6px 18px rgba(0,0,0,0.45)';

        const banner = document.createElement('div');
        banner.id = 'scamscanned-alert-shield';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('data-tier', evaluation.tier);
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%;
            background: ${bannerBackground}; color: ${PALETTE.text};
            font-family: ${FONT_STACK};
            border-top: ${bannerBorderWidth}px solid ${tierColor};
            text-align: left; padding: 16px 28px; z-index: 1000000;
            box-shadow: ${bannerShadow};
            display: flex; flex-wrap: wrap; align-items: center;
            justify-content: center; gap: 20px; box-sizing: border-box;
        `;

        const icon = buildAlertIcon(tierColor, isExtremeTier);

        const content = document.createElement('div');
        content.style.cssText =
            'display: flex; flex-direction: column; align-items: flex-start; gap: 6px; max-width: 720px;';

        // Severity badge: a solid bright-red EXTREME chip outranks the
        // outline ELEVATED chip at a glance. Enforcement uses the same solid
        // treatment (its action is terminal).
        const severityLabel = isEnforcement ? 'DO NOT BUY' :
            (isExtremeTier ? 'EXTREME' :
                (isYellowTier ? 'LOW CAUTION' :
                    (isBlueTier ? 'VERIFY' : 'ELEVATED')));
        const solidBadge = isEnforcement || isExtremeTier;
        const severityBadge = document.createElement('span');
        severityBadge.textContent = severityLabel;
        severityBadge.style.cssText = [
            'display: inline-block',
            'font-size: 10px',
            'font-weight: 800',
            'letter-spacing: 0.09em',
            'line-height: 1.7',
            'padding: 1px 7px',
            'border-radius: 4px',
            'white-space: nowrap',
            'background: ' + (solidBadge ? tierColor : 'transparent'),
            'color: ' + (solidBadge ? PALETTE.surface : tierColor),
            'border: 1px solid ' + tierColor
        ].join(';') + ';';

        // Main hazard category title — tier-aware, with the badge on one row.
        const headline = document.createElement('div');
        headline.id = 'scamscanned-alert-headline';
        headline.style.cssText =
            'font-size: ' + (isExtremeTier ? '19px' : '18px') + ';' +
            ' font-weight: ' + (isExtremeTier ? '700' : '600') + '; letter-spacing: 0.2px;';
        // Count-honest headline (field 2026-11-07: a single merchant-name
        // hit rendered "Multiple Caution Signals"). One signal = singular.
        const reasonCount = (evaluation.reasons || []).length;
        headline.innerText = isEnforcement ? ENFORCEMENT_TIER_TITLE :
            (isYellowTier ? YELLOW_TIER_TITLE :
                (isExtremeTier ? EXTREME_TIER_TITLE :
                    (isBlueTier ? BLUE_TIER_TITLE :
                        (reasonCount > 1 ? RED_TIER_TITLE : RED_TIER_TITLE_SINGLE))));

        const headlineRow = document.createElement('div');
        headlineRow.style.cssText =
            'display: flex; align-items: center; flex-wrap: wrap; gap: 8px;';
        headlineRow.appendChild(severityBadge);
        headlineRow.appendChild(headline);

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

        // SIGNAL METER + COUNTERWEIGHT BLOCK (user direction, 2026-11-07):
        // degree via literal zone count; balance via observables-only
        // "on your side" notes. Suppressed on enforcement and extreme
        // tiers (record/terminal verdicts must not be softened) and on
        // evaluators that never ran the PDP structural scan.
        let signalMeter = null;
        let columnsBlock = null;
        if (!isEnforcement && !isExtremeTier && evaluation.structuralScanRan) {
            const flaggedFamilies = signalFamiliesFlagged(evaluation.reasons);
            const litSet = {};
            flaggedFamilies.forEach(function (fam) { litSet[fam] = true; });

            signalMeter = document.createElement('div');
            signalMeter.id = 'scamscanned-alert-meter';
            signalMeter.style.cssText =
                'display: flex; align-items: center; gap: 4px; margin-top: 2px;';
            SIGNAL_FAMILY_KEYS.forEach(function (fam) {
                const seg = document.createElement('span');
                seg.style.cssText =
                    'width: 26px; height: 6px; border-radius: 3px; background-color: ' +
                    (litSet[fam] ? tierColor : 'rgba(255,255,255,0.16)') + ';';
                seg.title = SIGNAL_FAMILY_LABELS[fam];
                signalMeter.appendChild(seg);
            });
            const meterText = document.createElement('span');
            meterText.textContent = flaggedFamilies.length + ' of 6 signal zones flagged';
            meterText.style.cssText =
                'font-size: 11px; color: rgba(255,255,255,0.6); margin-left: 8px;';
            signalMeter.appendChild(meterText);
            signalMeter.setAttribute('role', 'img');
            signalMeter.setAttribute('aria-label',
                flaggedFamilies.length + ' of 6 signal zones flagged: ' +
                SIGNAL_FAMILY_KEYS.map(function (fam) {
                    return SIGNAL_FAMILY_LABELS[fam] + (litSet[fam] ? ' (flagged)' : '');
                }).join(', '));

            const notes = buildCounterweightNotes(evaluation);
            if (notes.length > 0) {
                const watchCol = document.createElement('div');
                watchCol.style.cssText = 'flex: 1 1 260px; min-width: 220px;';
                const watchHead = document.createElement('div');
                watchHead.textContent = 'Watch for:';
                watchHead.style.cssText =
                    'font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; ' +
                    'color: rgba(255,255,255,0.6); margin-bottom: 4px;';
                watchCol.appendChild(watchHead);
                watchCol.appendChild(reasonList);

                const counterCol = document.createElement('div');
                counterCol.id = 'scamscanned-alert-counter';
                counterCol.style.cssText = 'flex: 1 1 260px; min-width: 220px;';
                const counterHead = document.createElement('div');
                counterHead.textContent = 'What\u2019s on your side:';
                counterHead.style.cssText =
                    'font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; ' +
                    'color: rgba(255,255,255,0.6); margin-bottom: 4px;';
                counterCol.appendChild(counterHead);
                const counterList = document.createElement('ul');
                counterList.style.cssText =
                    'margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 3px;';
                notes.forEach(function (noteText) {
                    const li = document.createElement('li');
                    li.style.cssText =
                        'font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.85); line-height: 1.55;';
                    li.textContent = noteText;
                    counterList.appendChild(li);
                });
                counterCol.appendChild(counterList);

                columnsBlock = document.createElement('div');
                columnsBlock.id = 'scamscanned-alert-columns';
                columnsBlock.style.cssText =
                    'display: flex; gap: 28px; flex-wrap: wrap; align-items: flex-start; width: 100%;';
                columnsBlock.appendChild(watchCol);
                columnsBlock.appendChild(counterCol);
            }
        }

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

        // BOTTOM LINE (wave 2026-11-07b): one hedged sentence a shopper can
        // act on without reading anything else — the scan's takeaway. ASCII
        // strings per house banner convention.
        const bottomLine = document.createElement('div');
        bottomLine.id = 'scamscanned-alert-bottomline';
        bottomLine.style.cssText =
            'font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,0.9); letter-spacing: 0.1px;';
        bottomLine.textContent = isEnforcement
            ? 'Bottom line: a government or court record names this seller. Pick a different offer.'
            : (isYellowTier
                ? 'Bottom line: one soft signal with nothing stacked — this band is usually fine. The fast check below is optional.'
                : (isExtremeTier
                    ? 'Bottom line: multiple strong signals align on this offer. Choose a different listing — the alternatives search is one click away.'
                    : (isBlueTier
                        ? 'Bottom line: nothing decisive found. The seller is new, so a 10-second record glance is worth it.'
                        : ((evaluation.reasons || []).length > 1
                            ? 'Bottom line: this offer stacks caution signals. Verify the seller or choose a different listing.'
                            : 'Bottom line: one caution signal on this offer. Verify the seller or choose a different listing.'))));

        // VERIFY TIP (user direction, 2026-11-07): the bottom line says
        // "verify" — this tells shoppers WHAT the fast verification is.
        // Observable-language doctrine: describes what the shopper will SEE
        // (photos buyers added, alike-sounding review text) — no assertions
        // about AI authorship or review authenticity (§5 doctrine).
        // Suppressed on the extreme tier: its verdict is "choose a
        // different listing" — inviting further evaluation would soften
        // the firmest tier. Yellow keeps it (its bottom line points to
        // "the fast check below"); red and blue keep it (both say
        // "verify").
        let verifyTip = null;
        if (!isEnforcement && !isExtremeTier) {
            verifyTip = document.createElement('div');
            verifyTip.id = 'scamscanned-alert-verifytip';
            verifyTip.style.cssText =
                'font-size: 11.5px; color: rgba(255,255,255,0.65); line-height: 1.5;';
            verifyTip.textContent =
                'Fast check: look at the photos buyers added in reviews, then read several of them — reviews that all sound alike can indicate a mass-generated campaign.';
        }

        // SELLER SNAPSHOT LINE (wave 2026-11-07b): the seller-legitimacy
        // answer INSIDE the banner — "Sold by X (1,225 ratings, 87% positive,
        // past 12 months)" — Amazon's own printed stats, so this REPORTS
        // platform data rather than judging it. The "view record" link stays
        // purely navigational: no tag, no telemetry, verification only.
        // Omitted entirely when nothing parsed (silence default).
        const snap = (evaluation && evaluation.snapshot) || {};
        const snapName = snap.sellerName || null;
        const snapCount = (typeof snap.feedbackCount === 'number') ? snap.feedbackCount : null;
        const snapPct = (typeof snap.feedbackPct === 'number') ? snap.feedbackPct : null;
        let sellerProfileUrl = null;
        try {
            sellerProfileUrl = getSellerProfileUrl();
        } catch (probeErr) {
            sellerProfileUrl = null;
        }
        let sellerLine = null;
        if (snapName || (snapCount !== null && snapPct !== null)) {
            sellerLine = document.createElement('div');
            sellerLine.id = 'scamscanned-alert-sellerline';
            sellerLine.style.cssText =
                'font-size: 12.5px; color: rgba(255,255,255,0.75); letter-spacing: 0.1px;';
            const countStr = snapCount !== null ? snapCount.toLocaleString('en-US') : null;
            if (snapName && countStr !== null) {
                sellerLine.textContent =
                    'Sold by ' + snapName + ' (' + countStr + ' ratings, ' +
                    snapPct + '% positive, past 12 months)';
            } else if (snapName) {
                sellerLine.textContent = 'Sold by ' + snapName;
            } else {
                sellerLine.textContent =
                    'Seller stats: ' + countStr + ' ratings, ' +
                    snapPct + '% positive (past 12 months)';
            }
            if (sellerProfileUrl) {
                const recordLink = document.createElement('a');
                recordLink.href = sellerProfileUrl;
                recordLink.target = '_blank';
                recordLink.rel = 'noopener noreferrer';
                recordLink.style.cssText = [
                    'color: rgba(255,255,255,0.75); text-decoration: underline;',
                    'font-family: ' + FONT_STACK + '; font-size: 12.5px; margin-left: 6px;'
                ].join(' ');
                recordLink.textContent = 'view record';
                sellerLine.appendChild(recordLink);
            }
        }

        content.appendChild(headlineRow);
        content.appendChild(bottomLine);
        if (verifyTip) {
            content.appendChild(verifyTip);
        }
        if (sellerLine) {
            content.appendChild(sellerLine);
        }
        if (signalMeter) {
            content.appendChild(signalMeter);
        }
        if (columnsBlock) {
            content.appendChild(columnsBlock);
        } else {
            content.appendChild(reasonList);
        }
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

        // PIVOT QUERY BUILDER (wave 2026-11-07b): turn the title into a
        // same-product search that returns usable, comparable alternatives —
        //   (a) strip Amazon's " : <suffix>" title tail (category/merchant),
        //   (b) drop connective and merchandising noise tokens,
        //   (c) drop pure-digit tokens ("5.3" decays to "53" and pollutes),
        //   (d) HARD RULE: drop every token that also appears in the flagged
        //       seller's own storefront name — the pivot must never route a
        //       wary buyer back into the seller's own catalog,
        //   (e) cap at 6 informative tokens (Amazon ranks long k= strings
        //       poorly).
        const buildFallbackQuery = function (title, sellerName) {
            let t = String(title || '').split(' : ')[0];
            t = t.replace(/&(amp|nbsp|lt|gt|quot|#39);/gi, ' ');
            // Deal-marketing phrases are pricing-page artifacts, not product
            // identity (wave 2026-11-07j; server buildPivotQuery parity).
            // Seasonal words (advent, christmas...) stay: legit intent.
            t = t.replace(
                /limited time deals?|deal of the day|prime day|black friday|cyber monday/gi,
                ' '
            );
            const sellerTokens = {};
            String(sellerName || '').toLowerCase().split(/\s+/)
                .forEach(function (tok) {
                    if (tok.length >= 2) sellerTokens[tok] = true;
                });
            const noise = {
                'with': true, 'and': true, 'for': true, 'the': true, 'a': true,
                'of': true, 'set': true, 'pack': true, 'bundle': true,
                'combo': true, 'free': true, 'gift': true, 'new': true,
                // Entity-decay + platform-name junk that mass-generated
                // titles keyword-stuff into product titles (field 2026-11-07:
                // "Amazoncom"/"amp"/year tokens reached results verbatim via
                // the server pivot before this pass existed on either side).
                'amp': true, 'nbsp': true,
                'amazon': true, 'amazoncom': true, 'com': true,
                'deal': true, 'deals': true
            };
            return t.toLowerCase()
                .replace(/[^a-z0-9\s\-]/g, ' ')
                .split(/\s+/)
                .filter(function (tok) {
                    if (tok.length < 2) return false;
                    if (noise[tok]) return false;
                    if (/^\d+$/.test(tok)) return false;
                    if (sellerTokens[tok]) return false;
                    return true;
                })
                .slice(0, 6)
                .map(function (tok) { return encodeURIComponent(tok); })
                .join('+');
        };
        const fallbackQuery = buildFallbackQuery(document.title, snap.sellerName);
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

        // COMPARE OFFERS (wave 2026-11-07b): "similar enough" made exact —
        // the SAME product, alternate sellers' offers, on a platform-native
        // page. Built from the URL's own ASIN only (no offer scraping either
        // direction). Attribution stays on this link because it can end in a
        // purchase (monetization constraint); it still certifies nothing.
        if (snap && snap.asin) {
            const offersLink = document.createElement('a');
            offersLink.href =
                'https://www.amazon.com/gp/offer-listing/' + snap.asin +
                '?tag=' + AFFILIATE_TAG;
            offersLink.target = '_blank';
            offersLink.rel = 'noopener noreferrer';
            offersLink.style.cssText = [
                'font-size: 11px; color: rgba(255,255,255,0.65);',
                'text-decoration: underline; font-family: ' + FONT_STACK + ';'
            ].join(' ');
            offersLink.textContent = 'Compare other sellers of this exact item';
            pivotWrap.appendChild(offersLink);
        }

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
                // Bottom line and the seller snapshot must not contradict
                // the record tier: heuristics said "verify", the record says
                // the verdict changed. Swap the take-home line, retire the
                // seller-stats line.
                const bottomLineEl = existing.querySelector('#scamscanned-alert-bottomline');
                if (bottomLineEl) {
                    bottomLineEl.textContent =
                        'Bottom line: a government or court record names this seller. Pick a different offer.';
                }
                const sellerLineEl = existing.querySelector('#scamscanned-alert-sellerline');
                if (sellerLineEl) {
                    sellerLineEl.remove();
                }
                // The verify tip answers a heuristic verdict; the record
                // verdict is terminal. Retire it like the seller line.
                const verifyTipEl = existing.querySelector('#scamscanned-alert-verifytip');
                if (verifyTipEl) {
                    verifyTipEl.remove();
                }
                // The signal meter and counterweight column convey
                // heuristic degree and balance; a record verdict replaces
                // the evaluation. Retire both, but keep the reasons list
                // visible by unwrapping it from the columns block.
                const meterEl = existing.querySelector('#scamscanned-alert-meter');
                if (meterEl) {
                    meterEl.remove();
                }
                const columnsEl = existing.querySelector('#scamscanned-alert-columns');
                if (columnsEl) {
                    const listInColumns = columnsEl.querySelector('ul');
                    if (listInColumns) {
                        columnsEl.parentNode.insertBefore(listInColumns, columnsEl);
                    }
                    columnsEl.remove();
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
                ' excerpt="' + (d.excerpt || '') + '"' +
                ' logisticsChars=' + (d.logisticsChars || 0) +
                ' shipping=' + (d.shippingTrigger || '-') +
                ' shippingEvidence="' + (d.shippingEvidence || '') + '"' +
                ' logistics="' + (d.logisticsExcerpt || '') + '"'
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
