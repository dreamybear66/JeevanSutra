import React, { useState, useEffect } from 'react';
import { Search, User, Activity, Bed, Calendar, Stethoscope, FileText, AlertCircle } from 'lucide-react';

const SUPABASE_URL = 'https://emrwxnshrcmnktotkadi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcnd4bnNocmNtbmt0b3RrYWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDg5MDYsImV4cCI6MjA5MzQ4NDkwNn0.kPf4Fem2pcdj2R-nb1o0jtuQ_GPgjLurUiKWnLia4-s';

export default function SearchPatient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }


      setLoading(true);
      setError(null);

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

        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }

        const data = await response.json();
        
        // HARDCODED_TEST_DATA_START
        if (searchTerm.toLowerCase().includes('demo') || searchTerm.toLowerCase().includes('test')) {
          data.push({
            patient_id: 'demo-1234-5678-90ab',
            name: 'Demo Test Patient',
            gender: 'M',
            status: 'admitted',
            is_ventilated: true,
            bed_number: 'ICU-04',
            admission_timestamp: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        // HARDCODED_TEST_DATA_END
        
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPatients, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className="search-patient-container" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="search-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
          Search Patient Records
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Find patient details across all ward and historical databases.</p>
      </div>

      <div className="search-bar-wrapper" style={{ position: 'relative', marginBottom: '32px' }}>
        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Start typing patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '16px 16px 16px 48px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            background: 'var(--bg-white)',
            fontSize: '1.1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            outline: 'none',
            color: 'var(--text)'
          }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
          </div>
        )}
      </div>

      {error && (
        <div className="alert-banner" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #f87171', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="search-results">
        {searchTerm && results.length === 0 && !loading && !error && (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-white)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
            <User size={48} style={{ margin: '0 auto', color: 'var(--text-muted)', opacity: 0.5, marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text)', fontWeight: 600 }}>No patients found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search terms</p>
          </div>
        )}

        {results.map((patient) => (
          <div key={patient.patient_id} className="patient-card glass-card" style={{ padding: '24px', marginBottom: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg-white)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--blue-light)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{patient.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <User size={14} /> {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} /> ID: {patient.patient_id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '99px', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  background: patient.status === 'admitted' ? 'var(--blue-light)' : '#f3f4f6', 
                  color: patient.status === 'admitted' ? 'var(--blue)' : '#4b5563',
                  textTransform: 'capitalize'
                }}>
                  {patient.status}
                </span>
                {patient.is_ventilated && (
                  <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, background: '#fef2f2', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={12} /> Ventilated
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '8px', color: '#4b5563' }}>
                  <Bed size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bed Number</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{patient.bed_number || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '8px', color: '#4b5563' }}>
                  <Calendar size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Admission Date</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {patient.admission_timestamp ? new Date(patient.admission_timestamp).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '8px', color: '#4b5563' }}>
                  <Stethoscope size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last Updated</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {patient.updated_at ? new Date(patient.updated_at).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
