/**
 * apiFetch - thin wrapper around fetch() that deduplicates concurrent GET
 * requests to the same URL.  If two components mount simultaneously and both
 * request /api/content-filters/deployments, only one HTTP round-trip is made;
 * both callers receive the same Promise and therefore the same response clone.
 *
 * POST / PUT / DELETE requests are always passed through unmodified.
 */

const _inflight = new Map()

export function apiFetch(url, options) {
  const method = (options && options.method) ? options.method.toUpperCase() : 'GET'

  // Only deduplicate read-only requests that carry no body
  if (method !== 'GET') {
    return fetch(url, options)
  }

  if (_inflight.has(url)) {
    // Return a new Response by cloning the shared one so each caller can read the body
    return _inflight.get(url).then(r => r.clone())
  }

  const p = fetch(url, options).finally(() => _inflight.delete(url))
  _inflight.set(url, p)
  return p
}
