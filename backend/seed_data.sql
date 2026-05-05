-- ============================================================
-- Sanjeevani v2 — Seed Data (Run in Supabase SQL Editor)
-- Creates test users, patients, and sample clinical data
-- ============================================================

-- ── Test Users ──
-- Doctor: doctor001 / PIN: 123456
-- Staff:  nurse001  / PIN: 123456

INSERT INTO pin_access (identifier, role, display_name, pin_hash, is_active, must_rotate, failed_attempts) VALUES
('doctor001', 'doctor', 'Dr. Priya Sharma', '80948bef02c3749d4f24417d60df64e38bf50696e05d9f4d2947d10a2f66ebff', true, false, 0),
('nurse001', 'staff', 'Nurse Anita Patel', 'f2e5b6be62c0a280c36bfde4d544e6eb898eb533e50c5ca9e5f731b6117cef0f', true, false, 0)
ON CONFLICT DO NOTHING;

-- ── Test Patients ──
-- patient_id is auto-generated UUID, so we use INSERT ... RETURNING to get IDs

-- Patient 1: Sepsis Case
INSERT INTO patients (name, gender, bed_number, status, is_ventilated) VALUES
('Rajesh Kumar', 'M', 'ICU-B3', 'admitted', true);

-- Patient 2: Stable Case
INSERT INTO patients (name, gender, bed_number, status, is_ventilated) VALUES
('Meena Devi', 'F', 'ICU-A1', 'admitted', true);

-- Patient 3: Outlier Case
INSERT INTO patients (name, gender, bed_number, status, is_ventilated) VALUES
('Amit Singh', 'M', 'ICU-C5', 'admitted', true);

-- ── Vital Signs (using subquery to get patient_id by name) ──

-- Patient 1 vitals (sepsis — bad values)
INSERT INTO vital_signs (patient_id, recorded_at, heart_rate, systolic_bp, diastolic_bp, mean_arterial_pressure, respiratory_rate, temperature, spo2, fio2, gcs_total, peep, tidal_volume, on_vasopressors, vasopressor_name, vasopressor_dose) VALUES
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 118, 82, 48, 59, 28, 39.2, 88, 0.6, 12, 8, 380, true, 'dopamine', 12.0);

-- Patient 2 vitals (stable — normal values)
INSERT INTO vital_signs (patient_id, recorded_at, heart_rate, systolic_bp, diastolic_bp, mean_arterial_pressure, respiratory_rate, temperature, spo2, fio2, gcs_total, peep, tidal_volume, on_vasopressors, vasopressor_dose) VALUES
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), now(), 78, 120, 75, 90, 16, 37.0, 97, 0.21, 15, 5, 450, false, 0);

-- Patient 3 vitals (outlier case)
INSERT INTO vital_signs (patient_id, recorded_at, heart_rate, systolic_bp, diastolic_bp, mean_arterial_pressure, respiratory_rate, temperature, spo2, fio2, gcs_total, peep, tidal_volume, on_vasopressors, vasopressor_name, vasopressor_dose) VALUES
((SELECT patient_id FROM patients WHERE name='Amit Singh' LIMIT 1), now(), 105, 95, 55, 68, 24, 38.8, 91, 0.45, 13, 6, 400, true, 'norepinephrine', 5.0);

-- ── Lab Results for Patient 1 (Sepsis - abnormal values) ──
INSERT INTO lab_results (patient_id, recorded_at, parameter_name, value, unit) VALUES
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'potassium', 5.8, 'mmol/L'),
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'sodium', 132, 'mmol/L'),
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'creatinine', 2.8, 'mg/dL'),
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'bilirubin', 3.5, 'mg/dL'),
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'platelets', 85, '×10³/μL'),
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'wbc', 18.5, '×10³/μL'),
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'lactate', 4.2, 'mmol/L'),
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'hemoglobin', 9.2, 'g/dL'),
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'pao2', 62, 'mmHg'),
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'paco2', 48, 'mmHg'),
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'pH', 7.28, '');

