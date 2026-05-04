/**
 * AMRAlerts — Matches reference: organism name, resist pills, recommend pills, citation box
 */
export default function AMRAlerts({ data }) {
  if (!data || !data.amr_detected) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">AMR Detection</span>
          <span className="badge badge-rule">RULE</span>
        </div>
        <div className="not-applicable" style={{ color: '#10b981' }}>
          {'\u2713'} No resistant organisms detected
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title red">AMR Critical Alert</span>
        <span className="badge badge-ai">AI</span>
      </div>

      {(data.alerts || []).map((alert, i) => (
        <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {/* Left: organism + pills */}
          <div className="amr-section" style={{ flex: 1 }}>
            <div className="amr-label" style={{ color: '#94a3b8' }}>Detected Organism</div>
            <div className="amr-organism-name">{alert.organism}</div>
            <div className="amr-organism-full">({alert.full_name})</div>

            <div className="amr-label red">Resistant To</div>
            <div className="amr-pills">
              {(alert.resistant_to || []).map((r, j) => (
                <span className="amr-pill resist" key={j}>{r}</span>
              ))}
            </div>

            <div className="amr-label green">Recommended Action</div>
            <div className="amr-pills">
              {(alert.recommended_antibiotics || []).map((ab, j) => (
                <span className="amr-pill recommend" key={j}>{ab.name}</span>
              ))}
            </div>
          </div>

          {/* Right: citation */}
          <div className="amr-citation" style={{ width: 280, flexShrink: 0 }}>
            <div className="amr-citation-title">
              {'\uD83D\uDCD6'} ICMR 2024 Protocol
            </div>
            <div className="amr-citation-text">
              "Empirical therapy for suspected {alert.organism} infections
              in critically ill patients should include agents with
              proven efficacy against local strains, prioritized by
              clinical severity and resistance patterns..."
            </div>
            <div className="amr-citation-link">View Full Citation</div>
          </div>
        </div>
      ))}

      {data.stewardship_recommendation && (
        <div style={{
          padding: '10px 14px', background: '#f0fdf4',
          borderRadius: 8, fontSize: '.75rem', color: '#166534',
          borderLeft: '3px solid #10b981',
        }}>
          <strong>Stewardship:</strong> {data.stewardship_recommendation}
        </div>
      )}
    </div>
  )
}
