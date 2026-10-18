// sensor-local.js — ScamScanned Alpha
// Local-trade sensor for craigslist.org and facebook.com.
// Baseline behavior: unconditionally display the distinct high-visibility
// ORANGE Safe Trade Protocol banner (in-person deal safety rules).

(function() {
    'use strict';

    // 1. Immutable Global Architecture Constants
    const BANNER_SHIFT = '110px';

    // Domain gate: pipeline step 0 (local-trade platforms only).
    function isLocalPlatform() {
        const host = window.location.hostname;
        return (
            /(^|\.)craigslist\.org$/i.test(host) ||
            /(^|\.)facebook\.com$/i.test(host)
        );
    }

    // 2. Senior-Accessible Visual Interface Renderer (Orange variant)
    function injectSafeTradeBanner() {
        // Prevent double injection overlays
        if (document.getElementById('scamscanned-local-shield')) return;

        const banner = document.createElement('div');
        banner.id = 'scamscanned-local-shield';
        banner.setAttribute('role', 'alert');
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%;
            background-color: #E65100; color: #FFFFFF; font-family: sans-serif;
            text-align: center; padding: 16px 12px; z-index: 1000000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 5px; box-sizing: border-box;
        `;

        // Headline
        const headline = document.createElement('div');
        headline.style.cssText = 'font-size: 20px; font-weight: bold; line-height: 1.4;';
        headline.innerText = "🚨 SCAMSCANNED LOCAL MEETING SAFETY CHECKMATE:";

        // Safe Trade Protocol rules (stacked for senior readability)
        const rules = [
            "1. CASH ONLY (No advance deposits via Zelle/Venmo)",
            "2. PUBLIC SAFE ZONE MEETUP (Police Station Parking Lot Only)",
            "3. PHYSICAL INSPECTION FIRST."
        ];

        banner.appendChild(headline);
        rules.forEach(function (ruleText) {
            const rule = document.createElement('div');
            rule.style.cssText =
                'font-size: 15px; font-weight: 600; opacity: 0.97; max-width: 860px; line-height: 1.5;';
            rule.innerText = ruleText;
            banner.appendChild(rule);
        });

        // Push page elements down to ensure clear readability
        document.body.prepend(banner);
        document.body.style.marginTop = BANNER_SHIFT;
    }

    // 3. Run Live Local Execution Pathway
    function run() {
        if (!isLocalPlatform()) return;
        if (document.body) {
            injectSafeTradeBanner();
        } else {
            document.addEventListener('DOMContentLoaded', injectSafeTradeBanner);
        }
    }

    run();
})();
