from typing import List, Tuple, Set
from app.schemas.records import CanonicalRecord

def _dedup_key(record: CanonicalRecord) -> str:
    return f"{record.source}:{record.entity_type}:{record.record_id}"

class Deduplicator:
    """Deduplicates records based on deterministic business key: source:entity_type:record_id."""

    def __init__(self):
        self.seen_keys: Set[str] = set()
        self.unique_count: int = 0
        self.duplicate_count: int = 0

    def deduplicate(self, records: List[CanonicalRecord]) -> List[CanonicalRecord]:
        uniques: List[CanonicalRecord] = []
        for r in records:
            key = _dedup_key(r)
            if key in self.seen_keys:
                self.duplicate_count += 1
            else:
                self.seen_keys.add(key)
                uniques.append(r)
                self.unique_count += 1
        return uniques

    def merge_metrics(self, total_incoming: int) -> Tuple[int, int]:
        return len(self.seen_keys), self.duplicate_count

    @classmethod
    def static_deduplicate(cls, records: List[CanonicalRecord]) -> Tuple[List[CanonicalRecord], int, List[CanonicalRecord]]:
        seen: Set[str] = set()
        uniques = []
        dups = []
        for r in records:
            key = _dedup_key(r)
            if key in seen:
                dups.append(r)
            else:
                seen.add(key)
                uniques.append(r)
        return uniques, len(dups), dups
