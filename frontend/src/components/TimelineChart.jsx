/**
 * TimelineChart — Vitals & Labs trend from the current report
 * Displays clear Value Cards at the top, and dedicated large graphs below.
 */
import { BarChart, Bar, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

const VITAL_CONFIG = {
  hr:    { name: 'Heart Rate', color: '#f97316', unit: 'bpm' },
  sbp:   { name: 'Systolic BP', color: '#3b82f6', unit: 'mmHg' },
  rr:    { name: 'Resp. Rate', color: '#8b5cf6', unit: '/min' },
  temp:  { name: 'Temperature', color: '#ec4899', unit: '°C' },
  spo2:  { name: 'SpO₂', color: '#22c55e', unit: '%' },
}

const LAB_COLORS = ['#ef4444', '#f59e0b', '#0ea5e9', '#dc2626', '#7c3aed', '#059669', '#d946ef', '#14b8a6']

function normalTime(ts) {
  if (!ts || ts === 'now') return 'Latest'
  try {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

// Custom Tooltip for the large graphs
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>{label}</div>
      {payload.map((p, i) => p.value !== null && p.value !== undefined && (
        <div key={i} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// A clean card showing just the latest value (no graph inside)
function ValueCard({ title, value, unit }) {
  if (value === null || value === undefined) return null

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '12px' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>{unit}</span>}
      </div>
    </div>
  )
}

function VitalsSection({ vitals_trend }) {
  if (!vitals_trend || vitals_trend.length === 0) {
    return <div style={styles.empty}>No vitals data recorded yet</div>
  }

  // Get the absolute latest valid value for the cards
  const latestValues = {}
  Object.keys(VITAL_CONFIG).forEach(key => {
    // Find the last entry where this key is not null
    const validEntries = vitals_trend.filter(v => v[key] !== null && v[key] !== undefined)
    if (validEntries.length > 0) {
      latestValues[key] = validEntries[validEntries.length - 1][key]
    }
  })

  // Format data for the dedicated large Bar Chart
  let chartData = vitals_trend.map(v => ({
    name: normalTime(v.time),
    'Heart Rate': v.hr ?? null,
    'Systolic BP': v.sbp ?? null,
    'Resp. Rate': v.rr ?? null,
    'SpO₂': v.spo2 ?? null,
    'Temperature': v.temp ?? null,
  }))

  // Pad single data point so it doesn't stretch 100% and break hover mechanics
  if (chartData.length === 1) {
    chartData = [{ name: ' ' }, chartData[0], { name: '  ' }]
  }

  return (
    <div>
      <div style={styles.sectionLabel}>Latest Vitals</div>
      <div style={styles.grid}>
        {Object.entries(VITAL_CONFIG).map(([key, config]) => (
          <ValueCard 
            key={key}
            title={config.name}
            unit={config.unit}
            value={latestValues[key]}
          />
        ))}
      </div>
      
      <div style={{ marginTop: '24px' }}>
        <div style={styles.sectionLabel}>Vitals Trend Graph</div>
        <div style={styles.chartBox}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
              <YAxis fontSize={11} stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} shared={false} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
              <Bar dataKey="Heart Rate" fill={VITAL_CONFIG.hr.color} radius={[2,2,0,0]} isAnimationActive={false} />
              <Bar dataKey="Systolic BP" fill={VITAL_CONFIG.sbp.color} radius={[2,2,0,0]} isAnimationActive={false} />
              <Bar dataKey="Resp. Rate" fill={VITAL_CONFIG.rr.color} radius={[2,2,0,0]} isAnimationActive={false} />
              <Bar dataKey="SpO₂" fill={VITAL_CONFIG.spo2.color} radius={[2,2,0,0]} isAnimationActive={false} />
              <Bar dataKey="Temperature" fill={VITAL_CONFIG.temp.color} radius={[2,2,0,0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function LabsSection({ labs_trend }) {
  if (!labs_trend || Object.keys(labs_trend).length === 0) {
    return <div style={styles.empty}>No lab trend data available</div>
  }

  // Get the absolute latest valid value for the cards
  const latestValues = {}
  Object.entries(labs_trend).forEach(([paramName, entries]) => {
    if (entries && entries.length > 0) {
      latestValues[paramName] = {
        value: entries[entries.length - 1].value,
        unit: entries[entries.length - 1].unit || ''
      }
    }
  })

  // Format data for the dedicated large Bar Chart
  const allTimes = []
  const seenTimes = new Set()
  Object.values(labs_trend).forEach(entries => {
    entries.forEach(e => {
      const t = normalTime(e.recorded_at)
      if (!seenTimes.has(t)) { seenTimes.add(t); allTimes.push(t) }
    })
  })

  let chartData = allTimes.map(t => {
    const point = { name: t }
    Object.entries(labs_trend).forEach(([param, entries]) => {
      const match = entries.find(e => normalTime(e.recorded_at) === t)
      point[param.replace(/_/g, ' ')] = match ? match.value : null
    })
    return point
  })

  // Pad single data point so it doesn't stretch 100% and break hover mechanics
  if (chartData.length === 1) {
    chartData = [{ name: ' ' }, chartData[0], { name: '  ' }]
  }

  const params = Object.keys(labs_trend).slice(0, 6).map(p => p.replace(/_/g, ' '))

  return (
    <div>
      <div style={styles.sectionLabel}>Latest Lab Results</div>
      <div style={styles.grid}>
        {Object.entries(latestValues).map(([paramName, data]) => (
          <ValueCard 
            key={paramName}
            title={paramName.replace(/_/g, ' ')}
            value={data.value}
            unit={data.unit}
          />
        ))}
      </div>

      <div style={{ marginTop: '24px' }}>
        <div style={styles.sectionLabel}>Labs Trend Graph</div>
        <div style={styles.chartBox}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
              <YAxis fontSize={11} stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} shared={false} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
              {params.map((p, i) => (
                <Bar
                  key={p}
                  dataKey={p}
                  fill={LAB_COLORS[i % LAB_COLORS.length]}
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default function TimelineChart({ timeline }) {
  const vitals_trend = timeline?.vitals_trend || []
  const labs_trend   = timeline?.labs_trend   || {}

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>📈 Vitals &amp; Lab Data</span>
        <span style={styles.badge}>RECORDED DATA</span>
      </div>

      <VitalsSection vitals_trend={vitals_trend} />

      <div style={styles.divider} />

      <LabsSection labs_trend={labs_trend} />

      {vitals_trend.length === 0 && Object.keys(labs_trend).length === 0 && (
        <div style={styles.emptyState}>
          Upload patient data files to populate trends
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '14px',
    borderBottom: '1px solid #e2e8f0',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    fontSize: '0.65rem',
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: '9999px',
    background: '#d1fae5',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  sectionLabel: {
    fontSize: '0.85rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#475569',
    marginBottom: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px',
  },
  chartBox: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px 20px 16px 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  divider: {
    height: '1px',
    background: '#e2e8f0',
    margin: '32px 0',
  },
  empty: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: 500,
    padding: '24px 0',
  },
  emptyState: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: 500,
    padding: '32px',
    border: '1px dashed #cbd5e1',
    borderRadius: '8px',
    marginTop: '8px',
  },
}
