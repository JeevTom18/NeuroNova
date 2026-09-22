import asyncio
import random
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.ingestion.base import DataSource

class ProductSource(DataSource):
    """Simulates ingestion from an E-Commerce Product Catalog / Warehouse API."""

    def __init__(self):
        super().__init__(name="product_source", entity_type="product")
        self.should_fail = False

    def configure_fault(self, should_fail: bool):
        self.should_fail = should_fail

    async def fetch(self, simulate_failure: bool = False) -> List[Dict[str, Any]]:
        await asyncio.sleep(random.uniform(0.15, 0.35))

        if simulate_failure or self.should_fail:
            raise Exception("Simulated internal server error in Inventory Service")

        categories = ["Electronics", "Home & Kitchen", "Fashion", "Sports", "Books"]
        products = ["Smartphone", "Laptop", "Wireless Headphones", "Coffee Maker", "Desk Mat", "Backpack", "Smart Watch"]

        records: List[Dict[str, Any]] = []
        for i in range(1, 26):
            pid = f"PROD-{(i % 18) + 1:04d}"
            pname = products[(i - 1) % len(products)]
            cat = categories[(i - 1) % len(categories)]
            price = round(random.uniform(19.99, 899.99), 2)
            records.append({
                "sku": pid,
                "sku_id": pid,
                "product_name": f"{pname} {cat} Edition",
                "category": cat,
                "price": price,
                "in_stock": random.randint(5, 120),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })

        return records
