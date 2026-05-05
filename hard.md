# Hardcoded Data Tracker

The following files contain hardcoded data that must be deleted before production:

## 1. `frontend/src/components/SearchPatient.jsx`
- **Location:** Inside `fetchPatients` effect.
- **Data:** Injects a "Demo Patient" (`patient_id: 'demo-1234-5678-90ab'`) if the search term includes "demo".
- **Purpose:** To test the Patient Search feature without needing an active database connection.

## 2. `frontend/src/components/PatientHistory.jsx`
- **Location:** Inside `fetchPatients` effect.
- **Data:** Injects a "Demo Patient" (`patient_id: 'demo-1234-5678-90ab'`) if the search term includes "demo".
- **Purpose:** To test the Patient History and Timeline selection flow.

## 3. `frontend/src/components/ShiftHandover.jsx`
- **Location:** Inside `fetchPatients` effect.
- **Data:** Injects a "Demo Patient" (`patient_id: 'demo-1234-5678-90ab'`) if the search term includes "demo".
- **Purpose:** To test the SBAR Shift Handover generation flow.

## 4. `frontend/src/components/Login.jsx` (Pre-existing)
- **Location:** Inside `handleLogin` function.
- **Data:** Bypasses authentication for credentials (`doctor001`/`staff001` and `123456`, or `admin`/`demo`).
- **Purpose:** To test login flow without needing the auth backend.
