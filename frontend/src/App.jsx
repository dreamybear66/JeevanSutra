import { useState } from 'react'
import './index.css'
import {
  ClipboardList, Activity, Settings, Brain, ArrowRight,
  Cpu, MessageSquare, Sparkles, BarChart3, Archive,
  Bell, Search, AlertTriangle, Lock, ShieldAlert, Layers,
  UserPlus, Bed, LayoutDashboard, UploadCloud, FileText, Clock, Users, User
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
import OpeningAnimation from './components/OpeningAnimation'
import CultureData from './components/CultureData'
import StaffViews from './components/StaffViews'
import html2pdf from 'html2pdf.js'

const API_BASE = 'http://localhost:8000/api'

const PATIENTS = [
  { id: 'patient_stable', name: 'John Doe (Stable)' },
  { id: 'patient_sepsis', name: 'Jane Smith (Sepsis Protocol)' },
  { id: 'patient_outlier_amr', name: 'Robert Johnson (Outlier/MRSA)' },
]

/* Custom SVG logo — heartbeat lifeline motif for JeevanSutra */
function JeevanSutraLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="10" fill="url(#grad1)"/>
      <path d="M5 18h5.5l2-7 3.5 14 3.5-12 2 5H27" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="grad1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d47a1"/>
          <stop offset="1" stopColor="#1976d2"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function App() {
  const [showOpening, setShowOpening] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Initialize nav correctly based on role later, default to overview or ward-view
  const [activeNav, setActiveNav] = useState(null)

  const [showSettings, setShowSettings] = useState(false)

  const handleLogout = () => {
    setCurrentUser(null)
    setReport(null)
    setSelectedScenario(null)
  }

  const handleSettings = () => {
    setShowSettings(true)
  }

  const runAnalysis = async () => {
    if (!selectedScenario) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/analyze/${selectedScenario}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      setReport(await res.json())
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const hasSepsis = report?.clinical_scores_summary?.summary?.sepsis_criteria_met
  const hasOutlier = report?.outlier_alerts?.outliers_detected
  const patientId = report?.metadata?.patient_id || ''

  const handlePDFExport = () => {
    const element = document.getElementById('report-content')
    if (!element) return
    
    const opt = {
      margin:       0.5,
      filename:     `Clinical_Summary_${report?.metadata?.patient_name || 'Patient'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    
    html2pdf().set(opt).from(element).save()
  }

  const handleFHIRExport = async () => {
    if (!report || !report.metadata || !report.metadata.patient_id) return
    try {
      const response = await fetch(`${API_BASE}/reports/${report.metadata.patient_id}/export/fhir?actor_id=${currentUser.id}`)
      if (!response.ok) throw new Error('FHIR export failed')
      const data = await response.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `FHIR_Bundle_${report.metadata.patient_id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Failed to export FHIR data')
    }
  }

  if (!currentUser) {
    return <Login onLogin={(user) => {
      setCurrentUser(user)
      setActiveNav(user.role === 'staff' ? 'ward-view' : 'overview')
    }} />
  }

  const doctorNav = [
    { id:'overview', label:'Patient Overview', Icon:ClipboardList },
    { id:'vitals', label:'Vitals & Labs', Icon:Activity },
    { id:'rules', label:'Rule Engine', Icon:Settings },
    { id:'reports', label:'Reports / Culture', Icon:ClipboardList },
    { id:'ai', label:'AI Insights', Icon:Brain },
    { id:'admin', label:'Admin & Security', Icon:ShieldAlert },
  ]

  const staffNav = [
    { section: 'Patient Management' },
    { id:'patient-add', label:'Add Patient', Icon:UserPlus },
    { id:'patient-search', label:'Search Patient', Icon:Search },
    { id:'patient-bed', label:'Bed Allocation', Icon:Bed },
    { section: 'Ward' },
    { id:'ward-view', label:'Bed / Ward View', Icon:LayoutDashboard },
    { id:'vitals-entry', label:'Vitals Entry', Icon:Activity },
    { section: 'Data Ingestion' },
    { id:'upload-lab', label:'Upload Lab Reports', Icon:UploadCloud },
    { id:'upload-culture', label:'Upload Culture Reports', Icon:UploadCloud },
    { section: 'Clinical' },
    { id:'notes', label:'Notes & Observations', Icon:FileText },
    { id:'history', label:'Patient History', Icon:Clock },
    { id:'handover', label:'Shift Handover', Icon:Users },
    { section: 'Personal' },
    { id:'staff-profile', label:'Staff Profile', Icon:User },
  ]

  return (
    <>
      {showOpening && <OpeningAnimation onComplete={() => setShowOpening(false)} />}
      
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>System Settings</h3>
              <button onClick={() => setShowSettings(false)} className="close-btn">&times;</button>
            </div>
            <div className="modal-body">
              <p>Settings panel is under construction. Future configuration options will be available here.</p>
              <div className="settings-options">
                <label><input type="checkbox" defaultChecked /> Enable Notifications</label>
                <label><input type="checkbox" defaultChecked /> High Contrast Mode</label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`app-shell ${showOpening ? 'hidden-shell' : 'fade-in'}`}>
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
          <ProfileDropdown 
            user={currentUser} 
            onLogout={handleLogout} 
            onProfileClick={() => setActiveNav(currentUser.role === 'staff' ? 'staff-profile' : 'admin')}
          />
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
            {currentUser.role === 'doctor' && (
              <>
                <div className="sidebar-section">
                  <div className="sidebar-label">Clinical Pipeline</div>
                  <div className="sidebar-sublabel">data synthesis active</div>
                </div>
                <nav className="sidebar-nav">
                  {doctorNav.map(item => (
                    <div key={item.id} className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`} onClick={() => setActiveNav(item.id)}>
                      <item.Icon size={18} /> <span className="sidebar-text">{item.label}</span>
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
                    <div key={i} className="sidebar-item"><item.Icon size={18} /> <span className="sidebar-text">{item.label}</span></div>
                  ))}
                </nav>
              </>
            )}

            {currentUser.role === 'staff' && (
              <nav className="sidebar-nav" style={{ marginTop: '10px' }}>
                {staffNav.map((item, i) => {
                  if (item.section) {
                    return (
                      <div key={i} className="sidebar-section" style={{ marginTop: i > 0 ? '20px' : '0', marginBottom: '8px' }}>
                        <div className="sidebar-label" style={{ marginTop: '12px' }}>{item.section}</div>
                      </div>
                    )
                  }
                  return (
                    <div key={item.id} className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`} onClick={() => setActiveNav(item.id)}>
                      <item.Icon size={18} /> <span className="sidebar-text">{item.label}</span>
                    </div>
                  )
                })}
              </nav>
            )}
          </div>
          <div className="sidebar-bottom">
            <div className="sidebar-item"><BarChart3 size={18} /> <span className="sidebar-text">System Status</span></div>
            <div className="sidebar-item"><Archive size={18} /> <span className="sidebar-text">Archive</span></div>
          </div>
        </aside>

        {/* Main content */}
        <main className="main-area">
          {activeNav === 'admin' && currentUser.role === 'doctor' ? (
            <AdminDashboard currentUser={currentUser} />
          ) : currentUser.role === 'staff' ? (
            <StaffViews activeNav={activeNav} />
          ) : (
            <>
              <div className="glass-panel patient-selector-bar">
                <span className="patient-selector-label">Patient Profile:</span>
                <select 
                  className="patient-select" 
                  value={selectedScenario || ''} 
                  onChange={(e) => { setSelectedScenario(e.target.value); setReport(null) }}
                >
                  <option value="" disabled>Select a patient...</option>
                  {PATIENTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button className="analyze-btn" onClick={runAnalysis} disabled={!selectedScenario || loading}>
                  {loading ? 'Analyzing...' : 'Run Clinical Analysis'}
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
              <div className="export-bar" style={{ display: 'flex', gap: '10px', marginBottom: '16px', justifyContent: 'flex-end', alignItems: 'center' }}>
                {currentUser.role === 'staff' && (
                  <button className="analyze-btn" style={{ background: 'var(--green)', color: '#fff', marginRight: 'auto' }} onClick={() => alert('PDF Upload Dialog: Upload patient lab reports here for ingestion.')}>
                    Upload Lab PDF
                  </button>
                )}
                <button onClick={handlePDFExport} className="analyze-btn" style={{ background: 'rgba(255,255,255,0.8)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                  Download PDF
                </button>
                <button onClick={handleFHIRExport} className="analyze-btn">
                  Export FHIR JSON
                </button>
              </div>
              <div id="report-content">
                <div className="dashboard-grid">
                {activeNav === 'overview' && (
                  <>
                    <ClinicalScores data={report.clinical_scores_summary} />
                    <VWRSCard data={report.vwrs_summary} />
                    <div className="full-width"><RiskFlags flags={report.risk_flags} /></div>
                    <div className="full-width"><Narrative data={report.ai_narrative} provenance={report.provenance_summary} /></div>
                  </>
                )}
                
                {activeNav === 'vitals' && (
                  <>
                    <TimelineChart timeline={report.disease_timeline} />
                  </>
                )}

                {activeNav === 'rules' && (
                  <>
                    {report.amr_summary?.amr_detected ? <div className="full-width"><AMRAlerts data={report.amr_summary} /></div> : null}
                    {report.outlier_alerts?.outliers_detected ? <div className="full-width"><OutlierAlerts data={report.outlier_alerts} /></div> : null}
                  </>
                )}

                {activeNav === 'reports' && (
                  <div className="full-width"><CultureData /></div>
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
              </div>
            </>
          )}
            </>
          )}
        </main>
      </div>
    </div>
    </>
  )
}

export default App
