"""
Sanjeevani v2 — RAG Agent
Queries ChromaDB for clinical guideline citations.
"""

from vector_db.chroma_client import get_collection


class RAGAgent:
    def __init__(self, collection_name: str = "clinical_guidelines"):
        self.collection_name = collection_name

    def query(self, query_text: str, n_results: int = 3) -> str:
        """
        Query clinical guidelines via ChromaDB.

        Args:
            query_text: Clinical query string
            n_results: Number of results to return

        Returns:
            Concatenated guideline text from top results
        """
        try:
            collection = get_collection(self.collection_name)
            results = collection.query(query_texts=[query_text], n_results=n_results)

            if results and results["documents"]:
                docs = results["documents"][0]
                metadatas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)

                citations = []
                for doc, meta in zip(docs, metadatas):
                    source = meta.get("source", "Unknown")
                    citations.append(f"[{source}] {doc}")

                return "\n\n".join(citations)

            return "No relevant guidelines found."
        except Exception as e:
            return f"RAG query failed: {str(e)}"
