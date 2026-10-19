// background.js — ScamScanned Alpha
// Secure background fetch network layer. Content-script sensors cannot POST
// cross-origin directly (page CORS applies), so telemetry is relayed through
// this service worker, which holds host_permissions for the API endpoint.

// Live HostGator API destination — the explicit api script path. Posting to
// the bare domain root serves the landing page (text/html), which violated
// the JSON contract, drained every relay roundtrip to ok:false, and left the
// pivot button stranded on its fallback href.
const TELEMETRY_ENDPOINT = 'https://scamscanned.com/api/index.php';

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Only accept the exact telemetry envelope shape from our sensors.
    if (
        !message ||
        message.type !== 'SCAMSCANNED_TELEMETRY' ||
        !message.payload ||
        typeof message.payload !== 'object'
    ) {
        sendResponse({ ok: false, safe_pivot_url: null, verified_record: null });
        return false;
    }

    fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message.payload)
    })
        .then(function (response) {
            if (!response.ok) {
                console.warn('[ScamScanned] relay: HTTP status ' + response.status);
                sendResponse({ ok: false, safe_pivot_url: null, verified_record: null });
                return;
            }
            response.json().then(function (data) {
                // Tolerant contract parser: the API historically nested the
                // pivot under monetization; newer builds emit it top-level.
                let pivot = data && data.safe_pivot_url;
                if (!pivot && data && data.monetization) {
                    pivot = data.monetization.safe_pivot_url;
                }
                pivot =
                    typeof pivot === 'string' && pivot.length > 0
                        ? pivot
                        : null;

                // Enforcement records pass through to the sensor tier renderer.
                const verifiedRecord =
                    data && typeof data.verified_record === 'object'
                        ? data.verified_record
                        : null;

                if (!pivot) {
                    console.warn('[ScamScanned] relay: response carried no pivot URL');
                }
                sendResponse({
                    ok: true,
                    safe_pivot_url: pivot,
                    verified_record: verifiedRecord
                });
            }).catch(function () {
                console.warn('[ScamScanned] relay: body was not valid JSON');
                sendResponse({ ok: false, safe_pivot_url: null, verified_record: null });
            });
        })
        .catch(function (err) {
            console.warn(
                '[ScamScanned] relay: network error',
                err && err.message ? err.message : err
            );
            sendResponse({ ok: false, safe_pivot_url: null, verified_record: null });
        });

    // Keep the message channel open for the async fetch above.
    return true;
});
