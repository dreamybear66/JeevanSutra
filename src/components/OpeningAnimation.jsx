import { useEffect, useState } from 'react';

export default function OpeningAnimation({ onComplete }) {
  const [phase, setPhase] = useState(0); // 0=enter, 1=pulse, 2=exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => onComplete(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`opening-overlay ${phase >= 2 ? 'exit' : ''}`}>
      <div className={`opening-content ${phase >= 1 ? 'visible' : ''}`}>
        <div className="opening-icon-wrapper">
          <div className="opening-icon-ring">
            <svg width="64" height="64" viewBox="0 0 32 32" fill="none" className="ecg-svg">
              <path d="M5 18h5.5l2-7 3.5 14 3.5-12 2 5H27" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ecg-line"/>
            </svg>
          </div>
          <div className="opening-shadow"></div>
        </div>
        <h1 className="opening-title">JeevanSutra</h1>
        <p className="opening-subtitle">ICU Diagnostic Risk Platform</p>
        <div className="opening-loader">
          <div className="opening-loader-bar" />
        </div>
      </div>
    </div>
  );
}
