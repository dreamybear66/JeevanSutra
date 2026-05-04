/**
 * OutlierAlerts — Matches reference: big value, impossible badge, blocked banner
 */
export default function OutlierAlerts({ data }) {
  if (!data || !data.outliers_detected) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Outlier Detection</span>
          <span className="badge badge-rule">RULE</span>
        </div>
        <div className="not-applicable" style={{ color: '#10b981' }}>
          {'\u2713'} All lab values within expected ranges
        </div>
      </div>
    )
  }

  const outliers = data.outlier_details || []

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title red">Data Outlier Block</span>
        <span className="badge badge-rule">RULE</span>
      </div>

      {outliers.map((o, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 12 }}>
          {/* Left: big value */}
          <div className="outlier-section" style={{ borderLeft: '4px solid #d97706', paddingLeft: 16 }}>
            <div className="outlier-param-label">{o.parameter} ({o.parameter === 'Potassium' ? 'K+' : ''})</div>
            <div className="outlier-value-big">{o.value}</div>
          </div>

          {/* Center: badge + instruction */}
          <div style={{ flex: 1 }}>
            <div className="outlier-impossible">
              {(o.reason || 'PHYSIOLOGICALLY IMPOSSIBLE').replace(/_/g, ' ').toUpperCase()}
            </div>
            <div className="outlier-instruction">
              Verify lab sample integrity or equipment
            </div>
          </div>

          {/* Right: blocked banner */}
          <div className="outlier-blocked">
            <span className="outlier-blocked-icon">{'\uD83D\uDEAB'}</span>
            <div>
              <div className="outlier-blocked-text">
                Diagnosis blocked &mdash; verify flagged values before proceeding
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
