/**
 * ClinicalScores — SOFA ring + 2-col organ bars + qSOFA/SIRS pills
 * Matches reference design exactly
 */
export default function ClinicalScores({ data }) {
  if (!data || data.status === 'insufficient_data') {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Clinical Scores</span>
          <span className="badge badge-rule">RULE</span>
        </div>
        <div className="not-applicable">Insufficient data for scoring</div>
      </div>
    )
  }

  const sofa = data.sofa || {}
  const qsofa = data.qsofa || {}
  const sirs = data.sirs || {}
  const summary = data.summary || {}
  const sofaTotal = sofa.total ?? 0
  const sofaClass = sofaTotal <= 3 ? 'safe' : sofaTotal <= 8 ? 'moderate' : sofaTotal <= 14 ? 'high' : 'critical'

  const radius = 42
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(sofaTotal / 24, 1)
  const dashOffset = circumference * (1 - pct)

  const barColors = {
    0: '#10b981', 1: '#0d9488', 2: '#1565c0', 3: '#e65100', 4: '#c62828',
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Clinical Scores</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-rule">RULE</span>
          {summary.sepsis_criteria_met && (
            <span className="badge badge-sepsis">SEPSIS CRITERIA MET</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
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
          <div className="quick-scores">
            <span className={`qpill ${qsofa.high_risk ? 'danger' : 'safe'}`}>
              qSOFA:{qsofa.score}
            </span>
            <span className={`qpill ${sirs.sirs_positive ? 'danger' : 'safe'}`}>
              SIRS:{sirs.criteria_count}
            </span>
          </div>
        </div>

        {/* Right: Organ bars in 2-col grid */}
        <div className="organ-grid" style={{ flex: 1 }}>
          {Object.entries(sofa.organ_scores || {}).map(([organ, score]) => (
            <div className="organ-bar" key={organ}>
              <span className="organ-name">{organ}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{
                  width: `${(score / 4) * 100}%`,
                  background: barColors[score] || '#94a3b8',
                }} />
              </div>
              <span className="bar-score">{score} / 4</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
