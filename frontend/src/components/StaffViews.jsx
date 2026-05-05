import React from 'react';
import { Layers } from 'lucide-react';
import AddPatient from './AddPatient';
import SearchPatient from './SearchPatient';

import UploadLabReport from './UploadLabReport';

import PatientHistory from './PatientHistory';
import ShiftHandover from './ShiftHandover';
import StaffProfile from './StaffProfile';

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
