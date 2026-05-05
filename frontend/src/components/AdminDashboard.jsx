import { useState, useEffect } from 'react'
import { ShieldCheck, Users, Settings as SettingsIcon, AlertTriangle } from 'lucide-react'

export default function AdminDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('audit')
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs()
    }
  }, [activeTab])

  const fetchAuditLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:8000/api/security-audit?limit=100')
      if (!response.ok) throw new Error('Failed to fetch audit logs')
      const data = await response.json()
      setAuditLogs(data.events || [])
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderAuditTab = () => (
    <div className="admin-card">
      <div className="admin-card-header">
        <ShieldCheck size={20} className="text-blue" />
        <h3>Security Audit Logs</h3>
      </div>
      <p className="admin-card-desc">Comprehensive trail of authentication and access events.</p>
      
      {error && <div className="alert-box error"><AlertTriangle size={16}/> {error}</div>}
      
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor ID</th>
              <th>Role</th>
              <th>Action</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center">Loading logs...</td></tr>
            ) : auditLogs.length === 0 ? (
              <tr><td colSpan="6" className="text-center">No security events found.</td></tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="text-muted">{new Date(log.occurred_at).toLocaleString()}</td>
                  <td className="font-mono">{log.actor_identifier}</td>
                  <td>
                    <span className={`role-badge role-${log.actor_role}`}>{log.actor_role}</span>
                  </td>
                  <td className="font-bold">{log.action}</td>
                  <td>
                    <span className={`status-badge ${log.status === 'success' ? 'status-success' : 'status-danger'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="text-muted">{log.detail || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderRulesTab = () => (
    <div className="admin-card">
      <div className="admin-card-header">
        <SettingsIcon size={20} className="text-moderate" />
        <h3>System Rules Configuration</h3>
      </div>
      <p className="admin-card-desc">Active deterministic thresholds loaded from YAML configurations.</p>
      
      <div className="rules-grid">
        <div className="rule-box">
          <h4>Sepsis-3 (SOFA)</h4>
          <ul>
            <li><strong>Respiratory:</strong> PaO2/FiO2 &lt; 400 (Score 1-4)</li>
            <li><strong>Coagulation:</strong> Platelets &lt; 150k (Score 1-4)</li>
            <li><strong>Liver:</strong> Bilirubin &gt; 1.2 mg/dL (Score 1-4)</li>
            <li><strong>Cardiovascular:</strong> MAP &lt; 70 or Vasopressors (Score 1-4)</li>
            <li><strong>CNS:</strong> GCS &lt; 15 (Score 1-4)</li>
            <li><strong>Renal:</strong> Creatinine &gt; 1.2 mg/dL (Score 1-4)</li>
          </ul>
        </div>
        <div className="rule-box">
          <h4>Ventilator Weaning (VWRS)</h4>
          <ul>
            <li><strong>RSBI:</strong> &lt; 105 (Ready)</li>
            <li><strong>SpO2/FiO2:</strong> &gt; 200 (Ready)</li>
            <li><strong>PEEP:</strong> &lt; 8 cmH2O (Ready)</li>
            <li><strong>GCS:</strong> &gt; 13 (Ready)</li>
          </ul>
        </div>
      </div>
    </div>
  )

  const renderUsersTab = () => {
    const staff = [
      { id: 'doctor001', name: 'Dr. Sarah Chen', role: 'doctor', status: 'Active', lastLogin: 'Just now' },
      { id: 'staff_nurse_1', name: 'James Wilson', role: 'staff', status: 'Active', lastLogin: '2 hours ago' },
      { id: 'admin_sys', name: 'System Admin', role: 'doctor', status: 'Offline', lastLogin: '1 day ago' },
    ]
    const patients = [
      { id: 'PT-7728', name: 'John Doe', status: 'Admitted', bed: 'ICU-04' },
      { id: 'PT-9912', name: 'Maria Garcia', status: 'Discharged', bed: 'N/A' },
    ]

    return (
      <div className="admin-card">
        <div className="admin-card-header">
          <Users size={20} className="text-emerald" />
          <h3>Directory Management</h3>
        </div>
        <p className="admin-card-desc">Manage clinical staff access and view admitted patients.</p>
        
        <div className="users-section">
          <h4 className="section-title">Clinical Staff</h4>
          <div className="table-responsive mb-4">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Identifier</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id}>
                    <td className="font-mono">{s.id}</td>
                    <td className="font-bold">{s.name}</td>
                    <td><span className={`role-badge role-${s.role}`}>{s.role}</span></td>
                    <td><span className={`status-badge ${s.status === 'Active' ? 'status-success' : 'status-danger'}`}>{s.status}</span></td>
                    <td className="text-muted">{s.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="section-title">Patient Roster</h4>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Admission Status</th>
                  <th>Bed Assignment</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono">{p.id}</td>
                    <td className="font-bold">{p.name}</td>
                    <td><span className={`status-badge ${p.status === 'Admitted' ? 'status-success' : 'status-danger'}`}>{p.status}</span></td>
                    <td>{p.bed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>System Administration</h2>
        <p>Manage security protocols, users, and clinical rules.</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <ShieldCheck size={16} /> Audit Logs
        </button>
        <button 
          className={`admin-tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <SettingsIcon size={16} /> Clinical Rules
        </button>
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> User Management
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'audit' && renderAuditTab()}
        {activeTab === 'rules' && renderRulesTab()}
        {activeTab === 'users' && renderUsersTab()}
      </div>
    </div>
  )
}
