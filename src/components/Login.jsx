import { useState } from 'react'
import { Lock, User, KeyRound, ArrowRight } from 'lucide-react'

export default function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState('')
  const [role, setRole] = useState('doctor')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!identifier || !pin) {
      setError('Please enter identifier and PIN')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, role, pin }),
      })

      if (!res.ok) {
        throw new Error('Invalid credentials')
      }

      const data = await res.json()
      if (data.status === 'success') {
        onLogin(data.user)
      } else {
        throw new Error(data.detail || 'Login failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#1565c0"/>
              <path d="M4 18h6l2-6 3 12 3-10 2 4h8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="16" cy="8" r="2.5" fill="#4fc3f7" opacity=".7"/>
            </svg>
          </div>
          <h2>Welcome to JeevanSutra</h2>
          <p>ICU Diagnostic Risk Assistant</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Role</label>
            <div className="input-wrapper">
              <User size={16} className="input-icon" />
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="doctor">Doctor</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Identifier</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input 
                type="text" 
                placeholder="e.g. doctor001" 
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
              />
            </div>
          </div>

          <div className="input-group">
            <label>PIN Code</label>
            <div className="input-wrapper">
              <KeyRound size={16} className="input-icon" />
              <input 
                type="password" 
                placeholder="Enter 6-digit PIN" 
                value={pin} 
                onChange={e => setPin(e.target.value)} 
              />
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Authenticating...' : 'Access Pipeline'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="login-footer">
          <p>Secure Clinical Access Only</p>
        </div>
      </div>
    </div>
  )
}
