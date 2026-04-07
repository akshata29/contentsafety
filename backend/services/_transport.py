"""
Custom Azure Core transport that survives transient SSL errors on Windows.

Azure LBs occasionally close TLS connections (stale sockets).  urllib3 surfaces
these as SSLError / SSLZeroReturnError / ConnectionError.  The Azure SDK wraps
them as ServiceRequestError.  We handle both via with_ssl_retry().

_NoKeepAliveAdapter:
  - max_retries=0 keeps urllib3 from swallowing SSL errors inside MaxRetryError.
  - send() overide catches the first failure, evicts the pool, retries once.

with_ssl_retry():
  - Higher-level wrapper: if the adapter's own retry ALSO fails (two stale
    sockets in a row), this retries from scratch up to 3 total attempts.
  - 0.3 s / 0.6 s back-off between attempts.
"""
import time
import urllib3
import requests
from requests.adapters import HTTPAdapter
from requests.exceptions import SSLError as RequestsSSLError
from requests.exceptions import ConnectionError as RequestsConnectionError
from azure.core.pipeline.transport import RequestsTransport

# We use verify=False against Azure's own endpoint (trusted, demo environment).
# Suppress the urllib3 InsecureRequestWarning that would otherwise flood the logs.
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

try:
    from azure.core.exceptions import ServiceRequestError as AzureRequestError
except ImportError:
    AzureRequestError = Exception  # fallback

_SSL_ERRORS = (RequestsSSLError, RequestsConnectionError, AzureRequestError)


class _NoKeepAliveAdapter(HTTPAdapter):
    def __init__(self):
        # max_retries=0: keeps urllib3 from swallowing SSLError inside MaxRetryError.
        super().__init__(max_retries=0)

    def send(self, request, **kwargs):
        try:
            return super().send(request, **kwargs)
        except _SSL_ERRORS:
            # Stale socket -- evict the whole pool and retry once with a fresh one.
            self.close()
            return super().send(request, **kwargs)


def make_transport() -> RequestsTransport:
    session = requests.Session()
    session.mount("https://", _NoKeepAliveAdapter())
    session.headers.update({"Connection": "close"})
    return RequestsTransport(session=session)


def make_requests_session() -> requests.Session:
    """Return a requests.Session with _NoKeepAliveAdapter."""
    session = requests.Session()
    session.mount("https://", _NoKeepAliveAdapter())
    session.headers.update({"Connection": "close"})
    return session


def with_ssl_retry(fn, max_attempts: int = 3):
    """
    Call fn() up to max_attempts times, sleeping briefly between retries.
    Absorbs transient SSL / connection errors on Windows.
    """
    last_exc: Exception | None = None
    for attempt in range(max_attempts):
        if attempt:
            time.sleep(0.3 * attempt)
        try:
            return fn()
        except _SSL_ERRORS as exc:
            last_exc = exc
    raise last_exc  # type: ignore[misc]


def sync_post(
    url: str,
    headers: dict,
    payload: dict,
    timeout: float = 30,
) -> tuple[int, str]:
    """
    Synchronous POST with automatic SSL-error retry.
    verify=False disables cert checking (demo / trusted Azure endpoint).
    Call from a FastAPI def route (FastAPI runs it in a thread pool).
    """
    def _call():
        with make_requests_session() as session:
            resp = session.post(url, json=payload, headers=headers, timeout=timeout, verify=False)
            return resp.status_code, resp.text

    return with_ssl_retry(_call)


def sync_patch(
    url: str,
    headers: dict,
    payload: dict,
    timeout: float = 30,
) -> tuple[int, str]:
    """Synchronous PATCH with automatic SSL-error retry."""
    def _call():
        with make_requests_session() as session:
            resp = session.patch(url, json=payload, headers=headers, timeout=timeout, verify=False)
            return resp.status_code, resp.text

    return with_ssl_retry(_call)
