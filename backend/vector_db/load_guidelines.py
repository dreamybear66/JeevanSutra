"""
Sanjeevani v2 — Load Guidelines into ChromaDB
Run this script once to populate the vector DB with clinical guidelines.
Usage: python -m vector_db.load_guidelines
"""

from vector_db.chroma_client import get_collection


# WHO/ICMR AMR guidelines + Sepsis management guidelines
GUIDELINES = [
    {
        "id": "sepsis-3-def",
        "text": "Sepsis is defined as life-threatening organ dysfunction caused by a dysregulated host response to infection. Organ dysfunction is identified as an acute change in total SOFA score ≥2 points consequent to the infection. Septic shock is a subset with circulatory and cellular/metabolic dysfunction associated with a higher risk of mortality, identified by vasopressor requirement to maintain MAP ≥65 mmHg and serum lactate >2 mmol/L.",
        "source": "Sepsis-3 Consensus Definitions (JAMA 2016)"
    },
    {
        "id": "qsofa-bedside",
        "text": "qSOFA (quick SOFA) is a bedside screening tool: respiratory rate ≥22/min, altered mentation (GCS <15), systolic blood pressure ≤100 mmHg. A qSOFA score ≥2 identifies patients at risk for poor outcomes and should prompt clinicians to investigate for organ dysfunction, increase monitoring, and consider referral to ICU.",
        "source": "Sepsis-3 Consensus (JAMA 2016)"
    },
    {
        "id": "mrsa-treatment",
        "text": "MRSA (Methicillin-Resistant Staphylococcus Aureus): First-line treatment is IV vancomycin (15-20 mg/kg every 8-12h, targeting trough 15-20 mcg/mL). Alternatives include linezolid 600mg IV/PO q12h, daptomycin 6-10 mg/kg IV daily for bloodstream infections. Duration depends on source: uncomplicated bacteremia 2 weeks, endocarditis 6 weeks.",
        "source": "IDSA MRSA Guidelines 2023"
    },
    {
        "id": "esbl-treatment",
        "text": "ESBL-producing Enterobacteriaceae: Carbapenems (meropenem, imipenem, ertapenem) are the treatment of choice for serious ESBL infections. Piperacillin-tazobactam may be considered for non-severe urinary tract infections. Avoid cephalosporins even if in-vitro susceptibility is reported.",
        "source": "ICMR Antibiotic Policy 2024"
    },
    {
        "id": "cre-treatment",
        "text": "Carbapenem-Resistant Enterobacteriaceae (CRE): Treatment options include colistin (polymyxin E), polymyxin B, ceftazidime-avibactam, meropenem-vaborbactam. Combination therapy is recommended for severe infections. Consult infectious disease specialist. Strict contact precautions required.",
        "source": "WHO Priority Pathogens List / ICMR 2024"
    },
    {
        "id": "vre-treatment",
        "text": "Vancomycin-Resistant Enterococci (VRE): Linezolid 600mg IV/PO q12h or daptomycin 8-12 mg/kg IV daily. Duration 7-14 days for bacteremia. Monitor for thrombocytopenia with linezolid (weekly CBC). Contact precautions required.",
        "source": "IDSA VRE Guidelines"
    },
    {
        "id": "aki-kdigo",
        "text": "KDIGO AKI Staging: Stage 1 — creatinine 1.5-1.9x baseline OR ≥0.3 mg/dL increase within 48h. Stage 2 — creatinine 2.0-2.9x baseline. Stage 3 — creatinine ≥3x baseline OR ≥4.0 mg/dL OR initiation of RRT. Management: optimize volume status, avoid nephrotoxins, adjust drug dosing.",
        "source": "KDIGO AKI Guidelines 2024"
    },
    {
        "id": "vent-weaning",
        "text": "Ventilator weaning readiness criteria: RSBI (Rapid Shallow Breathing Index = RR/TV) <105, adequate oxygenation (SpO2/FiO2 >150), PEEP ≤8 cmH2O, adequate consciousness (GCS ≥8), hemodynamic stability (MAP >65, no vasopressors). Daily spontaneous breathing trials (SBT) recommended for patients meeting readiness criteria.",
        "source": "ATS/ACCP Ventilator Weaning Guidelines"
    },
    {
        "id": "acinetobacter-mdr",
        "text": "MDR Acinetobacter baumannii: Colistin-based combination therapy is recommended. Options: colistin + high-dose ampicillin-sulbactam, colistin + meropenem (if MIC ≤8), or tigecycline for non-bloodstream infections. Inhaled colistin for VAP. Strict infection control with contact precautions.",
        "source": "ICMR Treatment Guidelines 2024"
    },
    {
        "id": "sofa-organ-failure",
        "text": "SOFA score interpretation: Each organ system (respiratory, coagulation, liver, cardiovascular, CNS, renal) scored 0-4. Total score 0-24. Individual organ score ≥3 indicates organ failure. An increase in SOFA score ≥2 from baseline suggests sepsis-related organ dysfunction. SOFA >11 associated with >90% mortality.",
        "source": "Vincent et al., Critical Care Medicine"
    },
]


def load_guidelines():
    """Load all guidelines into ChromaDB."""
    collection = get_collection("clinical_guidelines")

    ids = [g["id"] for g in GUIDELINES]
    documents = [g["text"] for g in GUIDELINES]
    metadatas = [{"source": g["source"]} for g in GUIDELINES]

    collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
    print(f"Loaded {len(GUIDELINES)} guidelines into ChromaDB")


if __name__ == "__main__":
    load_guidelines()
