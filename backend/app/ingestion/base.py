from abc import ABC, abstractmethod
from typing import List, Dict, Any
import time

class DataSource(ABC):
    """Abstract base class for all concurrent ingestion data sources."""

    def __init__(self, name: str, entity_type: str):
        self.name = name
        self.entity_type = entity_type

    @abstractmethod
    async def fetch(self, simulate_failure: bool = False) -> List[Dict[str, Any]]:
        """
        Fetch records asynchronously from external source or mock generator.
        Should raise an exception if simulate_failure is True.
        """
        pass
