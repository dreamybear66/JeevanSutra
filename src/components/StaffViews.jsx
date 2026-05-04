import React from 'react';
import { 
  UserPlus, Search, Bed, LayoutDashboard, Activity, 
  UploadCloud, FileText, Clock, Users, User, Layers 
} from 'lucide-react';

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
      return <PlaceholderView title="Add New Patient" icon={UserPlus} description="Enter details to register a new patient into the ICU system." />;
    case 'patient-search':
      return <PlaceholderView title="Search Patient" icon={Search} description="Search through active and historical patient records." />;
    case 'patient-bed':
      return <PlaceholderView title="Bed Allocation" icon={Bed} description="Assign and manage bed allocations for incoming patients." />;
    case 'ward-view':
      return <PlaceholderView title="Bed/Ward View" icon={LayoutDashboard} description="Visual overview of the ICU ward, current occupancy, and high-risk alerts at a glance." />;
    case 'vitals-entry':
      return <PlaceholderView title="Vitals Entry" icon={Activity} description="Manual entry interface for patient vitals, integrating directly into the rule engine." />;
    case 'upload-lab':
      return <PlaceholderView title="Upload Lab Reports" icon={UploadCloud} description="Upload and OCR lab reports (CBC, CMP, ABG) for automated ingestion." />;
    case 'upload-culture':
      return <PlaceholderView title="Upload Culture Reports" icon={UploadCloud} description="Upload microbiological data, gram stains, and AMR sensitivities." />;
    case 'notes':
      return <PlaceholderView title="Notes & Observations" icon={FileText} description="Add clinical observations, nursing notes, and specific patient behaviors." />;
    case 'history':
      return <PlaceholderView title="Patient History" icon={Clock} description="Review longitudinal timeline of patient stays, past diagnoses, and treatments." />;
    case 'handover':
      return <PlaceholderView title="Shift Handover" icon={Users} description="Generate and review standardized SBAR handovers for the next nursing shift." />;
    case 'staff-profile':
      return <PlaceholderView title="Staff Profile" icon={User} description="Manage your credentials, view assigned shifts, and update notification preferences." />;
    default:
      return (
        <div className="empty-state">
          <Layers size={44} strokeWidth={1} style={{ color: '#94a3b8' }} />
          <p>Select an option from the sidebar</p>
        </div>
      );
  }
}
