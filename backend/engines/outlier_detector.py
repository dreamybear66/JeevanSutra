"""
Sanjeevani v2 — Outlier Detector Engine
Pure math + config lookup. No LLM.

Detects anomalous lab values using:
1. Physiological bounds check (is value physically possible?)
2. Z-score check (statistical deviation from 72h rolling window)
3. Consensus check (consistent history + sudden deviation)
"""

import numpy as np
from dataclasses import dataclass, field
from config.config_loader import get_clinical_rules, get_rule_version


@dataclass
class OutlierResult:
    parameter: str
    value: float
    is_outlier: bool
    reason: str              # "physiologically_impossible" | "statistical_outlier" | "consensus_violation"
    confidence: float        # 0-1
    z_score: float | None
    bounds: tuple[float, float]
    action: str              # "flag_for_redraw" | "accept" | "review"
    rule_version: str


class OutlierDetector:
    def __init__(self):
        config = get_clinical_rules()
        self.outlier_config = config["outlier"]
        self.z_threshold = self.outlier_config["z_score_threshold"]
        self.min_history = self.outlier_config["min_history_points"]
        self.bounds = self.outlier_config["physiological_bounds"]

    def detect(self, param: str, new_value: float, history: list[dict]) -> OutlierResult:
        """
        Detect if a single lab value is an outlier.

        Args:
            param: Parameter name (e.g., 'potassium', 'creatinine')
            new_value: The new lab value to check
            history: List of dicts with 'value' and 'recorded_at' keys (last 72h)

        Returns:
            OutlierResult with detection details
        """
        rule_version = get_rule_version()

        # Step 1: Physiological bounds check
        if param in self.bounds:
            bound = self.bounds[param]
            low, high = bound["min"], bound["max"]
            if new_value < low or new_value > high:
                return OutlierResult(
                    parameter=param,
                    value=new_value,
                    is_outlier=True,
                    reason="physiologically_impossible",
                    confidence=1.0,
                    z_score=None,
                    bounds=(low, high),
                    action="flag_for_redraw",
                    rule_version=rule_version,
                )
        else:
            low, high = 0.0, 999999.0

        # Step 2: Z-score check (need enough history)
        history_values = [h["value"] for h in history if h.get("value") is not None]

        if len(history_values) < self.min_history:
            # Not enough history — accept but note
            return OutlierResult(
                parameter=param,
                value=new_value,
                is_outlier=False,
                reason="",
                confidence=0.0,
                z_score=None,
                bounds=(low, high),
                action="accept",
                rule_version=rule_version,
            )

        mean = np.mean(history_values)
        std = np.std(history_values)

        if std == 0:
            # All prior values identical — any change is suspicious
            z_score = float("inf") if new_value != mean else 0.0
        else:
            z_score = abs((new_value - mean) / std)

        # Step 3: Consensus check
        # If history is very consistent (std < 10% of mean) and z > threshold
        is_consistent = std < (0.1 * abs(mean)) if mean != 0 else std < 0.1

        if z_score > self.z_threshold:
            if is_consistent:
                return OutlierResult(
                    parameter=param,
                    value=new_value,
                    is_outlier=True,
                    reason="consensus_violation",
                    confidence=min(z_score / (self.z_threshold * 2), 1.0),
                    z_score=round(z_score, 2),
                    bounds=(low, high),
                    action="flag_for_redraw",
                    rule_version=rule_version,
                )
            else:
                return OutlierResult(
                    parameter=param,
                    value=new_value,
                    is_outlier=True,
                    reason="statistical_outlier",
                    confidence=min(z_score / (self.z_threshold * 2), 1.0),
                    z_score=round(z_score, 2),
                    bounds=(low, high),
                    action="review",
                    rule_version=rule_version,
                )

        # Passed all checks
        return OutlierResult(
            parameter=param,
            value=new_value,
            is_outlier=False,
            reason="",
            confidence=0.0,
            z_score=round(z_score, 2),
            bounds=(low, high),
            action="accept",
            rule_version=rule_version,
        )

    def detect_all(self, new_labs: dict, history: dict[str, list[dict]]) -> list[OutlierResult]:
        """
        Detect outliers for all lab values at once.

        Args:
            new_labs: Dict of {parameter_name: value}
            history: Dict of {parameter_name: [list of history dicts]}

        Returns:
            List of OutlierResult for each parameter
        """
        results = []
        for param, value in new_labs.items():
            param_history = history.get(param, [])
            result = self.detect(param, value, param_history)
            results.append(result)
        return results
