/**
 * RiskFlags — Displays all risk flags with evidence and citations
 * Each flag shows provenance badge
 */
export default function RiskFlags({ flags }) {
  if (!flags || flags.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">🚩 Risk Flags</span>
          <span className="badge-rule">RULE</span>
        </div>
        <div className="not-applicable" style={{ color: 'var(--low)' }}>
          ✓ No risk flags identified
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">🚩 Risk Flags ({flags.length})</span>
        <span className="badge-rule">RULE</span>
      </div>

      {flags.map((flag, i) => (
        <div className={`risk-flag ${flag.severity}`} key={i}>
          <div className="flag-header">
            <span className="flag-title">{flag.risk}</span>
            <span className="severity-badge">{flag.severity}</span>
          </div>

          <ul className="evidence-list">
            {(flag.evidence || []).map((ev, j) => (
              <li key={j}>{ev}</li>
            ))}
          </ul>

          {flag.guideline_citation && (
            <div className="citation">
              📖 "{flag.guideline_citation.text}" — {flag.guideline_citation.source}
            </div>
          )}

          {flag.recommended_action && (
            <div className="action">
              → {flag.recommended_action}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
