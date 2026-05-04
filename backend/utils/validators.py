"""
Sanjeevani v2 — Post-Validation Utilities
Catches LLM contradicting rule engine outputs.
"""

import re


def validate_narrative(narrative: str, rule_facts: dict) -> list[str]:
    """
    Check if LLM narrative contradicts rule engine facts.
    Returns list of contradiction descriptions.
    """
    contradictions = []

    # Check SOFA score
    sofa = rule_facts.get("sofa", {})
    sofa_total = sofa.get("total")
    if sofa_total is not None:
        # Look for "SOFA score of X" or "SOFA: X" in narrative
        sofa_mentions = re.findall(r'SOFA\s*(?:score\s*(?:of|is|=|:))?\s*(\d+)', narrative, re.IGNORECASE)
        for mentioned in sofa_mentions:
            if int(mentioned) != sofa_total:
                contradictions.append(
                    f"LLM said SOFA={mentioned}, rule engine computed SOFA={sofa_total}"
                )

    # Check qSOFA
    qsofa = rule_facts.get("qsofa", {})
    qsofa_total = qsofa.get("total")
    if qsofa_total is not None:
        qsofa_mentions = re.findall(r'qSOFA\s*(?:score\s*(?:of|is|=|:))?\s*(\d+)', narrative, re.IGNORECASE)
        for mentioned in qsofa_mentions:
            if int(mentioned) != qsofa_total:
                contradictions.append(
                    f"LLM said qSOFA={mentioned}, rule engine computed qSOFA={qsofa_total}"
                )

    # Check outlier contradictions
    outliers = rule_facts.get("outliers", [])
    for outlier in outliers:
        if outlier.get("is_outlier"):
            param = outlier.get("parameter", "")
            if f"{param} is normal" in narrative.lower() or f"{param} within normal" in narrative.lower():
                contradictions.append(
                    f"LLM said {param} is normal, but rule engine flagged it as outlier"
                )

    # Check VWRS
    vwrs = rule_facts.get("vwrs")
    if vwrs:
        status = vwrs.get("overall", "")
        if status == "NOT_READY" and "ready for weaning" in narrative.lower():
            contradictions.append("LLM suggested ready for weaning, but VWRS status is NOT_READY")
        elif status == "READY" and "not ready for weaning" in narrative.lower():
            contradictions.append("LLM said not ready for weaning, but VWRS status is READY")

    return contradictions
