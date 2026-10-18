// sensor-etsy.js — ScamScanned Alpha
// BASELINE Etsy sensor: inspects local URL parameters on etsy.com pages.
// Baseline scope: URL params only — no DOM text parsing yet.

(function() {
    'use strict';

    // 1. Immutable Global Architecture Constants
    const BANNER_SHIFT = '90px';

    // Traffic-source markers that indicate a link shared over messaging apps.
    const RISK_SOURCE_PATTERN = /(sms|whatsapp|text|textlink|messenger)/i;

    // Domain gate: pipeline step 0 (etsy.com pages only).
    function isEtsyPage() {
        return /(^|\.)etsy\.com$/i.test(window.location.hostname);
    }

    // 2. Core Heuristic Analysis Engine (URL parameter baseline)
    function checkUrlParams() {
        let params;
        try {
            params = new URLSearchParams(window.location.search);
        } catch (err) {
            return { isRisky: false, reason: null };
        }

        const source = params.get('utm_source') || params.get('utm_medium') || '';

        if (source && RISK_SOURCE_PATTERN.test(source)) {
            return {
                isRisky: true,
                reason: 'Listing link was distributed via a messaging channel (SMS/WhatsApp) — a common scam funnel pattern.'
            };
        }

        // Default: URL parameters passed baseline screening.
        return { isRisky: false, reason: null };
    }

    // 3. Senior-Accessible Visual Interface Renderer
    function injectSafetyBanner(evaluation) {
        if (!evaluation.isRisky) return;

        // Prevent double injection overlays
        if (document.getElementById('scamscanned-etsy-shield')) return;

        const banner = document.createElement('div');
        banner.id = 'scamscanned-etsy-shield';
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%;
            background-color: #D32F2F; color: #FFFFFF; font-family: sans-serif;
            text-align: center; padding: 18px 10px; z-index: 1000000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 6px; box-sizing: border-box;
        `;

        const headline = document.createElement('div');
        headline.style.cssText = 'font-size: 20px; font-weight: bold;';
        headline.innerText = "🚨 SCAM ALERT: ScamScanned flagged this listing as Unsafe!";

        const subline = document.createElement('div');
        subline.style.cssText = 'font-size: 14px; font-weight: 600; opacity: 0.95; max-width: 800px;';
        subline.innerText = `Reason: ${evaluation.reason}`;

        banner.appendChild(headline);
        banner.appendChild(subline);

        // Push page elements down to ensure clear readability
        document.body.prepend(banner);
        document.body.style.marginTop = BANNER_SHIFT;
    }

    // 4. Run Live Local Execution Pathway
    // Pipeline: domain check -> parse URL params -> risk evaluation -> inject.
    function run() {
        if (!isEtsyPage()) return;
        const evaluateAndInject = function () {
            const listingEvaluation = checkUrlParams();
            injectSafetyBanner(listingEvaluation);
        };
        if (document.body) {
            evaluateAndInject();
        } else {
            document.addEventListener('DOMContentLoaded', evaluateAndInject);
        }
    }

    run();
})();
