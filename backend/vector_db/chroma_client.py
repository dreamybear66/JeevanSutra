"""
Sanjeevani v2 — ChromaDB Client
"""

import chromadb
from settings import get_settings
from functools import lru_cache


@lru_cache()
def get_chroma_client() -> chromadb.PersistentClient:
    """Returns a cached ChromaDB persistent client."""
    settings = get_settings()
    return chromadb.PersistentClient(path=settings.chroma_persist_dir)


def get_collection(name: str = "clinical_guidelines"):
    """Get or create a ChromaDB collection."""
    client = get_chroma_client()
    return client.get_or_create_collection(name=name)
