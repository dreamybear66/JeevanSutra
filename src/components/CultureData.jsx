import { Beaker, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function CultureData() {
  return (
    <div className="card glass-card fade-in">
      <div className="card-header">
        <span className="card-title"><Beaker size={18}/> Reports & Culture Data</span>
        <span className="badge badge-ai">LAB SYSTEM</span>
      </div>
      
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
        <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
          <ShieldCheck size={16} className="text-blue" style={{color: 'var(--blue)'}}/>
          Blood Culture: Pending (48h)
        </h4>
        <p className="narrative-text">Preliminary gram stain: Gram-positive cocci in clusters. Final identification and sensitivities pending. Continue broad-spectrum coverage as per protocol.</p>
      </div>

      <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--red)' }}>
        <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)' }}>
          <AlertTriangle size={16} />
          Sputum Culture: Final Report
        </h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '12px' }}>
          <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Organism:</span>
          <span style={{ fontWeight: '700', color: 'var(--text)' }}>Staphylococcus aureus (MRSA)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{color: 'var(--text-secondary)'}}>Oxacillin</span>
            <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>Resistant</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{color: 'var(--text-secondary)'}}>Vancomycin</span>
            <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>Susceptible</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{color: 'var(--text-secondary)'}}>Linezolid</span>
            <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>Susceptible</span>
          </div>
        </div>
      </div>
    </div>
  );
}
