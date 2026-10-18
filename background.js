// background.js — ScamScanned Alpha
// Secure background fetch network layer. Content-script sensors cannot POST
// cross-origin directly (page CORS applies), so telemetry is relayed through
// this service worker, which holds host_permissions for the API endpoint.

// Live HostGator API destination.
const TELEMETRY_ENDPOINT = 'https://scamscanned.com';

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Only accept the exact telemetry envelope shape from our sensors.
    if (
        !message ||
        message.type !== 'SCAMSCANNED_TELEMETRY' ||
        !message.payload ||
        typeof message.payload !== 'object'
    ) {
        sendResponse({ ok: false, safe_pivot_url: null });
        return false;
    }

    fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message.payload)
    })
        .then(function (response) {
            if (!response.ok) {
                sendResponse({ ok: false, safe_pivot_url: null });
                return;
            }
            response.json().then(function (data) {
                const pivot =
                    data &&
                    typeof data.safe_pivot_url === 'string' &&
                    data.safe_pivot_url.length > 0
                        ? data.safe_pivot_url
                        : null;
                sendResponse({ ok: true, safe_pivot_url: pivot });
            }).catch(function () {
                sendResponse({ ok: false, safe_pivot_url: null });
            });
        })
        .catch(function () {
            sendResponse({ ok: false, safe_pivot_url: null });
        });

    // Keep the message channel open for the async fetch above.
    return true;
});
