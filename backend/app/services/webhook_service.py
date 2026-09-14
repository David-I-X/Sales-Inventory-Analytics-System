import asyncio
import random
import logging
import httpx
from typing import Dict, Any

from app.core.webhook_security import sign_payload

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
BASE_DELAY = 2.0
MAX_JITTER = 1.0

class WebhookService:
    async def send_webhook(self, url: str, payload: Dict[str, Any], webhook_secret: str | None = None):
        """
        Envía un evento webhook mediante HTTP POST asíncrono con timeout de 10s.
        """
        headers = {}
        if webhook_secret:
            headers["X-SaaS-Signature"] = sign_payload(payload, webhook_secret)
            
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    if response.is_success:
                        logger.info(f"[WebhookService] Success sending webhook to {url} on attempt {attempt}, status {response.status_code}")
                        return
                    else:
                        response.raise_for_status()
            except Exception as e:
                if attempt == MAX_RETRIES:
                    logger.error(f"[WebhookService] Failed sending webhook to {url} after {MAX_RETRIES} attempts. Error: {e}")
                else:
                    delay = BASE_DELAY ** attempt + random.uniform(0, MAX_JITTER)
                    logger.warning(f"[WebhookService] Warning sending webhook to {url} on attempt {attempt}: {e}. Retrying in {delay:.2f}s...")
                    await asyncio.sleep(delay)

webhook_service = WebhookService()
