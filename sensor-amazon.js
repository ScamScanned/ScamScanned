// sensor-amazon.js — ScamScanned Alpha
// Enterprise visual layer + expanded risk criteria matrix (B-1..B-8).
// Pipeline: domain gate -> page text parse -> neutralizers -> risk matrix
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
        deepCrimson: '#8B0000',  // Button text
        text: '#FFFFFF'
    };
    const FONT_STACK = "system-ui, -apple-system, 'Inter', 'Segoe UI', Arial, sans-serif";
    const SHIPPING_REASON =
        'Extended third-party shipping timeframe outlasts standard buyer protection frames.';
    const GHOST_LISTING_REASON =
        'Merchant lacks corporate fulfillment approval. Hidden checkout channels pose severe protection risks.';
    const BLUE_TIER_TITLE = 'Unclear Risk — Assume Likely Scam Until Verified';
    const RED_TIER_TITLE = 'SCAM ALERT: ScamScanned flagged this listing as Unsafe.';

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
        return SUPPORTED_MARKETPLACE_PATTERN.test(window.location.hostname);
    }

    // 2. Core Heuristic Analysis Engine (expanded risk matrix)
    // Returns { isRisky, reasons[], tier: 'red'|'blue', blockCheckout } —
    // every triggered sub-reason is collected; tier is 'blue' only when the
    // ghost-listing fallback is the sole trigger; checkout blocking applies
    // whenever the ghost-listing rule fires.

    // Merchant Identity Shield (Rule B-6, refined): parses the seller name
    // from the RAW page text (case-sensitive) and flags either signature —
    //   (a) entropy: 4+ consecutive consonants with zero vowels
    //   (b) all-caps: 4+ letters, 100% UPPERCASE, no word capitalization
    function hasGarbledMerchantName(rawText) {
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
        if (pageText.includes('fulfilled by amazon')) return false;

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

    // Ghost Listing Fallback (Rule B-8): Amazon-native strings revealing the
    // buy box has collapsed into unvetted secondary checkout channels.
    function hasGhostListing(pageText) {
        // Defensive FBA guard (Route A already guarantees this upstream).
        if (pageText.includes('fulfilled by amazon')) return false;
        return (
            pageText.includes('no featured offers available') ||
            pageText.includes('available from these sellers') ||
            pageText.includes('see all buying options')
        );
    }

    function checkListingSafety() {
        const rawText = document.body.innerText;
        const pageText = rawText.toLowerCase();

        // ROUTE A: Absolute Logistics Neutralizer Evaluation (Runs First)
        if (pageText.includes('ships from amazon') || pageText.includes('fulfilled by amazon')) {
            return { isRisky: false, reasons: [], tier: null, blockCheckout: false };
        }

        const reasons = [];
        let ghostTriggered = false;

        // ROUTE B: Expanded Risk Criteria Matrix

        // B-1: Overseas shipping signatures
        if (pageText.includes('ships from overseas') || pageText.includes('ships via overseas')) {
            reasons.push(SHIPPING_REASON);
        }

        // B-2: Day-threshold parser (e.g., arrives in 30 days)
        const dayMatch = pageText.match(/arrives in\s+(\d+)\s+days/);
        if (dayMatch && parseInt(dayMatch[1], 10) >= MIN_RISK_DAYS) {
            reasons.push(SHIPPING_REASON);
        }

        // B-3: Week-threshold parser (e.g., delivery in 4 weeks)
        const weekMatch = pageText.match(/delivery in\s+(\d+)\s+weeks/);
        if (weekMatch && parseInt(weekMatch[1], 10) >= MIN_RISK_WEEKS) {
            reasons.push(SHIPPING_REASON);
        }

        // B-4: Generic week cues
        if (pageText.includes('in weeks') || pageText.includes('in several weeks')) {
            reasons.push(SHIPPING_REASON);
        }

        // B-5: Native Defect History (Amazon-native return-frequency marker)
        if (pageText.includes('frequently returned item')) {
            reasons.push('High Product Defect History');
        }

        // B-6: Merchant Identity Shield (entropy + ALL-CAPS, raw-cased name)
        if (hasGarbledMerchantName(rawText)) {
            reasons.push('Suspicious Merchant Identity Signature');
        }

        // B-7: Price Urgency Trap
        if (hasDeceptiveMarkdown(pageText)) {
            reasons.push('Deceptive Pricing Discrepancy');
        }

        // B-8: Ghost Listing Fallback (Blue tier)
        if (hasGhostListing(pageText)) {
            ghostTriggered = true;
            reasons.push(GHOST_LISTING_REASON);
        }

        // Deduplicate (multiple shipping hits collapse to one entry).
        const uniqueReasons = Array.from(new Set(reasons));
        const redTierCount = ghostTriggered ? uniqueReasons.length - 1 : uniqueReasons.length;
        return {
            isRisky: uniqueReasons.length > 0,
            reasons: uniqueReasons,
            // Blue tier only when the ghost listing is the sole trigger.
            tier: uniqueReasons.length > 0 ? (redTierCount > 0 ? 'red' : 'blue') : null,
            blockCheckout: ghostTriggered
        };
    }

    // 4a. Secure Telemetry Dispatch (background fetch network layer).
    // Fires only when an un-neutralized risk triggers.
    function dispatchTelemetry() {
        // Dynamic platform attribution: resolve the active window's domain.
        const platformSource = window.location.hostname.includes('walmart.com')
            ? 'walmart_us'
            : 'amazon_us';

        const telemetryPayload = {
            platform_source: platformSource,
            target_url: window.location.href,
            telemetry_data: { page_title: document.title }
        };

        chrome.runtime.sendMessage(
            { type: 'SCAMSCANNED_TELEMETRY', payload: telemetryPayload },
            function (response) {
                // Silent fallback: network failure keeps the affiliate href.
                if (chrome.runtime.lastError || !response || !response.ok) return;

                // Dynamic Pivot: remap the action button to the server's
                // safe_pivot_url from the secure JSON response.
                if (response.safe_pivot_url) {
                    const button = document.getElementById('scamscanned-action-button');
                    if (button) {
                        button.href = response.safe_pivot_url;
                    }
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
        if (!evaluation.isRisky) return;

        // Prevent double injection overlays if user shifts tabs
        if (document.getElementById('scamscanned-alert-shield')) return;

        const isBlueTier = evaluation.tier === 'blue';

        const banner = document.createElement('div');
        banner.id = 'scamscanned-alert-shield';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('data-tier', evaluation.tier);
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%;
            background-color: ${PALETTE.surface}; color: ${PALETTE.text};
            font-family: ${FONT_STACK};
            border-top: 2px solid ${isBlueTier ? PALETTE.blueAccent : PALETTE.accent};
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
        headline.style.cssText = 'font-size: 18px; font-weight: 600; letter-spacing: 0.2px;';
        headline.innerText = isBlueTier ? BLUE_TIER_TITLE : RED_TIER_TITLE;

        // Clean bulleted list of every triggered sub-reason.
        const reasonList = document.createElement('ul');
        reasonList.style.cssText =
            'margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 3px;';
        evaluation.reasons.forEach(function (reasonText) {
            const item = document.createElement('li');
            item.style.cssText =
                'font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.92); line-height: 1.55;';
            item.innerText = reasonText;
            reasonList.appendChild(item);
        });

        content.appendChild(headline);
        content.appendChild(reasonList);

        // Action pivot button — sharp corporate edges, dark crimson text.
        // Base href carries the affiliate fallback; telemetry swaps in the
        // HostGator safe_pivot_url when the server responds.
        const pivotButton = document.createElement('a');
        pivotButton.id = 'scamscanned-action-button';
        pivotButton.href = `https://amazon.com/?tag=${AFFILIATE_TAG}`;
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

        banner.appendChild(icon);
        banner.appendChild(content);
        banner.appendChild(pivotButton);

        // Push page elements down: shift matches real rendered banner height.
        document.body.prepend(banner);
        document.body.style.marginTop = (banner.offsetHeight + 12) + 'px';

        // Ghost Listing guardrail: freeze unvetted checkout channels.
        if (evaluation.blockCheckout) {
            blockUnvettedCheckoutChannels();
        }
    }

    // 4. Run Live Local Execution Pathway
    function run() {
        if (!isSupportedMarketplace()) return;
        const evaluateAndInject = function () {
            const listingEvaluation = checkListingSafety();
            injectSafetyBanner(listingEvaluation);
            if (listingEvaluation.isRisky) {
                dispatchTelemetry();
            }
        };
        if (document.body) {
            evaluateAndInject();
        } else {
            document.addEventListener('DOMContentLoaded', evaluateAndInject);
        }
    }

    run();
})();
