"""
Sanjeevani v2 — PDF Export Utility
Generates diagnostic report PDFs with rule engine sections and provenance badges.
"""

from fpdf import FPDF
from datetime import datetime


class ReportPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 10, "Sanjeevani v2 - Diagnostic Risk Report", ln=True, align="C")
        self.set_font("Helvetica", "", 8)
        self.cell(0, 5, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True, align="C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def _badge(self, badge_type: str):
        if badge_type == "RULE":
            self.set_fill_color(37, 99, 235)  # Blue
        else:
            self.set_fill_color(124, 58, 237)  # Purple
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 7)
        self.cell(15, 5, badge_type, fill=True, align="C")
        self.set_text_color(0, 0, 0)
        self.cell(2)

    def _section_title(self, title: str, badge: str = "RULE"):
        self.set_font("Helvetica", "B", 12)
        self._badge(badge)
        self.cell(0, 8, title, ln=True)
        self.ln(2)

    def _key_value(self, key: str, value: str):
        self.set_font("Helvetica", "B", 9)
        self.cell(55, 6, key + ":")
        self.set_font("Helvetica", "", 9)
        self.cell(0, 6, str(value), ln=True)


def generate_report_pdf(report: dict, patient: dict) -> bytes:
    """
    Generate a PDF from a diagnostic report.

    Args:
        report: Full report dict with rule_facts and ai_narrative
        patient: Patient record dict

    Returns:
        PDF file as bytes
    """
    pdf = ReportPDF()
    pdf.alias_nb_pages()
    pdf.add_page()

    # ── Patient Info ──
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "Patient Information", ln=True)
    pdf.ln(2)
    pdf._key_value("Name", patient.get("name", "Unknown"))
    pdf._key_value("Patient ID", patient.get("patient_id", ""))
    pdf._key_value("Bed", patient.get("bed_number", "N/A"))
    pdf._key_value("Status", patient.get("status", "admitted"))
    pdf.ln(5)

    rule_facts = report.get("rule_facts", {})

    # ── SOFA Score ──
    sofa = rule_facts.get("sofa", {})
    if sofa:
        pdf._section_title("SOFA Score", "RULE")
        pdf._key_value("Total Score", f"{sofa.get('total', 'N/A')} / 24")
        pdf._key_value("Sepsis Criteria Met", str(sofa.get("sepsis_criteria_met", False)))
        organs = sofa.get("organ_scores", {})
        for organ, score in organs.items():
            marker = " ⚠" if score >= 3 else ""
            pdf._key_value(f"  {organ.capitalize()}", f"{score}/4{marker}")
        failures = sofa.get("organ_failures", [])
        if failures:
            pdf._key_value("Organ Failures", ", ".join(failures))
        pdf.ln(3)

    # ── qSOFA ──
    qsofa = rule_facts.get("qsofa", {})
    if qsofa:
        pdf._section_title("qSOFA Score", "RULE")
        pdf._key_value("Score", f"{qsofa.get('total', 0)} / 3")
        pdf._key_value("High Risk", str(qsofa.get("high_risk", False)))
        pdf.ln(3)

    # ── SIRS ──
    sirs = rule_facts.get("sirs", {})
    if sirs:
        pdf._section_title("SIRS Criteria", "RULE")
        pdf._key_value("Criteria Met", f"{sirs.get('total', 0)} / 4")
        pdf.ln(3)

    # ── AKI ──
    aki = rule_facts.get("aki", {})
    if aki and aki.get("stage", 0) > 0:
        pdf._section_title("AKI (KDIGO)", "RULE")
        pdf._key_value("Stage", str(aki.get("stage", 0)))
        pdf._key_value("Trigger", aki.get("trigger", ""))
        pdf._key_value("Details", aki.get("details", ""))
        pdf.ln(3)

    # ── VWRS ──
    vwrs = rule_facts.get("vwrs")
    if vwrs:
        pdf._section_title("Ventilator Weaning Readiness", "RULE")
        status = vwrs.get("overall", "N/A")
        pdf._key_value("Status", status)
        pdf._key_value("Readiness Score", f"{vwrs.get('score', 0)} / 5")
        blocking = vwrs.get("blocking_reasons", [])
        if blocking:
            pdf._key_value("Blocking", "; ".join(blocking))
        pdf.ln(3)

    # ── AMR Alerts ──
    amr_list = rule_facts.get("amr", [])
    if amr_list:
        pdf._section_title("AMR Alerts", "RULE")
        for alert in amr_list:
            pdf._key_value("Organism", f"{alert.get('organism', '')} [{alert.get('severity', '')}]")
            pdf._key_value("Resistant To", ", ".join(alert.get("resistant_to", [])))
            pdf._key_value("Recommended", ", ".join(alert.get("recommended", [])))
            pdf.ln(2)
        pdf.ln(3)

    # ── Outlier Alerts ──
    outliers = [o for o in rule_facts.get("outliers", []) if o.get("is_outlier")]
    if outliers:
        pdf._section_title("Outlier Alerts", "RULE")
        for o in outliers:
            pdf._key_value(o.get("parameter", ""), f"{o.get('value', '')} — {o.get('reason', '')}")
            pdf._key_value("  Action", o.get("action", ""))
        pdf.ln(3)

    # ── AI Narrative ──
    narrative = report.get("ai_narrative", "")
    if narrative:
        pdf._section_title("Clinical Narrative", "AI")
        pdf.set_font("Helvetica", "", 9)
        pdf.multi_cell(0, 5, narrative)
        pdf.ln(3)

    # ── Diagnosis Blocked Warning ──
    if report.get("diagnosis_blocked"):
        pdf.ln(5)
        pdf.set_fill_color(239, 68, 68)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 8, "  DIAGNOSIS BLOCKED: Outlier values detected. Verify lab results.", fill=True, ln=True)
        pdf.set_text_color(0, 0, 0)

    # ── Footer: Rule Version ──
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 7)
    pdf.cell(0, 5, f"Rule Engine Version: {report.get('rule_version', 'unknown')}", ln=True, align="R")

    return pdf.output()
