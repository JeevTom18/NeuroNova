import asyncio
import random
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.ingestion.base import DataSource

class CustomerSource(DataSource):
    """Simulates ingestion from a CRM / Customer database API."""

    def __init__(self):
        super().__init__(name="customer_source", entity_type="customer")
        self.should_fail = False

    def configure_fault(self, should_fail: bool):
        self.should_fail = should_fail

    async def fetch(self, simulate_failure: bool = False) -> List[Dict[str, Any]]:
        await asyncio.sleep(random.uniform(0.15, 0.35))

        if simulate_failure or self.should_fail:
            raise Exception("Simulated connection timeout to CRM API")

        first_names = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah", "Ian", "Julia"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson"]

        records: List[Dict[str, Any]] = []
        for i in range(1, 26):
            cid = f"CUST-{(i % 20) + 1:04d}"
            fname = first_names[(i - 1) % len(first_names)]
            lname = last_names[(i - 1) % len(last_names)]
            records.append({
                "id": cid,
                "cust_id": cid,
                "full_name": f"{fname} {lname}",
                "email_address": f"{fname.lower()}.{lname.lower()}@example.com",
                "loyalty_tier": random.choice(["Bronze", "Silver", "Gold", "Platinum"]),
                "created_at": datetime.now(timezone.utc).isoformat()
            })

        return records