-- ── Lab Results for Patient 2 (Stable - normal values) ──
INSERT INTO lab_results (patient_id, recorded_at, parameter_name, value, unit) VALUES
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), now(), 'potassium', 4.1, 'mmol/L'),
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), now(), 'sodium', 140, 'mmol/L'),
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), now(), 'creatinine', 0.9, 'mg/dL'),
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), now(), 'bilirubin', 0.8, 'mg/dL'),
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), now(), 'platelets', 220, '×10³/μL'),
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), now(), 'wbc', 7.5, '×10³/μL'),
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), now(), 'lactate', 1.1, 'mmol/L'),
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), now(), 'hemoglobin', 13.5, 'g/dL'),
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), now(), 'pao2', 95, 'mmHg');

-- ── Lab Results for Patient 3 (Outlier - impossible potassium) ──
INSERT INTO lab_results (patient_id, recorded_at, parameter_name, value, unit) VALUES
((SELECT patient_id FROM patients WHERE name='Amit Singh' LIMIT 1), now(), 'potassium', 14.0, 'mmol/L'),
((SELECT patient_id FROM patients WHERE name='Amit Singh' LIMIT 1), now(), 'sodium', 138, 'mmol/L'),
((SELECT patient_id FROM patients WHERE name='Amit Singh' LIMIT 1), now(), 'creatinine', 3.5, 'mg/dL'),
((SELECT patient_id FROM patients WHERE name='Amit Singh' LIMIT 1), now(), 'bilirubin', 2.1, 'mg/dL'),
((SELECT patient_id FROM patients WHERE name='Amit Singh' LIMIT 1), now(), 'platelets', 110, '×10³/μL'),
((SELECT patient_id FROM patients WHERE name='Amit Singh' LIMIT 1), now(), 'wbc', 15.2, '×10³/μL'),
((SELECT patient_id FROM patients WHERE name='Amit Singh' LIMIT 1), now(), 'lactate', 3.8, 'mmol/L');

-- ── Clinical Notes (stored as raw_data with type='note') ──
INSERT INTO raw_data (patient_id, data_type, raw_content, status) VALUES
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), 'note', 'Pt febrile since yesterday, temp 39.2. Productive cough with yellowish sputum. BP dropping, started on dopamine 12 mcg/kg/min. Culture shows MRSA. Decreased urine output, Cr rising from 1.5 to 2.8. GCS 12, drowsy but arousable.', 'completed'),
((SELECT patient_id FROM patients WHERE name='Meena Devi' LIMIT 1), 'note', 'Patient stable, vitals within normal range. Tolerating oral feeds. Urine output adequate. Plan for step-down to ward tomorrow if continued improvement.', 'completed'),
((SELECT patient_id FROM patients WHERE name='Amit Singh' LIMIT 1), 'note', 'Patient with rising creatinine and suspected AKI. Lab reports show potassium 14.0 which appears to be a lab error - repeat sample sent. MRSA positive from wound culture. On meropenem, considering switch to vancomycin.', 'completed');

-- ── Culture Report for Patient 1 (MRSA) ──
INSERT INTO culture_reports (patient_id, collected_at, specimen_type, organism, sensitivity, report_text) VALUES
((SELECT patient_id FROM patients WHERE name='Rajesh Kumar' LIMIT 1), now(), 'blood', 'MRSA', '{"vancomycin":"sensitive","methicillin":"resistant","oxacillin":"resistant","linezolid":"sensitive"}', 'Blood culture positive for MRSA. Methicillin-resistant Staphylococcus aureus isolated.');

-- ── Culture Report for Patient 3 (MRSA wound) ──
INSERT INTO culture_reports (patient_id, collected_at, specimen_type, organism, sensitivity, report_text) VALUES
((SELECT patient_id FROM patients WHERE name='Amit Singh' LIMIT 1), now(), 'wound', 'MRSA', '{"vancomycin":"sensitive","methicillin":"resistant","linezolid":"sensitive","daptomycin":"sensitive"}', 'Wound culture positive for MRSA. Multi-drug resistant organism detected.');
