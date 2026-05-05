import React from 'react';
import { User, Shield, Award, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function StaffProfile() {
  // Mock data for the currently logged in staff member
  const profile = {
    name: 'Sarah Jenkins',
    role: 'Senior ICU Nurse',
    employeeId: 'RN-98234-JS',
    department: 'Intensive Care Unit (ICU)',
    license: 'RN-88392110-TX',
    aclsRenewal: '2027-04-15',
    blsRenewal: '2026-11-20',
    currentRoster: [
      { bed: 'ICU-B12', patient: 'Patient A', status: 'Stable' },
      { bed: 'ICU-B14', patient: 'Patient B', status: 'Critical' },
      { bed: 'ICU-B15', patient: 'Patient C', status: 'Observation' }
    ],
    upcomingShifts: [
      { date: 'Today', time: '08:00 - 20:00' },
      { date: 'Tomorrow', time: '08:00 - 20:00' },
      { date: 'Thursday', time: 'Off' }
    ],
    handoverLog: [
      { date: 'Today, 07:45', type: 'Received', from: 'Nurse M.', patient: 'Patient B' },
      { date: 'Yesterday, 19:50', type: 'Generated', to: 'Nurse M.', patient: 'Patient C' }
    ]
  };

  return (
    <div className="staff-profile-container fade-in" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div className="search-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>
          Staff Profile
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your credentials, view assigned shifts, and recent handovers.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CREDENTIALS & IDENTITY BADGE */}
          <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '80px', background: 'linear-gradient(135deg, var(--blue-primary), var(--blue-dark))' }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)', padding: '4px', zIndex: 1, boxShadow: 'var(--shadow-md)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-dark)' }}>
                  <User size={40} />
                </div>
              </div>
              <h3 style={{ margin: '12px 0 4px 0', color: 'var(--text-main)', fontSize: '1.4rem' }}>{profile.name}</h3>
              <div style={{ padding: '4px 12px', background: 'var(--blue-light)', color: 'var(--blue-dark)', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '16px' }}>
                {profile.role}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Employee ID:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{profile.employeeId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Department:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{profile.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>License No:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{profile.license}</span>
              </div>
            </div>
          </div>

          {/* LICENSING & CERTIFICATIONS */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <Award size={20} color="var(--amber-primary)" /> Certifications
            </h4>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text-main)' }}>ACLS Renewal</strong>
                <span style={{ color: 'var(--green-primary)', fontWeight: 600 }}>Due: {profile.aclsRenewal}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: 'var(--green-primary)', borderRadius: '4px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text-main)' }}>BLS Renewal</strong>
                <span style={{ color: 'var(--amber-primary)', fontWeight: 600 }}>Due: {profile.blsRenewal}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', background: 'var(--amber-primary)', borderRadius: '4px' }}></div>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--amber-primary)', fontWeight: 600 }}>Action Required in 6 months.</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CURRENT ROSTER */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <Shield size={20} color="var(--blue-primary)" /> Current Roster (Assigned Beds)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {profile.currentRoster.map((patient, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{patient.patient}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bed: {patient.bed}</div>
                  </div>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700,
                    background: patient.status === 'Critical' ? 'var(--red-light)' : 'var(--green-light)',
                    color: patient.status === 'Critical' ? 'var(--red-primary)' : 'var(--green-dark)'
                  }}>
                    {patient.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* UPCOMING SCHEDULE */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <Calendar size={20} color="var(--text-muted)" /> Upcoming Schedule
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {profile.upcomingShifts.map((shift, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: i < profile.upcomingShifts.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <strong style={{ color: 'var(--text-main)' }}>{shift.date}</strong>
                  <span style={{ color: shift.time === 'Off' ? 'var(--text-muted)' : 'var(--blue-primary)', fontWeight: 600 }}>{shift.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SHIFT HANDOVER LOG */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <Clock size={20} color="var(--green-primary)" /> Recent Handover Log
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {profile.handoverLog.map((log, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>{log.date}</div>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{log.patient}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: log.type === 'Generated' ? 'var(--blue-primary)' : 'var(--green-primary)', fontWeight: 700, fontSize: '0.85rem', display: 'block' }}>{log.type}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{log.type === 'Generated' ? `To: ${log.to}` : `From: ${log.from}`}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
