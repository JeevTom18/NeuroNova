import asyncio
import random
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.ingestion.base import DataSource

class TransactionSource(DataSource):
    """Simulates ingestion from a Payment Gateway / Transactions Stream API."""

    def __init__(self):
        super().__init__(name="transaction_source", entity_type="transaction")
        self.should_fail = False

    def configure_fault(self, should_fail: bool):
        self.should_fail = should_fail

    async def fetch(self, simulate_failure: bool = False) -> List[Dict[str, Any]]:
        await asyncio.sleep(random.uniform(0.15, 0.35))

        if simulate_failure or self.should_fail:
            raise Exception("Simulated payment gateway unreachable")

        currencies = ["USD", "EUR", "GBP", "AUD"]

        records: List[Dict[str, Any]] = []
        for i in range(1, 26):
            tid = f"TXN-{(i % 20) + 1:04d}"
            amount = round(random.uniform(15.00, 2450.00), 2)
            records.append({
                "order_id": tid,
                "transaction_uuid": tid,
                "amount": amount,
                "currency": random.choice(currencies),
                "customer_email": f"user_{(i % 15) + 1}@example.com",
                "order_date": datetime.now(timezone.utc).isoformat()
            })

        return records
