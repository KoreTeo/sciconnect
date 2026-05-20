import json
from typing import Optional

import redis.asyncio as redis

from config import settings

_redis: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def cache_get(key: str) -> Optional[str]:
    try:
        client = await get_redis()
        return await client.get(key)
    except Exception:
        return None


async def cache_set(key: str, value: str, ttl: int = 60) -> None:
    try:
        client = await get_redis()
        await client.setex(key, ttl, value)
    except Exception:
        pass


async def cache_delete(key: str) -> None:
    try:
        client = await get_redis()
        await client.delete(key)
    except Exception:
        pass


async def cache_delete_pattern(prefix: str) -> None:
    try:
        client = await get_redis()
        batch = []
        async for key in client.scan_iter(match=f"{prefix}*", count=100):
            batch.append(key)
            if len(batch) >= 100:
                await client.delete(*batch)
                batch.clear()
        if batch:
            await client.delete(*batch)
    except Exception:
        pass
