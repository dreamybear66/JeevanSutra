import React, { useState, useEffect } from 'react';
import { Search, Clock, AlertTriangle, Bug, Activity, ShieldAlert } from 'lucide-react';

const SUPABASE_URL = 'https://emrwxnshrcmnktotkadi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcnd4bnNocmNtbmt0b3RrYWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDg5MDYsImV4cCI6MjA5MzQ4NDkwNn0.kPf4Fem2pcdj2R-nb1o0jtuQ_GPgjLurUiKWnLia4-s';

export default function PatientHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Historical data state (mocked or fetched)
  const [historyData, setHistoryData] = useState(null);

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

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setSearchTerm('');
    setResults([]);
    
    // In a real app, we would fetch from a history table here.
    // We will provide a rich mock representation for the demo that looks realistic.
    setHistoryData({
      allergies: ['Penicillin', 'Sulfa Drugs'],
      chronicConditions: ['Type 2 Diabetes', 'Hypertension (Stage 2)'],
      historicalInfections: [
        { bug: 'MRSA (Methicillin-Resistant S. aureus)', date: '2025-11-14', site: 'Wound' },
        { bug: 'E. coli (ESBL-producing)', date: '2024-03-22', site: 'Urinary Tract' }
      ],
      admissions: [
        { date: '2026-05-01', reason: 'Acute Respiratory Distress Syndrome (ARDS)', duration: 'Current' },
        { date: '2025-11-10', reason: 'Surgical Site Infection (Post-appendectomy)', duration: '8 days' },
        { date: '2023-01-05', reason: 'Diabetic Ketoacidosis', duration: '4 days' }
      ]
    });
  };

  return (
    <div className="patient-history-container" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div className="search-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>
          Patient History
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Review longitudinal timeline of patient stays, past diagnoses, and critical alerts.</p>
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
              placeholder="Search patient to view history..."
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

      {/* HISTORY SECTION */}
      {selectedPatient && historyData && (
        <div className="history-section fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-medium)' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>{selectedPatient.name}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ID: {selectedPatient.patient_id.substring(0, 8)}</p>
            </div>
            <button 
              onClick={() => setSelectedPatient(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--blue-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Change Patient
            </button>
          </div>

          {/* ALLERGIES & ALERTS BANNER */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'var(--red-light)', border: '1px solid var(--red-primary)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--red-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <ShieldAlert size={20} /> Critical Alerts & Allergies
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Allergies:</strong>
                <ul style={{ margin: '8px 0 0 16px', color: 'var(--red-primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                  {historyData.allergies.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Chronic Conditions:</strong>
                <ul style={{ margin: '8px 0 0 16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  {historyData.chronicConditions.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* HISTORICAL INFECTIONS */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <Bug size={20} color="var(--amber-primary)" /> Past Infections (AMR Context)
            </h4>
            {historyData.historicalInfections.map((inf, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid var(--amber-primary)' }}>
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>{inf.bug}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Site: {inf.site}</div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {inf.date}
                </div>
              </div>
            ))}
          </div>

          {/* ADMISSIONS TIMELINE */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <Activity size={20} color="var(--blue-primary)" /> Past Admissions Timeline
            </h4>
            <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--border-medium)' }}>
              {historyData.admissions.map((adm, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '24px' }}>
                  <div style={{ position: 'absolute', left: '-33px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: i === 0 ? 'var(--blue-primary)' : 'var(--border-medium)', border: '3px solid var(--bg-card)' }}></div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>{adm.reason}</div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {adm.date}
                    </span>
                    <span style={{ color: i === 0 ? 'var(--green-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                      Duration: {adm.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
