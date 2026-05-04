"""
Sanjeevani v2 — Clinical Scoring Engine
Computes SOFA, qSOFA, SIRS, and AKI scores.
All thresholds from clinical_rules.yaml. No LLM.
"""

from dataclasses import dataclass
from config.config_loader import get_clinical_rules, get_rule_version


@dataclass
class SOFAResult:
    total: int
    organ_scores: dict[str, int]
    sepsis_criteria_met: bool
    organ_failures: list[str]
    rule_version: str

@dataclass
class qSOFAResult:
    total: int
    high_risk: bool
    criteria: dict[str, bool]
    rule_version: str

@dataclass
class SIRSResult:
    total: int
    criteria_met: bool
    criteria: dict[str, bool]
    rule_version: str

@dataclass
class AKIResult:
    stage: int
    trigger: str
    details: str
    rule_version: str


class ClinicalScoring:
    def __init__(self):
        self.config = get_clinical_rules()

    def _score_range(self, value: float, ranges: list[dict]) -> int:
        for r in ranges:
            if "min" in r and "max" in r:
                if r["min"] <= value < r["max"]:
                    return r["score"]
        return ranges[-1]["score"] if ranges else 0

    def compute_sofa(self, labs: dict, vitals: dict, baseline_sofa: int = 0) -> SOFAResult:
        rule_version = get_rule_version()
        sofa_config = self.config["sofa"]
        organ_scores = {}

        # Respiratory
        pf = labs.get("pao2_fio2")
        organ_scores["respiratory"] = self._score_range(pf, sofa_config["respiratory"]) if pf else 0

        # Coagulation
        plt = labs.get("platelets")
        organ_scores["coagulation"] = self._score_range(plt, sofa_config["coagulation"]) if plt else 0

        # Liver
        bil = labs.get("bilirubin")
        organ_scores["liver"] = self._score_range(bil, sofa_config["liver"]) if bil else 0

        # CNS
        gcs = vitals.get("gcs")
        organ_scores["cns"] = self._score_range(gcs, sofa_config["cns"]) if gcs else 0

        # Renal
        cr = labs.get("creatinine")
        organ_scores["renal"] = self._score_range(cr, sofa_config["renal"]) if cr else 0

        # Cardiovascular
        on_vaso = vitals.get("on_vasopressors", False)
        map_val = vitals.get("map", 70)
        dose = vitals.get("vasopressor_dose", 0)
        if on_vaso:
            organ_scores["cardiovascular"] = 4 if dose > 15 else (3 if dose > 5 else 2)
        else:
            organ_scores["cardiovascular"] = 0 if map_val >= 70 else 1

        total = sum(organ_scores.values())
        return SOFAResult(
            total=total,
            organ_scores=organ_scores,
            sepsis_criteria_met=(total - baseline_sofa >= 2),
            organ_failures=[o for o, s in organ_scores.items() if s >= 3],
            rule_version=rule_version,
        )

    def compute_qsofa(self, vitals: dict) -> qSOFAResult:
        rule_version = get_rule_version()
        qc = self.config["qsofa"]
        criteria = {
            "respiratory_rate": vitals.get("respiratory_rate", 0) >= qc["respiratory_rate_threshold"],
            "systolic_bp": vitals.get("systolic_bp", 120) <= qc["systolic_bp_threshold"],
            "altered_mentation": vitals.get("gcs", 15) < qc["gcs_threshold"],
        }
        total = sum(1 for v in criteria.values() if v)
        return qSOFAResult(total=total, high_risk=(total >= 2), criteria=criteria, rule_version=rule_version)

    def compute_sirs(self, vitals: dict, labs: dict) -> SIRSResult:
        rule_version = get_rule_version()
        sc = self.config["sirs"]
        temp = vitals.get("temperature")
        hr = vitals.get("heart_rate")
        rr = vitals.get("respiratory_rate")
        paco2 = labs.get("paco2")
        wbc = labs.get("wbc")

        criteria = {
            "temperature": (temp > sc["temp_high"] or temp < sc["temp_low"]) if temp else False,
            "heart_rate": hr > sc["heart_rate"] if hr else False,
            "respiratory": (rr > sc["respiratory_rate"] if rr else False) or (paco2 < sc["paco2"] if paco2 else False),
            "wbc": (wbc > sc["wbc_high"] or wbc < sc["wbc_low"]) if wbc else False,
        }
        total = sum(1 for v in criteria.values() if v)
        return SIRSResult(total=total, criteria_met=(total >= 2), criteria=criteria, rule_version=rule_version)

    def detect_aki(self, creatinine_history: list[dict]) -> AKIResult:
        rule_version = get_rule_version()
        ac = self.config["aki"]

        if len(creatinine_history) < 2:
            return AKIResult(stage=0, trigger="none", details="Insufficient data", rule_version=rule_version)

        current = creatinine_history[-1]["value"]
        baseline = min(h["value"] for h in creatinine_history)
        prev = creatinine_history[-2]["value"]
        rise = current - prev
        factor = current / baseline if baseline > 0 else 0

        stage, trigger, details = 0, "none", ""
        if rise >= ac["creatinine_rise_48h"] or factor >= ac["creatinine_factor_7d"]:
            stage, trigger = 1, "creatinine_48h" if rise >= ac["creatinine_rise_48h"] else "creatinine_7d"
            details = f"Rise: {rise:.1f}, Factor: {factor:.1f}x"
        if factor >= ac["stage_2_factor"]:
            stage, trigger, details = 2, "creatinine_7d", f"Factor: {factor:.1f}x (≥2x)"
        if factor >= ac["stage_3_factor"] or current >= ac["stage_3_absolute"]:
            stage, trigger, details = 3, "creatinine_7d", f"Factor: {factor:.1f}x or ≥{ac['stage_3_absolute']}"

        return AKIResult(stage=stage, trigger=trigger, details=details, rule_version=rule_version)
