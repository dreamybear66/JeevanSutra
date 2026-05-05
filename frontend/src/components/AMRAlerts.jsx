/**
 * AMRAlerts — Antimicrobial Resistance alerts
 * Backend sends: { amr_detected: bool, organisms: [{organism, resistance_detail}] }
 */
export default function AMRAlerts({ data }) {
  if (!data || !data.amr_detected) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">AMR Detection</span>
          <span className="badge badge-rule">RULE</span>
        </div>
        <div style={{ color: '#059669', fontWeight: 600, padding: '12px 0', fontSize: '0.9rem' }}>
          ✓ No resistant organisms detected
        </div>
      </div>
    )
  }

  // Backend sends data.organisms array
  // Each item: { organism, resistance_detail, ... }
  const organisms = Array.isArray(data.organisms) ? data.organisms
    : Array.isArray(data.alerts) ? data.alerts
    : []

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title" style={{ color: '#ef4444' }}>⚠ AMR Critical Alert</span>
        <span className="badge badge-ai">AI + RULE</span>
      </div>

      {organisms.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '12px 0' }}>
          AMR detected but no organism details available
        </div>
      ) : (
        organisms.map((item, i) => {
          const name = item.organism || item.name || 'Unknown organism'
          const detail = item.resistance_detail || item.resistant_to || ''
          const recommended = item.recommended || item.recommended_antibiotics || []
          const resistantTo = Array.isArray(detail) ? detail : [detail].filter(Boolean)
          const recommended_list = Array.isArray(recommended) ? recommended : []

          return (
            <div key={i} style={{
              background: '#fff5f5',
              border: '1px solid #fca5a5',
              borderLeft: '4px solid #ef4444',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', marginBottom: '10px' }}>
                {name}
              </div>

              {resistantTo.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Resistant To
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {resistantTo.map((r, j) => (
                      <span key={j} style={{
                        background: '#fee2e2', color: '#b91c1c',
                        padding: '3px 10px', borderRadius: '9999px',
                        fontSize: '0.78rem', fontWeight: 600,
                      }}>{typeof r === 'string' ? r : r.name || String(r)}</span>
                    ))}
                  </div>
                </div>
              )}

              {recommended_list.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Recommended
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {recommended_list.map((ab, j) => (
                      <span key={j} style={{
                        background: '#d1fae5', color: '#065f46',
                        padding: '3px 10px', borderRadius: '9999px',
                        fontSize: '0.78rem', fontWeight: 600,
                      }}>{typeof ab === 'string' ? ab : ab.name || String(ab)}</span>
                    ))}
                  </div>
                </div>
              )}

              {item.resistance_detail && typeof item.resistance_detail === 'string' && (
                <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                  {item.resistance_detail}
                </div>
              )}
            </div>
          )
        })
      )}

      <div style={{
        marginTop: '8px', padding: '10px 14px',
        background: '#f0fdf4', borderRadius: '8px',
        fontSize: '0.78rem', color: '#166534',
        borderLeft: '3px solid #10b981',
      }}>
        <strong>Note:</strong> Confirm with microbiologist before initiating targeted therapy.
      </div>
    </div>
  )
}
