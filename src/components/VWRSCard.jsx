/**
 * VWRSCard — Matches reference: big status block + parameter rows
 */
export default function VWRSCard({ data }) {
  if (!data || data.status === 'not_applicable') {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">VWRS Status</span>
          <span className="badge badge-rule">RULE</span>
        </div>
        <div className="not-applicable">Patient not on mechanical ventilation</div>
      </div>
    )
  }
  if (data.status === 'insufficient_data') {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">VWRS Status</span>
          <span className="badge badge-rule">RULE</span>
        </div>
        <div className="not-applicable">Insufficient vitals data</div>
      </div>
    )
  }

  const overall = data.overall || 'UNKNOWN'
  const blockClass = overall === 'READY' ? 'ready' : overall === 'BORDERLINE' ? 'borderline' : ''
  const statusClass = overall === 'READY' ? 'ready' : overall === 'BORDERLINE' ? 'borderline' : 'not-ready'
  const statusIcon = overall === 'READY' ? '\u2713' : overall === 'BORDERLINE' ? '\u26A0' : '\u2717'
  const subLabel = overall === 'READY' ? 'WEANING ELIGIBLE'
    : overall === 'BORDERLINE' ? 'REASSESS IN 4H'
    : 'WEANING SCORE INHIBITED'

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">VWRS Status</span>
        <span className="badge badge-rule">RULE</span>
      </div>

      <div className={`vwrs-status-block ${blockClass}`}>
        <div className={`vwrs-big-status ${statusClass}`}>
          {statusIcon} {overall.replace('_', ' ')}
        </div>
        <div className={`vwrs-sub ${statusClass}`}>{subLabel}</div>
      </div>

      <div className="vwrs-params">
        {(data.parameter_results || []).map((p, i) => {
          const isFail = p.status === 'NOT_READY'
          return (
            <div className="vwrs-row" key={i}>
              <span className="param-name">{p.parameter}</span>
              <span className={`param-value ${isFail ? 'fail' : 'pass'}`}>
                {p.value !== null ? p.value : 'N/A'}
              </span>
              {isFail && <span className="param-icon" style={{ color: '#c62828' }}>{'\u2718'}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
