"""Обёртка для ручного запуска: docker compose exec backend python seed_demo.py"""
import asyncio
import logging
import sys

sys.path.insert(0, "/app")

from seed_demo import seed_demo

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_demo())
