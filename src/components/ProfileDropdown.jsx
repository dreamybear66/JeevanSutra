import { useState, useRef, useEffect } from 'react'
import { LogOut, User, Shield, ChevronDown } from 'lucide-react'

export default function ProfileDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const roleBadgeClass = user.role === 'doctor' ? 'role-doctor'
    : user.role === 'staff' ? 'role-staff' : 'role-patient'

  return (
    <div className="profile-dropdown-wrap" ref={ref}>
      <div className="profile-trigger" onClick={() => setOpen(!open)}>
        <div className="header-avatar">{user.display_name.charAt(0)}</div>
        <ChevronDown size={12} style={{ color: '#90a4ae', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </div>

      {open && (
        <div className="profile-dropdown">
          <div className="profile-info">
            <div className="profile-avatar-lg">{user.display_name.charAt(0)}</div>
            <div>
              <div className="profile-name">{user.display_name}</div>
              <div className="profile-id">{user.identifier}</div>
            </div>
          </div>
          <div className="profile-role-row">
            <Shield size={12} />
            <span className={`profile-role-badge ${roleBadgeClass}`}>{user.role.toUpperCase()}</span>
          </div>
          <div className="profile-divider" />
          <div className="profile-menu-item" onClick={() => { setOpen(false) }}>
            <User size={14} /> My Profile
          </div>
          <div className="profile-menu-item logout" onClick={() => { setOpen(false); onLogout() }}>
            <LogOut size={14} /> Sign Out
          </div>
        </div>
      )}
    </div>
  )
}
