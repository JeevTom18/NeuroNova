from typing import Tuple, Optional, List
from app.schemas.records import CanonicalRecord

VALID_ENTITY_TYPES = {"customer", "product", "transaction"}

class Validator:
    """Validates canonical records for required fields and value sanity."""

    @staticmethod
    def validate(record: CanonicalRecord) -> Tuple[bool, Optional[str]]:
        if not record.record_id or record.record_id.strip() == "" or record.record_id == "None":
            return False, "Missing or blank record_id"

        if not record.source or record.source.strip() == "":
            return False, "Missing source identifier"

        if not record.entity_type or record.entity_type not in VALID_ENTITY_TYPES:
            return False, f"Invalid entity_type identifier: {record.entity_type}"

        if not record.timestamp:
            return False, "Missing timestamp"

        return True, None

def validate_batch(records: List[CanonicalRecord]) -> Tuple[List[CanonicalRecord], List[Tuple[CanonicalRecord, str]]]:
    valid: List[CanonicalRecord] = []
    invalid: List[Tuple[CanonicalRecord, str]] = []

    for r in records:
        ok, err = Validator.validate(r)
        if ok:
            valid.append(r)
        else:
            invalid.append((r, err or "Validation failed"))
    return valid, invalid
