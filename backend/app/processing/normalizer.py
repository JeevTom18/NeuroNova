from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.schemas.records import CanonicalRecord

class Normalizer:
    """Converts heterogeneous source formats into the canonical schema."""

    @staticmethod
    def normalize(record: Dict[str, Any], source_name: str, entity_type: Optional[str] = None) -> Optional[CanonicalRecord]:
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            if source_name == "customer_source" or entity_type == "customer":
                cid = record.get("id") or record.get("cust_id")
                fname = record.get("full_name") or record.get("name") or "Unknown Customer"
                email = record.get("email_address") or record.get("contact_email") or record.get("email")
                ts = record.get("created_at") or record.get("signup_date") or now_iso
                return CanonicalRecord(
                    record_id=str(cid),
                    source=source_name,
                    entity_type="customer",
                    name=str(fname),
                    email=email,
                    timestamp=ts,
                    payload=record
                )
            elif source_name == "product_source" or entity_type == "product":
                pid = record.get("sku") or record.get("sku_id")
                pname = record.get("product_name") or record.get("title") or record.get("name") or "Unknown Product"
                ts = record.get("updated_at") or record.get("created_at") or now_iso
                return CanonicalRecord(
                    record_id=str(pid),
                    source=source_name,
                    entity_type="product",
                    name=str(pname),
                    email=None,
                    timestamp=ts,
                    payload=record
                )
            elif source_name == "transaction_source" or entity_type == "transaction":
                tid = record.get("order_id") or record.get("transaction_uuid")
                curr = record.get("currency", "USD")
                amt = record.get("amount", 0.0)
                email = record.get("customer_email") or record.get("customer_ref")
                ts = record.get("order_date") or record.get("timestamp") or now_iso
                return CanonicalRecord(
                    record_id=str(tid),
                    source=source_name,
                    entity_type="transaction",
                    name=f"Order {curr} {amt}",
                    email=email,
                    timestamp=ts,
                    payload=record
                )
            else:
                return None
        except Exception:
            return None

def normalize_batch(records: List[Dict[str, Any]], source_name: str) -> List[CanonicalRecord]:
    result = []
    for r in records:
        canonical = Normalizer.normalize(r, source_name)
        if canonical:
            result.append(canonical)
    return result
