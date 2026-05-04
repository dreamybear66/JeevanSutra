/**
 * TimelineChart — Disease progression timeline using Recharts
 * Shows WBC, Lactate, and MAP trends over time
 * Provenance: RULE
 */
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function TimelineChart({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">📈 Disease Progression Timeline</span>
          <span className="badge-rule">RULE</span>
        </div>
        <div className="not-applicable">No timeline data</div>
      </div>
    )
  }

  // Transform timeline data for Recharts
  const chartData = timeline.map((entry, idx) => {
    const ts = entry.timestamp ? new Date(entry.timestamp) : null
    const label = ts ? `Day ${idx + 1}` : `Point ${idx + 1}`
    return {
      name: label,
      WBC: entry.labs?.wbc ?? null,
      Lactate: entry.labs?.lactate ?? null,
      MAP: entry.vitals?.map ?? null,
      HR: entry.vitals?.heart_rate ?? null,
      status: entry.status,
    }
  })

  const statusColors = {
    stable: '#22c55e',
    concerning: '#eab308',
    deteriorating: '#f97316',
    critical: '#ef4444',
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null
    const entry = chartData.find(d => d.name === label)
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '0.8rem',
      }}>
        <div style={{
          fontWeight: 700,
          marginBottom: '6px',
          color: statusColors[entry?.status] || 'var(--text-primary)',
        }}>
          {label} — {entry?.status?.toUpperCase()}
        </div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: '2px' }}>
            {p.name}: {p.value !== null ? p.value : 'N/A'}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">📈 Disease Progression Timeline</span>
        <span className="badge-rule">RULE</span>
      </div>

      <div className="timeline-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            <Line
              type="monotone" dataKey="WBC" stroke="#f97316" strokeWidth={2}
              dot={{ r: 4, fill: '#f97316' }} name="WBC (K/uL)"
            />
            <Line
              type="monotone" dataKey="Lactate" stroke="#ef4444" strokeWidth={2}
              dot={{ r: 4, fill: '#ef4444' }} name="Lactate (mmol/L)"
            />
            <Line
              type="monotone" dataKey="MAP" stroke="#60a5fa" strokeWidth={2}
              dot={{ r: 4, fill: '#60a5fa' }} name="MAP (mmHg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status indicators */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
        {timeline.map((entry, i) => (
          <div key={i} style={{
            padding: '4px 10px',
            borderRadius: '99px',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: entry.status === 'stable' ? 'var(--low-bg)'
              : entry.status === 'concerning' ? 'var(--moderate-bg)'
              : entry.status === 'deteriorating' ? 'var(--high-bg)'
              : 'var(--critical-bg)',
            color: statusColors[entry.status] || 'var(--text-muted)',
          }}>
            Day {i + 1}: {entry.status}
          </div>
        ))}
      </div>
    </div>
  )
}
