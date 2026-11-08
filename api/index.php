<?php
header('Content-Type: application/json');
// CORS deliberately withheld: the extension's service-worker fetch operates
// under host_permissions and needs no ACAO; withholding it blocks arbitrary
// web pages from calling this relay. Add a strict origin allowlist only if a
// web client ever needs to consume this endpoint.


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}


define('AFFILIATE_TAG', 'scamscanned-20');
define('REGISTRY_PATH', __DIR__ . '/registry.json');


// Parse incoming client telemetry array payload
$input = json_decode(file_get_contents('php://input'), true);


if (!$input || !isset($input['platform_source'])) {
    echo json_encode([
        'server_status' => 'ONLINE',
        'api_version' => '0.2.2',
        'message' => 'ScamScanned API is online.'
    ]);
    exit;
}


$pageTitle = isset($input['telemetry_data']['page_title']) ? htmlspecialchars($input['telemetry_data']['page_title']) : 'Product';
// Punctuation-insensitive normalization on both sides of the registry match.
$sellerName = isset($input['telemetry_data']['seller_name'])
    ? strtolower(rtrim(trim($input['telemetry_data']['seller_name']), " \t."))
    : '';

// PIVOT QUERY BUILDER (wave 12c, field 2026-11-07): the naive "keep all
// title characters" builder shipped the mass-generated listing's OWN junk
// keywords into the search results — the advent-calendar specimen reached
// results verbatim as "Amazoncom", "amp" and bare year tokens. The client
// fallback got the same pipeline (buildFallbackQuery); this is THAT rule
// set, server-side, so the premium (rh-filtered) pivot can never route a
// wary buyer into the flagged seller's own catalog or keyword garbage.
//   (a) strip Amazon's trailing " : <suffix>" title tail,
//   (b) decode-then-drop HTML entity decay tokens BEFORE the punctuation
//       strip (htmlspecialchars at intake adds '&amp;'-shaped literals,
//       and listings themselves carry '&nbsp;' etc.) — otherwise the strip
//       peels the '&' and LEAVES the word "amp" in the keywords,
//   (c) drop the 13 connective/merchandising noise tokens,
//   (d) drop pure-digit tokens ("5.3" decays to "53" and pollutes; years
//       among them — alternatives discovery does not need exact years),
//   (e) drop platform-name tokens (mass-gen titles keyword-stuff
//       "Amazon.com"-style branding into the product title),
//   (f) HARD RULE: purge every token that also appears in the flagged
//       seller's own storefront name,
//   (g) cap at 6 informative tokens (Amazon ranks long k= strings poorly).
function buildPivotQuery($title, $sellerName) {
    $t = trim(explode(' : ', (string)$title)[0]);
    $t = str_ireplace(
        ['&amp;', '&nbsp;', '&lt;', '&gt;', '&quot;', '&#39;'],
        ' ',
        $t
    );
    // Deal-marketing phrases are pricing-page artifacts, not product identity
    // (wave 2026-11-07j; client buildFallbackQuery parity). Seasonal words
    // like christmas/advent stay: legitimate shopping intent.
    $t = preg_replace(
        '/limited time deals?|deal of the day|prime day|black friday|cyber monday/i',
        ' ',
        $t
    );
    $noise = [
        'with' => 1, 'and' => 1, 'for' => 1, 'the' => 1, 'a' => 1,
        'of' => 1, 'set' => 1, 'pack' => 1, 'bundle' => 1,
        'combo' => 1, 'free' => 1, 'gift' => 1, 'new' => 1,
        'deal' => 1, 'deals' => 1,
        'amp' => 1, 'nbsp' => 1,
        'amazon' => 1, 'amazoncom' => 1, 'com' => 1
    ];
    $sellerTokens = [];
    foreach (preg_split('/\s+/', strtolower((string)$sellerName)) as $tok) {
        if ($tok !== '' && strlen($tok) >= 2) { $sellerTokens[$tok] = 1; }
    }
    $normalized = strtolower(preg_replace('/[^a-z0-9\s\-]/', ' ', $t));
    $kept = [];
    foreach (preg_split('/\s+/', $normalized) as $tok) {
        if (strlen($tok) < 2) continue;
        if (isset($noise[$tok])) continue;
        if (ctype_digit($tok)) continue;
        if (isset($sellerTokens[$tok])) continue;
        $kept[] = $tok;
        if (count($kept) >= 6) break;
    }
    if (count($kept) === 0) {
        return 'safe%20alternatives';
    }
    return implode('+', array_map('rawurlencode', $kept));
}


// Build the compliant, cleaned pivot URL (rh layer unchanged: Amazon's own
// platform-grade 4-star + Prime filters — never a ScamScanned certification).
$pivotKeywords = buildPivotQuery($pageTitle, $sellerName);
$safePivotUrl = "https://amazon.com/s?k={$pivotKeywords}&rh=p_85%3A2470955011%2Cp_72%3A1248879011&tag=" . AFFILIATE_TAG;


// ENFORCEMENT REGISTRY LOOKUP: matches ONLY against the curated registry of
// ADJUDICATED public enforcement records (FTC final orders, DOJ convictions,
// court judgments). Curated entries ALWAYS carry a source_url citation.
// ScamScanned never generates these records itself — it reports public ones.
$verifiedRecord = null;
if ($sellerName !== '' && is_readable(REGISTRY_PATH)) {
    $registry = json_decode(file_get_contents(REGISTRY_PATH), true);
    if (is_array($registry)) {
        foreach ($registry as $entry) {
            if (!isset($entry['seller_name'], $entry['source_url'])) {
                continue; // malformed entry — never match without a citation
            }
            if (rtrim(trim(strtolower($entry['seller_name'])), " \t.") === $sellerName) {
                $verifiedRecord = [
                    'matched_name' => $entry['seller_name'],
                    'source_label' => isset($entry['source_label']) ? $entry['source_label'] : 'official enforcement record',
                    'source_url'   => $entry['source_url'],
                    'action_date'  => isset($entry['action_date']) ? $entry['action_date'] : null
                ];
                break;
            }
        }
    }
}


$response = [
    'server_status' => 'ONLINE',
    'api_version' => '0.2.2',
    // Top-level duplicate + legacy nested shape: tolerant clients read
    // whichever contract version they shipped against.
    'safe_pivot_url' => $safePivotUrl,
    'monetization' => [
        'safe_pivot_url' => $safePivotUrl
    ]
];
if ($verifiedRecord !== null) {
    $response['verified_record'] = $verifiedRecord;
}


echo json_encode($response);
exit;
?>
