import { useState } from 'react'
import './index.css'
import {
  ClipboardList, Activity, Settings, Brain, ArrowRight,
  Cpu, MessageSquare, Sparkles, BarChart3, Archive,
  Bell, Search, AlertTriangle, Lock, ShieldAlert, Layers
} from 'lucide-react'
import ClinicalScores from './components/ClinicalScores'
import VWRSCard from './components/VWRSCard'
import AMRAlerts from './components/AMRAlerts'
import RiskFlags from './components/RiskFlags'
import OutlierAlerts from './components/OutlierAlerts'
import TimelineChart from './components/TimelineChart'
import Narrative from './components/Narrative'
import Login from './components/Login'
import ProfileDropdown from './components/ProfileDropdown'
import AdminDashboard from './components/AdminDashboard'

const API_BASE = 'http://localhost:8080'

const SCENARIOS = [
  { id: 'patient_stable', label: 'Stable Patient', color: '#10b981' },
  { id: 'patient_sepsis', label: 'Sepsis Patient', color: '#c62828' },
  { id: 'patient_outlier_amr', label: 'Outlier + MRSA', color: '#d97706' },
]

/* Custom SVG logo — heartbeat lifeline motif for JeevanSutra */
function JeevanSutraLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#1565c0"/>
      <path d="M4 18h6l2-6 3 12 3-10 2 4h8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="16" cy="8" r="2.5" fill="#4fc3f7" opacity=".7"/>
    </svg>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeNav, setActiveNav] = useState('overview')

  const handleLogout = () => {
    setCurrentUser(null)
    setReport(null)
    setSelectedScenario(null)
  }

  const handleSettings = () => {
    alert("Settings panel is under construction. Future configuration options will be available here.")
  }

  const runAnalysis = async () => {
    if (!selectedScenario) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: selectedScenario }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      setReport(await res.json())
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const hasSepsis = report?.clinical_scores_summary?.summary?.sepsis_criteria_met
  const hasOutlier = report?.outlier_alerts?.outliers_detected
  const patientId = report?.metadata?.patient_id || ''

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />
  }

  return (
    <div className="app-shell">
      {/* Critical alert banner */}
      {report && hasSepsis && (
        <div className="alert-banner critical">
          <AlertTriangle size={14} />
          SEPSIS CRITERIA MET &mdash; IMMEDIATE ATTENTION REQUIRED
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-brand">
            <JeevanSutraLogo size={28} />
            <span className="header-title">JeevanSutra</span>
          </div>
          {report && (
            <div className="header-meta">
              <div><div className="label">Patient ID</div><div className="value">{patientId.substring(0, 12)}</div></div>
              <div><div className="label">Stability</div><div className={`value ${hasSepsis ? 'critical-text' : ''}`}>{hasSepsis ? 'CRITICAL' : 'STABLE'}</div></div>
            </div>
          )}
        </div>
        <div className="header-search-wrap">
          <Search size={14} className="search-icon" />
          <input className="header-search" placeholder="Search patient parameters..." />
        </div>
        <div className="header-actions">
          <div className="header-icon" title="Notifications"><Bell size={16} /></div>
          <div className="header-icon" title="Settings" onClick={handleSettings}><Settings size={16} /></div>
          <ProfileDropdown user={currentUser} onLogout={handleLogout} />
        </div>
      </header>

      {/* Outlier lock banner */}
      {report && hasOutlier && (
        <div className="lock-banner"><Lock size={13} /> Outlier Detected &mdash; Diagnosis Locked</div>
      )}

      <div className="content-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div>
            <div className="sidebar-section">
              <div className="sidebar-label">Clinical Pipeline</div>
              <div className="sidebar-sublabel">data synthesis active</div>
            </div>
            <nav className="sidebar-nav">
              {[
                { id:'overview', label:'Patient Overview', Icon:ClipboardList, allowed: ['doctor', 'staff', 'patient'] },
                { id:'vitals', label:'Vitals & Labs', Icon:Activity, allowed: ['doctor', 'staff'] },
                { id:'rules', label:'Rule Engine', Icon:Settings, allowed: ['doctor', 'staff'] },
                { id:'ai', label:'AI Insights', Icon:Brain, allowed: ['doctor'] },
                { id:'admin', label:'Admin & Security', Icon:ShieldAlert, allowed: ['doctor'] },
              ].filter(item => item.allowed.includes(currentUser.role)).map(item => (
                <div key={item.id} className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`} onClick={() => setActiveNav(item.id)}>
                  <item.Icon size={15} /> {item.label}
                </div>
              ))}
            </nav>
            <div className="sidebar-divider" />
            <div className="sidebar-section"><div className="sidebar-label" style={{color:'#64748b'}}>Pipeline Stages</div></div>
            <nav className="sidebar-nav">
              {[
                { label:'Ingestion', Icon:ArrowRight },
                { label:'Rule Engines', Icon:Cpu },
                { label:'LLM Agents', Icon:MessageSquare },
                { label:'Synthesis', Icon:Sparkles },
              ].map((item, i) => (
                <div key={i} className="sidebar-item"><item.Icon size={15} /> {item.label}</div>
              ))}
            </nav>
          </div>
          <div className="sidebar-bottom">
            <div className="sidebar-item"><BarChart3 size={15} /> System Status</div>
            <div className="sidebar-item"><Archive size={15} /> Archive</div>
          </div>
        </aside>

        {/* Main content */}
        <main className="main-area">
          {activeNav === 'admin' && currentUser.role === 'doctor' ? (
            <AdminDashboard currentUser={currentUser} />
          ) : (
            <>
              <div className="scenario-bar">
                {SCENARIOS.map(s => (
                  <button key={s.id} className={`scenario-btn ${selectedScenario === s.id ? 'active' : ''}`}
                    onClick={() => { setSelectedScenario(s.id); setReport(null) }}>
                    <span className="dot" style={{ background: s.color }} /> {s.label}
                  </button>
                ))}
            <button className="analyze-btn" onClick={runAnalysis} disabled={!selectedScenario || loading}>
              {loading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>

          {error && <div className="error-bar">{error}</div>}
          {loading && <div className="loading"><div className="spinner" />Running deterministic rule engines...</div>}

          {!report && !loading && (
            <div className="empty-state">
              <Layers size={44} strokeWidth={1} style={{ color: '#94a3b8' }} />
              <p>Select a patient scenario and run analysis</p>
              <p className="subtext">Synthetic demo data for MVP</p>
            </div>
          )}

          {report && (
            <>
              <div className="dashboard-grid">
                {activeNav === 'overview' && (
                  <>
                    {currentUser.role !== 'patient' && <ClinicalScores data={report.clinical_scores_summary} />}
                    {currentUser.role !== 'patient' && <VWRSCard data={report.vwrs_summary} />}
                    <div className="full-width"><RiskFlags flags={report.risk_flags} /></div>
                    <div className="full-width"><Narrative data={report.ai_narrative} provenance={report.provenance_summary} /></div>
                  </>
                )}
                
                {activeNav === 'vitals' && currentUser.role !== 'patient' && (
                  <>
                    <TimelineChart timeline={report.disease_timeline} />
                  </>
                )}

                {activeNav === 'rules' && currentUser.role !== 'patient' && (
                  <>
                    {report.amr_summary?.amr_detected ? <div className="full-width"><AMRAlerts data={report.amr_summary} /></div> : null}
                    {report.outlier_alerts?.outliers_detected ? <div className="full-width"><OutlierAlerts data={report.outlier_alerts} /></div> : null}
                  </>
                )}

                {activeNav === 'ai' && currentUser.role === 'doctor' && (
                  <>
                    <div className="full-width"><Narrative data={report.ai_narrative} provenance={report.provenance_summary} /></div>
                  </>
                )}
              </div>
              <div className="safety-disclaimer">
                <ShieldAlert size={13} style={{ verticalAlign:'middle', marginRight:6 }} />
                {report.safety_disclaimer}
              </div>
            </>
          )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
