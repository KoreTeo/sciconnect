import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from services.cache import get_redis

_memory_hits: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"


async def require_rate_limit(
    request: Request,
    action: str,
    *,
    limit: int,
    window_seconds: int,
    detail: str = "Слишком много запросов. Повторите позже.",
) -> None:
    key = f"rate:{action}:{_client_ip(request)}"
    try:
        client = await get_redis()
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, window_seconds)
        if count > limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)
        return
    except HTTPException:
        raise
    except Exception:
        now = time.monotonic()
        hits = _memory_hits[key]
        while hits and now - hits[0] > window_seconds:
            hits.popleft()
        if len(hits) >= limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)
        hits.append(now)
