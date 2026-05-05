import { useState, useEffect, useCallback } from 'react'
import './index.css'
import {
  ClipboardList, Activity, Settings, Brain,
  Bell, Search, AlertTriangle, Lock, ShieldAlert,
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
import PatientUpload from './components/PatientUpload'
import html2pdf from 'html2pdf.js'

const API_BASE = 'http://localhost:8000/api'

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
  const [patients, setPatients] = useState([])
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeNav, setActiveNav] = useState(null)
  const [notification, setNotification] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleLogout = useCallback(() => {
    setCurrentUser(null)
    setReport(null)
    setSelectedScenario(null)
    setPatients([])
  }, [])

  // Fetch patients when user logs in
  useEffect(() => {
    if (!currentUser) return
    fetch(`${API_BASE}/patients`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setPatients(list.map(p => ({ id: p.patient_id, name: `${p.name} (${p.bed_number || 'No Bed'})` })))
      })
      .catch(() => setPatients([]))
  }, [currentUser])

  const runAnalysis = async () => {
    if (!selectedScenario) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/analyze/${selectedScenario}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setReport(await res.json())
      setActiveNav('overview')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const hasSepsis = report?.clinical_scores_summary?.summary?.sepsis_criteria_met
  const hasOutlier = report?.outlier_alerts?.outliers_detected
  const patientId = report?.metadata?.patient_id || ''

  const handlePDFExport = () => {
    const element = document.getElementById('report-content')
    if (!element) { showNotif('No report to export', 'error'); return }
    html2pdf().set({
      margin: 0.5,
      filename: `Clinical_Summary_${report?.metadata?.patient_name || 'Patient'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(element).save()
    showNotif('PDF export started')
  }

  const handleFHIRExport = async () => {
    if (!report?.metadata?.patient_id) { showNotif('No report loaded', 'error'); return }
    try {
      const res = await fetch(`${API_BASE}/reports/${report.metadata.patient_id}/export/fhir?actor_id=${currentUser.id}`)
      if (!res.ok) throw new Error('Export failed')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `FHIR_Bundle_${report.metadata.patient_id}.json`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
      showNotif('FHIR bundle downloaded')
    } catch (err) {
      showNotif('FHIR export failed: ' + err.message, 'error')
    }
  }

  if (!currentUser) {
    return <Login onLogin={(user) => {
      setCurrentUser(user)
      setActiveNav(user.role === 'staff' ? 'patient-search' : 'overview')
    }} />
  }

  // ── Doctor sidebar (clean, clinical) ──
  const doctorNav = [
    { id: 'overview',  label: 'Patient Overview',   Icon: ClipboardList },
    { id: 'vitals',    label: 'Vitals & Lab Trends', Icon: Activity },
    { id: 'alerts',    label: 'Alerts & Flags',      Icon: AlertTriangle },
    { id: 'culture',   label: 'Culture Results',     Icon: FileText },
    { id: 'narrative', label: 'AI Clinical Summary', Icon: Brain },
  ]

  // ── Staff sidebar ──
  const staffNav = [
    { section: 'Patient Management' },
    { id: 'patient-add',    label: 'Add Patient',          Icon: UserPlus },
    { id: 'patient-search', label: 'Search Patient',       Icon: Search },
    { id: 'patient-bed',    label: 'Bed Allocation',       Icon: Bed },
    { section: 'Ward' },
    { id: 'ward-view',      label: 'Bed / Ward View',      Icon: LayoutDashboard },
    { id: 'vitals-entry',   label: 'Vitals Entry',         Icon: Activity },
    { section: 'Data Ingestion' },
    { id: 'upload-lab',     label: 'Upload Lab Reports',   Icon: UploadCloud },
    { id: 'upload-culture', label: 'Upload Culture',       Icon: UploadCloud },
    { section: 'Clinical' },
    { id: 'notes',          label: 'Notes & Observations', Icon: FileText },
    { id: 'history',        label: 'Patient History',      Icon: Clock },
    { id: 'handover',       label: 'Shift Handover',       Icon: Users },
    { section: 'Personal' },
    { id: 'staff-profile',  label: 'Staff Profile',        Icon: User },
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

        {/* Toast notification */}
        {notification && (
          <div style={{
            position: 'fixed', top: '16px', right: '20px', zIndex: 9000,
            padding: '12px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
            background: notification.type === 'error' ? '#fee2e2' : '#d1fae5',
            color: notification.type === 'error' ? '#ef4444' : '#059669',
            border: `1px solid ${notification.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            animation: 'fadeIn 0.3s ease',
          }}>
            {notification.msg}
          </div>
        )}

        {/* Critical alert banner */}
        {report && hasSepsis && (
          <div className="alert-banner critical">
            <AlertTriangle size={14} />
            SEPSIS CRITERIA MET — IMMEDIATE ATTENTION REQUIRED
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
                <div><div className="label">Patient ID</div><div className="value">{patientId.substring(0, 8)}...</div></div>
                <div><div className="label">Status</div><div className={`value ${hasSepsis ? 'critical-text' : ''}`}>{hasSepsis ? 'CRITICAL' : 'STABLE'}</div></div>
              </div>
            )}
          </div>
          <div className="header-search-wrap">
            <Search size={14} className="search-icon" />
            <input className="header-search" placeholder="Search patient parameters..." />
          </div>
          <div className="header-actions">
            <div className="header-icon" title="Notifications"><Bell size={16} /></div>
            <ProfileDropdown
              user={currentUser}
              onLogout={handleLogout}
              onProfileClick={() => setActiveNav(currentUser.role === 'staff' ? 'staff-profile' : 'admin')}
            />
          </div>
        </header>

        {/* Outlier lock banner */}
        {report && hasOutlier && (
          <div className="lock-banner"><Lock size={13} /> Outlier Detected — Diagnosis Locked for Review</div>
        )}

        <div className="content-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <div>
              {currentUser.role === 'doctor' && (
                <>
                  <div className="sidebar-section">
                    <div className="sidebar-label">Clinical Workspace</div>
                  </div>
                  <nav className="sidebar-nav">
                    {doctorNav.map(item => (
                      <div
                        key={item.id}
                        className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`}
                        onClick={() => setActiveNav(item.id)}
                      >
                        <item.Icon size={15} /> {item.label}
                      </div>
                    ))}
                  </nav>
                </>
              )}

              {currentUser.role === 'staff' && (
                <nav className="sidebar-nav" style={{ marginTop: '10px' }}>
                  {staffNav.map((item, i) => {
                    if (item.section) {
                      return (
                        <div key={i} className="sidebar-section" style={{ marginTop: i > 0 ? '18px' : '0', marginBottom: '6px' }}>
                          <div className="sidebar-label">{item.section}</div>
                        </div>
                      )
                    }
                    return (
                      <div
                        key={item.id}
                        className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`}
                        onClick={() => setActiveNav(item.id)}
                      >
                        <item.Icon size={15} /> {item.label}
                      </div>
                    )
                  })}
                </nav>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="main-area">

            {/* ── ADMIN ── */}
            {activeNav === 'admin' && currentUser.role === 'doctor' ? (
              <AdminDashboard currentUser={currentUser} />

            /* ── UPLOAD (doctor) ── */
            ) : activeNav === 'upload' && currentUser.role === 'doctor' ? (
              <PatientUpload patients={patients} currentUser={currentUser} />

            /* ── STAFF VIEWS ── */
            ) : currentUser.role === 'staff' ? (
              <StaffViews activeNav={activeNav} />

            /* ── DOCTOR CLINICAL VIEWS ── */
            ) : (
              <>
                {/* Patient selector bar */}
                <div className="patient-selector-bar">
                  <span style={{ fontWeight: '700', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Patient:</span>
                  <select
                    className="patient-select"
                    value={selectedScenario || ''}
                    onChange={(e) => { setSelectedScenario(e.target.value); setReport(null) }}
                  >
                    <option value="" disabled>Select a patient…</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    className="analyze-btn"
                    onClick={runAnalysis}
                    disabled={!selectedScenario || loading}
                  >
                    {loading ? 'Analyzing…' : 'Run Analysis'}
                  </button>
                </div>

                {error && <div className="error-bar">⚠ {error}</div>}
                {loading && (
                  <div className="loading">
                    <div className="spinner" />
                    Running clinical analysis…
                  </div>
                )}

                {!report && !loading && (
                  <div className="empty-state">
                    <ClipboardList size={44} strokeWidth={1} style={{ color: '#94a3b8' }} />
                    <p>Select a patient and run analysis to view clinical data</p>
                    <p className="subtext">Or go to <strong>Upload Patient Data</strong> in the sidebar to import records</p>
                  </div>
                )}

                {report && (
                  <>
                    {/* Export bar */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        onClick={handlePDFExport}
                        className="analyze-btn"
                        style={{ background: '#fff', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                      >
                        ⬇ Download PDF
                      </button>
                    </div>

                    <div id="report-content">
                      <div className="dashboard-grid">

                        {/* Overview tab */}
                        {activeNav === 'overview' && (
                          <>
                            <ClinicalScores data={report.clinical_scores_summary} />
                            <VWRSCard data={report.vwrs_summary} />
                            <div className="full-width"><RiskFlags flags={report.risk_flags} /></div>
                          </>
                        )}

                        {/* Vitals & Labs tab */}
                        {activeNav === 'vitals' && (
                          <div className="full-width">
                            <TimelineChart timeline={report.disease_timeline} />
                          </div>
                        )}

                        {/* Alerts tab */}
                        {activeNav === 'alerts' && (
                          <>
                            <div className="full-width"><RiskFlags flags={report.risk_flags} /></div>
                            {report.outlier_alerts?.outliers_detected && (
                              <div className="full-width"><OutlierAlerts data={report.outlier_alerts} /></div>
                            )}
                            {report.amr_summary?.amr_detected && (
                              <div className="full-width"><AMRAlerts data={report.amr_summary} /></div>
                            )}
                          </>
                        )}

                        {/* Culture tab */}
                        {activeNav === 'culture' && (
                          <div className="full-width"><CultureData /></div>
                        )}

                        {/* AI Narrative tab */}
                        {activeNav === 'narrative' && (
                          <div className="full-width">
                            <Narrative data={report.ai_narrative} provenance={report.provenance_summary} />
                          </div>
                        )}

                      </div>

                      <div className="safety-disclaimer">
                        <ShieldAlert size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
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
