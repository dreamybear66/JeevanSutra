"""
Sanjeevani v2 — Ventilator Weaning Readiness Score (VWRS)
5 parameter checks, all thresholds from clinical_rules.yaml. No LLM.
"""

from dataclasses import dataclass
from config.config_loader import get_clinical_rules, get_rule_version


@dataclass
class VWRSResult:
    overall: str                        # "READY" | "BORDERLINE" | "NOT_READY"
    score: int                          # 0-5 (count of READY parameters)
    parameter_results: dict[str, dict]  # per-param status + value + threshold
    blocking_reasons: list[str]
    rule_version: str


class VWRSEngine:
    def __init__(self):
        config = get_clinical_rules()
        self.vc = config["vwrs"]

    def _check_param(self, name: str, value: float, threshold: float,
                     lower_is_ready: bool, tolerance: float) -> dict:
        """Check a single VWRS parameter."""
        borderline_range = threshold * tolerance

        if lower_is_ready:
            if value < threshold:
                status = "READY"
            elif value < threshold + borderline_range:
                status = "BORDERLINE"
            else:
                status = "NOT_READY"
        else:
            if value > threshold:
                status = "READY"
            elif value > threshold - borderline_range:
                status = "BORDERLINE"
            else:
                status = "NOT_READY"

        return {"status": status, "value": value, "threshold": threshold}

    def evaluate(self, vitals: dict) -> VWRSResult:
        """
        Evaluate ventilator weaning readiness.

        Args:
            vitals: {
                "respiratory_rate": 18, "tidal_volume": 0.5,  # for RSBI
                "spo2": 96, "fio2": 0.4,                      # for SpO2/FiO2
                "peep": 6, "gcs": 12, "map": 70,
                "on_vasopressors": False
            }
        """
        rule_version = get_rule_version()
        tolerance = self.vc["borderline_tolerance"]
        results = {}
        blocking = []

        # 1. RSBI = Respiratory Rate / Tidal Volume (in L)
        rr = vitals.get("respiratory_rate", 0)
        tv = vitals.get("tidal_volume", 0.5)
        rsbi = rr / tv if tv > 0 else 999
        results["rsbi"] = self._check_param("rsbi", rsbi, self.vc["rsbi_threshold"], True, tolerance)
        if results["rsbi"]["status"] == "NOT_READY":
            blocking.append(f"RSBI too high ({rsbi:.0f} > {self.vc['rsbi_threshold']})")

        # 2. SpO2/FiO2 ratio
        spo2 = vitals.get("spo2", 95)
        fio2 = vitals.get("fio2", 0.21)
        spo2_fio2 = spo2 / fio2 if fio2 > 0 else 0
        results["spo2_fio2"] = self._check_param("spo2_fio2", spo2_fio2, self.vc["spo2_fio2_threshold"], False, tolerance)
        if results["spo2_fio2"]["status"] == "NOT_READY":
            blocking.append(f"SpO2/FiO2 too low ({spo2_fio2:.0f} < 130)")

        # 3. PEEP
        peep = vitals.get("peep", 5)
        results["peep"] = self._check_param("peep", peep, self.vc["peep_threshold"], True, tolerance)
        if results["peep"]["status"] == "NOT_READY":
            blocking.append(f"PEEP too high ({peep} > {self.vc['peep_threshold']})")

        # 4. GCS
        gcs = vitals.get("gcs", 15)
        results["gcs"] = self._check_param("gcs", gcs, self.vc["gcs_threshold"], False, tolerance)
        if results["gcs"]["status"] == "NOT_READY":
            blocking.append(f"GCS too low ({gcs} < 6)")

        # 5. MAP (no vasopressors)
        map_val = vitals.get("map", 70)
        on_vaso = vitals.get("on_vasopressors", False)
        if on_vaso:
            results["map"] = {"status": "NOT_READY", "value": map_val, "threshold": self.vc["map_threshold"]}
            blocking.append("Patient on vasopressors")
        else:
            results["map"] = self._check_param("map", map_val, self.vc["map_threshold"], False, tolerance)
            if results["map"]["status"] == "NOT_READY":
                blocking.append(f"MAP too low ({map_val} < 60)")

        # Overall determination
        statuses = [r["status"] for r in results.values()]
        ready_count = statuses.count("READY")

        if all(s == "READY" for s in statuses):
            overall = "READY"
        elif any(s == "NOT_READY" for s in statuses):
            overall = "NOT_READY"
        else:
            overall = "BORDERLINE"

        return VWRSResult(
            overall=overall,
            score=ready_count,
            parameter_results=results,
            blocking_reasons=blocking,
            rule_version=rule_version,
        )
