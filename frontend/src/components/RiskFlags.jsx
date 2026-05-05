/**
 * RiskFlags — Displays all risk flags
 * Backend sends: [{ level, label, detail }]
 * (NOT: risk, severity, evidence — those are old field names)
 */
const LEVEL_MAP = {
  critical: { bg: '#fee2e2', border: '#ef4444', badge: '#ef4444', text: '#7f1d1d' },
  high:     { bg: '#fef3c7', border: '#f59e0b', badge: '#f59e0b', text: '#78350f' },
  warning:  { bg: '#fef9c3', border: '#eab308', badge: '#eab308', text: '#713f12' },
  moderate: { bg: '#f1f5f9', border: '#94a3b8', badge: '#94a3b8', text: '#334155' },
}

export default function RiskFlags({ flags }) {
  if (!Array.isArray(flags) || flags.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">🚩 Risk Flags</span>
          <span className="badge badge-rule">RULE</span>
        </div>
        <div style={{ color: '#059669', fontWeight: 600, padding: '12px 0', fontSize: '0.9rem' }}>
          ✓ No risk flags identified
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">🚩 Risk Flags ({flags.length})</span>
        <span className="badge badge-rule">RULE</span>
      </div>

      {flags.map((flag, i) => {
        // Support both old format {risk, severity, evidence} and new {level, label, detail}
        const level = (flag.level || flag.severity || 'moderate').toLowerCase()
        const label = flag.label || flag.risk || 'Unknown'
        const detail = flag.detail || (flag.evidence ? flag.evidence.join(', ') : '')
        const colors = LEVEL_MAP[level] || LEVEL_MAP.moderate

        return (
          <div
            key={i}
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              marginBottom: '10px',
              borderLeft: `4px solid ${colors.border}`,
              background: colors.bg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: detail ? '6px' : 0 }}>
              <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{label}</span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px',
                borderRadius: '9999px', background: colors.badge, color: '#fff',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {level}
              </span>
            </div>
            {detail && (
              <div style={{ fontSize: '0.82rem', color: '#475569' }}>{detail}</div>
            )}
            {flag.recommended_action && (
              <div style={{ fontSize: '0.82rem', color: '#059669', marginTop: '6px', fontWeight: 600 }}>
                → {flag.recommended_action}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
