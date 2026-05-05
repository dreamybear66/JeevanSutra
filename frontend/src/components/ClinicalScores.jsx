/**
 * ClinicalScores — SOFA ring + organ bars + qSOFA/SIRS/AKI pills
 * Reads from: report.clinical_scores_summary.summary
 */
export default function ClinicalScores({ data }) {
  // data = { summary: { sofa_score, sofa_breakdown, qsofa_score, sirs_score, aki_stage, sepsis_criteria_met } }
  const summary = data?.summary || {}

  const sofaTotal = Number(summary.sofa_score ?? 0)
  const sofaBreakdown = summary.sofa_breakdown || {}
  const qsofaScore = Number(summary.qsofa_score ?? 0)
  const sirsScore  = Number(summary.sirs_score  ?? 0)
  const akiStage   = Number(summary.aki_stage   ?? 0)
  const sepsis     = !!summary.sepsis_criteria_met

  const sofaClass = sofaTotal <= 3 ? 'safe' : sofaTotal <= 8 ? 'moderate' : sofaTotal <= 14 ? 'high' : 'critical'

  const radius = 42
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(sofaTotal / 24, 1)
  const dashOffset = circumference * (1 - pct)

  const barColors = { 0: '#10b981', 1: '#0d9488', 2: '#1565c0', 3: '#e65100', 4: '#c62828' }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Clinical Scores</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-rule">RULE</span>
          {sepsis && <span className="badge badge-sepsis">SEPSIS CRITERIA MET</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Left: SOFA Ring + Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="sofa-ring-wrap">
            <svg viewBox="0 0 100 100" width="110" height="110">
              <circle className="sofa-ring-bg" cx="50" cy="50" r={radius} />
              <circle
                className={`sofa-ring-fill ${sofaClass}`}
                cx="50" cy="50" r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className={`sofa-ring-center ${sofaClass}`}>
              <span className="score">{sofaTotal}</span>
              <span className="label">SOFA</span>
            </div>
          </div>

          <div className="quick-scores" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className={`qpill ${qsofaScore >= 2 ? 'danger' : 'safe'}`}>qSOFA: {qsofaScore}/3</span>
            <span className={`qpill ${sirsScore >= 2 ? 'danger' : 'safe'}`}>SIRS: {sirsScore}/4</span>
            {akiStage > 0 && <span className="qpill danger">AKI Stage {akiStage}</span>}
          </div>
        </div>

        {/* Right: Organ bars */}
        <div className="organ-grid" style={{ flex: 1, minWidth: 180 }}>
          {Object.keys(sofaBreakdown).length > 0
            ? Object.entries(sofaBreakdown).map(([organ, score]) => (
                <div className="organ-bar" key={organ}>
                  <span className="organ-name" style={{ textTransform: 'capitalize' }}>{organ}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(Number(score) / 4) * 100}%`, background: barColors[Number(score)] || '#94a3b8' }} />
                  </div>
                  <span className="bar-score">{score}/4</span>
                </div>
              ))
            : (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '12px 0' }}>
                No organ breakdown available
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
