"""
Sanjeevani v2 — De-identification Utility
Strips PII from text before sending to external LLM (Gemini).
Ensures no patient-identifiable data leaves the system.
"""

import re
from typing import Tuple

# Patterns to redact
PII_PATTERNS = [
    # Names (Indian name patterns)
    (r'\b(?:Mr|Mrs|Ms|Dr|Shri|Smt)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}', '[REDACTED_NAME]'),

    # Aadhaar number (12 digits)
    (r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[REDACTED_AADHAAR]'),

    # Phone numbers (Indian)
    (r'\b(?:\+91[\-\s]?)?[6-9]\d{9}\b', '[REDACTED_PHONE]'),

    # Email
    (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED_EMAIL]'),

    # Dates of birth (common formats)
    (r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', '[REDACTED_DATE]'),

    # Hospital/bed IDs that could be identifying
    (r'\b(?:MRN|MR#|Patient ID|Reg No)[:\s]*[A-Z0-9-]+\b', '[REDACTED_ID]'),

    # IP addresses
    (r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '[REDACTED_IP]'),

    # UUIDs (patient_id etc.)
    (r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', '[REDACTED_UUID]'),

    # Addresses (basic pattern)
    (r'\b\d+\s+[A-Z][a-z]+\s+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Nagar|Colony|Sector)\b', '[REDACTED_ADDRESS]'),
]


def deidentify(text: str) -> Tuple[str, int]:
    """
    Remove PII from text before sending to external LLM.

    Args:
        text: Raw clinical text potentially containing PII

    Returns:
        Tuple of (sanitized_text, number_of_redactions)
    """
    if not text:
        return text, 0

    sanitized = text
    total_redactions = 0

    for pattern, replacement in PII_PATTERNS:
        matches = re.findall(pattern, sanitized, re.IGNORECASE)
        total_redactions += len(matches)
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

    return sanitized, total_redactions


def deidentify_dict(data: dict, fields_to_clean: list[str]) -> dict:
    """
    De-identify specific fields in a dictionary.

    Args:
        data: Dict containing clinical data
        fields_to_clean: List of keys whose values should be de-identified

    Returns:
        Dict with specified fields sanitized
    """
    cleaned = data.copy()
    for field in fields_to_clean:
        if field in cleaned and isinstance(cleaned[field], str):
            cleaned[field], _ = deidentify(cleaned[field])
    return cleaned
