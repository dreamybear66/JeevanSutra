/**
 * Narrative — AI clinical summary
 * Backend sends ai_narrative as a plain STRING (not an object)
 */
export default function Narrative({ data, provenance }) {
  // data = plain string from backend (Gemini narrative)
  const text = typeof data === 'string' ? data : data?.narrative || data?.text || ''

  if (!text) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">🧠 AI Clinical Summary</span>
          <span className="badge badge-ai">AI</span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '12px 0' }}>
          No AI narrative generated yet. Run analysis to generate.
        </div>
      </div>
    )
  }

  if (text.includes('Quota exceeded') || text.includes('generativelanguage')) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">🧠 AI Clinical Summary</span>
          <span className="badge badge-ai" style={{ background: '#fee2e2', color: '#ef4444' }}>API ERROR</span>
        </div>
        <div style={{ color: '#ef4444', fontSize: '0.9rem', padding: '12px 0' }}>
          <strong>API Rate Limit Exceeded:</strong> The Gemini AI service is currently unavailable due to free-tier quota limits. Please try again later.
        </div>
      </div>
    )
  }

  // Split narrative into paragraphs for readable display
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0)

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">🧠 AI Clinical Summary</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-ai">AI NARRATIVE</span>
          <span className="badge badge-rule">RULE-CONSTRAINED</span>
        </div>
      </div>

      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '16px',
      }}>
        {paragraphs.map((para, i) => {
          const isHeading = /^#{1,3}\s/.test(para) || /^\*\*[^*]+\*\*:?$/.test(para.trim())
          const cleanPara = para.replace(/^#{1,3}\s/, '').replace(/\*\*/g, '')

          return isHeading ? (
            <div key={i} style={{
              fontWeight: 800,
              color: '#1e293b',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: i > 0 ? '16px' : 0,
              marginBottom: '6px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '4px',
            }}>
              {cleanPara}
            </div>
          ) : (
            <p key={i} style={{
              fontSize: '0.9rem',
              lineHeight: '1.65',
              color: '#475569',
              margin: '0 0 10px',
            }}>
              {cleanPara}
            </p>
          )
        })}
      </div>

      {provenance && (
        <div style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          fontSize: '0.72rem',
          color: '#94a3b8',
          paddingTop: '8px',
          borderTop: '1px solid #f1f5f9',
        }}>
          {provenance.rule_count != null && (
            <span>Rule checks: <strong>{provenance.rule_count}</strong></span>
          )}
          {provenance.rule_version && (
            <span>Rule version: <strong>{provenance.rule_version}</strong></span>
          )}
          <span style={{
            fontStyle: 'italic',
            color: '#94a3b8',
          }}>
            AI narrative constrained by deterministic rule engine — cannot override clinical facts
          </span>
        </div>
      )}
    </div>
  )
}
