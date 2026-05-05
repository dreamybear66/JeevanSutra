/**
 * OutlierAlerts — Data outlier detection card
 * Backend sends: { outliers_detected: bool, alerts: [{parameter, message, is_outlier}] }
 */
export default function OutlierAlerts({ data }) {
  if (!data || !data.outliers_detected) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Outlier Detection</span>
          <span className="badge badge-rule">RULE</span>
        </div>
        <div style={{ color: '#059669', fontWeight: 600, padding: '12px 0', fontSize: '0.9rem' }}>
          ✓ All lab values within expected ranges
        </div>
      </div>
    )
  }

  // Backend sends data.alerts array
  const outliers = Array.isArray(data.alerts) ? data.alerts
    : Array.isArray(data.outlier_details) ? data.outlier_details
    : []

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title" style={{ color: '#ef4444' }}>🚫 Data Outlier — Diagnosis Blocked</span>
        <span className="badge badge-rule">RULE</span>
      </div>

      <div style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
        fontSize: '0.85rem',
        color: '#92400e',
        fontWeight: 600,
      }}>
        ⚠ Physiologically impossible values detected. Verify lab sample integrity before proceeding with diagnosis.
      </div>

      {outliers.map((o, i) => {
        const paramName = o.parameter || o.param || 'Unknown parameter'
        const message   = o.message   || o.reason  || 'Value outside physiological range'

        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            padding: '14px 16px',
            background: '#fff5f5',
            border: '1px solid #fca5a5',
            borderLeft: '4px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '10px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem', marginBottom: '4px' }}>
                {paramName}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{message}</div>
            </div>
            <span style={{
              background: '#fee2e2', color: '#b91c1c',
              padding: '4px 12px', borderRadius: '9999px',
              fontSize: '0.68rem', fontWeight: 800,
              textTransform: 'uppercase', whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              Verify Required
            </span>
          </div>
        )
      })}
    </div>
  )
}
