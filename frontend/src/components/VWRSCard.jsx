/**
 * VWRSCard — Ventilator Weaning Readiness Score
 * Backend sends: { total_score, risk_level, components:{}, recommendation }
 * OR: { status: 'not_applicable' }  when patient not ventilated
 */
export default function VWRSCard({ data }) {
  // Not ventilated
  if (!data || data.recommendation === 'Not ventilated' || data.risk_level === 'N/A') {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">VWRS Status</span>
          <span className="badge badge-rule">RULE</span>
        </div>
        <div style={{ color: '#94a3b8', fontWeight: 600, padding: '12px 0', fontSize: '0.9rem' }}>
          Patient not on mechanical ventilation
        </div>
      </div>
    )
  }

  // Support new backend format { total_score, risk_level, components, recommendation }
  const score      = Number(data.total_score ?? data.score ?? 0)
  const riskLevel  = (data.risk_level || data.overall || 'UNKNOWN').toUpperCase()
  const components = data.components || {}
  const recommendation = data.recommendation || ''

  // Derive display from risk_level
  const isReady      = riskLevel === 'READY'      || riskLevel === 'LOW'
  const isBorderline = riskLevel === 'BORDERLINE' || riskLevel === 'MODERATE'
  const isNotReady   = !isReady && !isBorderline

  const statusLabel = isReady ? 'WEANING ELIGIBLE'
    : isBorderline ? 'REASSESS IN 4H'
    : 'NOT READY FOR WEANING'

  const statusIcon = isReady ? '✓' : isBorderline ? '⚠' : '✗'

  const blockBg    = isReady ? '#f0fdf4' : isBorderline ? '#fefce8' : '#fff5f5'
  const blockColor = isReady ? '#059669' : isBorderline ? '#d97706' : '#ef4444'
  const blockBorder = isReady ? '#059669' : isBorderline ? '#d97706' : '#ef4444'

  const componentEntries = Object.entries(components)

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">VWRS — Ventilator Weaning</span>
        <span className="badge badge-rule">RULE</span>
      </div>

      {/* Status block */}
      <div style={{
        background: blockBg,
        border: `1px solid ${blockBorder}`,
        borderRadius: '10px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '16px',
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: blockColor, lineHeight: 1 }}>
          {statusIcon} {riskLevel.replace(/_/g, ' ')}
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: blockColor, marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {statusLabel}
        </div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', marginTop: '10px' }}>
          Score: {score}
        </div>
      </div>

      {/* Component breakdown */}
      {componentEntries.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {componentEntries.map(([key, val], i) => {
            const status  = typeof val === 'object' ? (val.status || '') : String(val)
            const isPass  = status.toLowerCase().includes('pass') || status.toLowerCase().includes('ready')
            return (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 12px',
                borderRadius: '6px',
                marginBottom: '6px',
                background: isPass ? '#f0fdf4' : '#fff5f5',
              }}>
                <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700,
                  color: isPass ? '#059669' : '#ef4444',
                }}>
                  {isPass ? '✓' : '✗'} {status}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Recommendation */}
      {recommendation && recommendation !== 'Not ventilated' && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '0.85rem',
          color: '#475569',
          fontWeight: 500,
        }}>
          <strong>Recommendation: </strong>{recommendation}
        </div>
      )}
    </div>
  )
}
