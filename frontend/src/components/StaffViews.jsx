import React from 'react';
import { 
  UserPlus, Search, Bed, LayoutDashboard, Activity, 
  UploadCloud, FileText, Clock, Users, User, Layers 
} from 'lucide-react';
import AddPatient from './AddPatient';
import SearchPatient from './SearchPatient';

import UploadLabReport from './UploadLabReport';

import PatientHistory from './PatientHistory';
import ShiftHandover from './ShiftHandover';
import StaffProfile from './StaffProfile';

const PlaceholderView = ({ title, icon: Icon, description }) => (
  <div className="glass-card" style={{ padding: '40px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
    <Icon size={48} style={{ color: 'var(--blue)', opacity: 0.8 }} />
    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{title}</h2>
    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>{description}</p>
    <div style={{ marginTop: '20px', display: 'inline-flex', padding: '10px 20px', background: 'var(--bg-white)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
      Module Pending Implementation
    </div>
  </div>
);

export default function StaffViews({ activeNav }) {
  switch (activeNav) {
    case 'patient-add':
      return <AddPatient />;
    case 'patient-search':
      return <SearchPatient />;
    case 'upload-lab':
      return <UploadLabReport />;
    case 'history':
      return <PatientHistory />;
    case 'handover':
      return <ShiftHandover />;
    case 'staff-profile':
      return <StaffProfile />;
    default:
      return (
        <div className="empty-state">
          <Layers size={44} strokeWidth={1} style={{ color: '#94a3b8' }} />
          <p>Select an option from the sidebar</p>
        </div>
      );
  }
}
