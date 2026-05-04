import React, { useState, useEffect } from 'react';
import { Search, Users, Activity, FileText, CheckCircle } from 'lucide-react';

const SUPABASE_URL = 'https://emrwxnshrcmnktotkadi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcnd4bnNocmNtbmt0b3RrYWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDg5MDYsImV4cCI6MjA5MzQ4NDkwNn0.kPf4Fem2pcdj2R-nb1o0jtuQ_GPgjLurUiKWnLia4-s';

export default function ShiftHandover() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Handover state
  const [recommendation, setRecommendation] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }


      setLoading(true);

      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/patients?select=*&name=ilike.*${encodeURIComponent(searchTerm)}*`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Failed to search patients', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPatients, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm('');
    setResults([]);
    setRecommendation('');
    setIsGenerated(false);
    setIsAcknowledged(false);
  };

  const handleGenerate = () => {
    if (!recommendation.trim()) return;
    setIsGenerated(true);
  };

  const handleAcknowledge = () => {
    setIsAcknowledged(true);
  };

  return (
    <div className="handover-container" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div className="search-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>
          SBAR Shift Handover
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Generate and review standardized SBAR handovers for the next nursing shift.</p>
      </div>

      {/* SEARCH SECTION */}
      {!selectedPatient && (
        <>
          <div className="search-bar-wrapper" style={{ position: 'relative', marginBottom: '16px' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search patient to handover..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '16px 16px 16px 48px',
                borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)',
                background: 'var(--bg-card)', fontSize: '1.1rem',
                outline: 'none', color: 'var(--text-main)'
              }}
            />
            {loading && (
              <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
              </div>
            )}
          </div>

          <div className="search-results">
            {results.map((patient) => (
              <div 
                key={patient.patient_id} 
                onClick={() => handlePatientSelect(patient)}
                className="glass-card" 
                style={{ padding: '16px', marginBottom: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--blue-light)', color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-main)' }}>{patient.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    ID: {patient.patient_id.substring(0, 8)} | Bed: {patient.bed_number || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SBAR FORM */}
      {selectedPatient && (
        <div className="sbar-section fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-medium)' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>{selectedPatient.name}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bed: {selectedPatient.bed_number || 'N/A'} | ID: {selectedPatient.patient_id.substring(0, 8)}</p>
            </div>
            <button 
              onClick={() => setSelectedPatient(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--blue-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
              disabled={isGenerated && !isAcknowledged}
            >
              Change Patient
            </button>
          </div>

          <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* S - Situation */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--blue-light)', color: 'var(--blue-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>S</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--blue-dark)' }}>Situation</h4>
                <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  Patient <strong>{selectedPatient.name}</strong> ({selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : 'Other'}) admitted to <strong>{selectedPatient.bed_number || 'ICU'}</strong>. Currently marked as {selectedPatient.status}.
                </div>
              </div>
            </div>

            {/* B - Background */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f3e8ff', color: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>B</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#6b21a8' }}>Background</h4>
                <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  Admission Date: {selectedPatient.admission_timestamp ? new Date(selectedPatient.admission_timestamp).toLocaleDateString() : 'N/A'}. 
                  <br/>Patient has a history of Type 2 Diabetes and Hypertension. Penicillin Allergy.
                </div>
              </div>
            </div>

            {/* A - Assessment */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--red-light)', color: 'var(--red-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>A</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--red-primary)' }}>Assessment (Auto-Pulled)</h4>
                <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Activity size={16} color="var(--red-primary)" /> Latest Vitals: HR 110, BP 90/60, SpO2 92%
                  </div>
                  <div style={{ color: 'var(--red-primary)', fontWeight: 600 }}>Active Alert: High Risk for AMR Infection (MRSA History detected). SOFA Score: 4</div>
                </div>
              </div>
            </div>

            {/* R - Recommendation */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--green-light)', color: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>R</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--green-dark)' }}>Recommendation</h4>
                {isGenerated ? (
                  <div style={{ padding: '16px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '1rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                    {recommendation}
                  </div>
                ) : (
                  <textarea
                    placeholder="Enter handover recommendations for the incoming shift (e.g. 'Check potassium at 08:00 AM, monitor fluid intake')..."
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    style={{
                      width: '100%', padding: '16px', minHeight: '120px',
                      borderRadius: '8px', border: '1px solid var(--border-medium)',
                      background: 'var(--bg-app)', fontSize: '1rem',
                      fontFamily: 'inherit', outline: 'none', color: 'var(--text-main)', resize: 'vertical'
                    }}
                  />
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--border-medium)', paddingTop: '24px' }}>
              {!isGenerated ? (
                <button 
                  className="btn-primary"
                  onClick={handleGenerate}
                  disabled={!recommendation.trim()}
                  style={{ 
                    background: !recommendation.trim() ? 'var(--border-medium)' : 'var(--blue-primary)', 
                    color: !recommendation.trim() ? 'var(--text-muted)' : 'white', 
                    border: 'none', padding: '12px 32px', borderRadius: 'var(--radius-md)', 
                    cursor: !recommendation.trim() ? 'not-allowed' : 'pointer', 
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <FileText size={18} /> Generate Handover
                </button>
              ) : !isAcknowledged ? (
                <button 
                  className="btn-primary"
                  onClick={handleAcknowledge}
                  style={{ 
                    background: 'var(--green-primary)', 
                    color: 'white', 
                    border: 'none', padding: '12px 32px', borderRadius: 'var(--radius-md)', 
                    cursor: 'pointer', 
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <Users size={18} /> Acknowledge & Accept Patient
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-dark)', fontWeight: 700, padding: '12px 24px', background: 'var(--green-light)', borderRadius: 'var(--radius-md)' }}>
                  <CheckCircle size={20} /> Shift Handover Completed
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
