import { useState } from 'react'

const SUPABASE_URL = 'https://emrwxnshrcmnktotkadi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcnd4bnNocmNtbmt0b3RrYWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDg5MDYsImV4cCI6MjA5MzQ4NDkwNn0.kPf4Fem2pcdj2R-nb1o0jtuQ_GPgjLurUiKWnLia4-s';
import {
  UserPlus, ChevronDown, ChevronUp, ClipboardList, Stethoscope,
  Check, AlertCircle, Plus, X, Save, RotateCcw
} from 'lucide-react'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = ['Male', 'Female', 'Other']
const WARDS = ['ICU', 'MICU', 'SICU', 'NICU', 'PICU', 'CCU', 'HDU', 'General Ward']
const ADMISSION_TYPES = ['Emergency', 'Elective', 'Transfer', 'Referral']
const ADMISSION_SOURCES = ['Emergency Room', 'OPD', 'Transfer from another hospital', 'Direct Admission']
const PRIORITY_LEVELS = ['Critical', 'Urgent', 'Standard']

const MEDICAL_HISTORY_CATEGORIES = [
  { value: 'allergies', label: 'Allergies (Drug / Food / Environmental)' },
  { value: 'chronic_conditions', label: 'Chronic Conditions' },
  { value: 'previous_surgeries', label: 'Previous Surgeries' },
  { value: 'current_medications', label: 'Current Medications' },
  { value: 'family_history', label: 'Family History' },
  { value: 'substance_use', label: 'Smoking / Alcohol / Substance Use' },
]

const DEMO_DOCTORS = [
  'Dr. Sharma (Intensivist)',
  'Dr. Patel (Pulmonologist)',
  'Dr. Gupta (Cardiologist)',
  'Dr. Reddy (Neurologist)',
  'Dr. Iyer (Surgeon)',
  'Dr. Khan (Anesthesiologist)',
]

const DEMO_BEDS = [
  'ICU-01', 'ICU-02', 'ICU-03', 'ICU-04',
  'MICU-01', 'MICU-02',
  'CCU-01', 'CCU-02',
  'HDU-01', 'HDU-02', 'HDU-03',
]

const initialForm = {
  // Demographics
  name: '',
  age: '',
  gender: '',
  blood_group: '',
  phone: '',
  address: '',
  // Admission
  admission_datetime: new Date().toISOString().slice(0, 16),
  admitting_doctor: '',
  ward: '',
  bed_number: '',
  admission_type: '',
  admission_source: '',
  primary_diagnosis: '',
  priority_level: '',
}

/* ── Collapsible Section Wrapper ── */
function FormSection({ title, icon: Icon, isOpen, onToggle, children, badge }) {
  return (
    <div className={`form-section ${isOpen ? 'open' : ''}`}>
      <button type="button" className="form-section-header" onClick={onToggle}>
        <div className="form-section-header-left">
          <Icon size={18} />
          <span>{title}</span>
          {badge && <span className="form-section-badge">{badge}</span>}
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {isOpen && <div className="form-section-body">{children}</div>}
    </div>
  )
}

/* ── Reusable Form Field ── */
function Field({ label, required, error, children }) {
  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label className="form-label">
        {label} {required && <span className="required-star">*</span>}
      </label>
      {children}
      {error && <span className="form-error"><AlertCircle size={12} /> {error}</span>}
    </div>
  )
}


export default function AddPatient() {
  const [form, setForm] = useState({ ...initialForm })
  const [errors, setErrors] = useState({})
  const [openSections, setOpenSections] = useState({ demographics: true, admission: false, history: false })
  const [medicalHistory, setMedicalHistory] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  /* ── Medical History: add a new category entry ── */
  const addHistoryCategory = () => {
    if (!selectedCategory) return
    // Don't add duplicate categories
    if (medicalHistory.some(h => h.category === selectedCategory)) return
    const catLabel = MEDICAL_HISTORY_CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory
    setMedicalHistory(prev => [...prev, { category: selectedCategory, label: catLabel, details: '' }])
    setSelectedCategory('')
  }

  const updateHistoryDetails = (index, details) => {
    setMedicalHistory(prev => prev.map((h, i) => i === index ? { ...h, details } : h))
  }

  const removeHistoryEntry = (index) => {
    setMedicalHistory(prev => prev.filter((_, i) => i !== index))
  }

  /* ── Validation ── */
  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Patient name is required'
    if (!form.age || form.age < 0 || form.age > 150) e.age = 'Valid age is required'
    if (!form.gender) e.gender = 'Gender is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.admission_datetime) e.admission_datetime = 'Admission date/time is required'
    if (!form.admitting_doctor) e.admitting_doctor = 'Admitting doctor is required'
    if (!form.ward) e.ward = 'Ward is required'
    if (!form.bed_number) e.bed_number = 'Bed number is required'
    if (!form.admission_type) e.admission_type = 'Admission type is required'
    if (!form.primary_diagnosis.trim()) e.primary_diagnosis = 'Primary diagnosis is required'
    if (!form.priority_level) e.priority_level = 'Priority level is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      // Open sections with errors
      const demoFields = ['name', 'age', 'gender', 'phone']
      const admFields = ['admission_datetime', 'admitting_doctor', 'ward', 'bed_number', 'admission_type', 'primary_diagnosis', 'priority_level']
      const errs = Object.keys(errors)
      if (demoFields.some(f => errs.includes(f))) setOpenSections(prev => ({ ...prev, demographics: true }))
      if (admFields.some(f => errs.includes(f))) setOpenSections(prev => ({ ...prev, admission: true }))
      return
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: form.name,
          gender: form.gender === 'Male' ? 'M' : form.gender === 'Female' ? 'F' : 'O',
          bed_number: form.bed_number,
          status: 'admitted',
          is_ventilated: false,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register patient in database');
      }

      setSubmitted(true)
    } catch (err) {
      alert(err.message);
    }
  }

  const handleReset = () => {
    setForm({ ...initialForm, admission_datetime: new Date().toISOString().slice(0, 16) })
    setErrors({})
    setMedicalHistory([])
    setSelectedCategory('')
    setSubmitted(false)
  }

  /* ── Available categories (exclude already added) ── */
  const availableCategories = MEDICAL_HISTORY_CATEGORIES.filter(
    c => !medicalHistory.some(h => h.category === c.value)
  )

  /* ── Success Screen ── */
  if (submitted) {
    return (
      <div className="add-patient-success">
        <div className="success-icon-wrap">
          <Check size={40} />
        </div>
        <h2>Patient Registered Successfully</h2>
        <p className="success-patient-name">{form.name}, {form.age}y / {form.gender}</p>
        <p className="success-details">
          {form.ward} • Bed {form.bed_number} • {form.priority_level} Priority
        </p>
        <p className="success-details">Admitting: {form.admitting_doctor}</p>
        <div className="success-actions">
          <button className="btn-primary" onClick={handleReset}>
            <Plus size={16} /> Add Another Patient
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="add-patient-form" onSubmit={handleSubmit} noValidate>
      <div className="add-patient-header">
        <div className="add-patient-header-left">
          <UserPlus size={22} />
          <div>
            <h2>Register New Patient</h2>
            <p>ICU Admission Form</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Demographics ── */}
      <FormSection
        title="Patient Demographics"
        icon={UserPlus}
        isOpen={openSections.demographics}
        onToggle={() => toggleSection('demographics')}
        badge="Required"
      >
        <div className="form-grid">
          <Field label="Full Name" required error={errors.name}>
            <input
              type="text"
              placeholder="Enter patient's full name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="form-input"
            />
          </Field>

          <Field label="Age (Years)" required error={errors.age}>
            <input
              type="number"
              placeholder="e.g. 45"
              min="0"
              max="150"
              value={form.age}
              onChange={e => set('age', e.target.value)}
              className="form-input"
            />
          </Field>

          <Field label="Gender" required error={errors.gender}>
            <select
              value={form.gender}
              onChange={e => set('gender', e.target.value)}
              className="form-input"
            >
              <option value="">Select gender</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>

          <Field label="Blood Group">
            <select
              value={form.blood_group}
              onChange={e => set('blood_group', e.target.value)}
              className="form-input"
            >
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>

          <Field label="Phone Number" required error={errors.phone}>
            <input
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="form-input"
            />
          </Field>

          <Field label="Address">
            <textarea
              placeholder="Residential address (optional)"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="form-input form-textarea"
              rows={2}
            />
          </Field>
        </div>
      </FormSection>

      {/* ── SECTION 2: Admission Details ── */}
      <FormSection
        title="Admission Details"
        icon={ClipboardList}
        isOpen={openSections.admission}
        onToggle={() => toggleSection('admission')}
        badge="Required"
      >
        <div className="form-grid">
          <Field label="Admission Date & Time" required error={errors.admission_datetime}>
            <input
              type="datetime-local"
              value={form.admission_datetime}
              onChange={e => set('admission_datetime', e.target.value)}
              className="form-input"
            />
          </Field>

          <Field label="Admitting Doctor" required error={errors.admitting_doctor}>
            <select
              value={form.admitting_doctor}
              onChange={e => set('admitting_doctor', e.target.value)}
              className="form-input"
            >
              <option value="">Select doctor</option>
              {DEMO_DOCTORS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>

          <Field label="Ward / Unit" required error={errors.ward}>
            <select
              value={form.ward}
              onChange={e => set('ward', e.target.value)}
              className="form-input"
            >
              <option value="">Select ward</option>
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>

          <Field label="Bed Number" required error={errors.bed_number}>
            <select
              value={form.bed_number}
              onChange={e => set('bed_number', e.target.value)}
              className="form-input"
            >
              <option value="">Select bed</option>
              {DEMO_BEDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>

          <Field label="Admission Type" required error={errors.admission_type}>
            <select
              value={form.admission_type}
              onChange={e => set('admission_type', e.target.value)}
              className="form-input"
            >
              <option value="">Select type</option>
              {ADMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Admission Source">
            <select
              value={form.admission_source}
              onChange={e => set('admission_source', e.target.value)}
              className="form-input"
            >
              <option value="">Select source</option>
              {ADMISSION_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Primary Diagnosis (Provisional)" required error={errors.primary_diagnosis}>
            <input
              type="text"
              placeholder="e.g. Acute Respiratory Distress Syndrome"
              value={form.primary_diagnosis}
              onChange={e => set('primary_diagnosis', e.target.value)}
              className="form-input"
            />
          </Field>

          <Field label="Priority Level" required error={errors.priority_level}>
            <div className="priority-buttons">
              {PRIORITY_LEVELS.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`priority-btn ${p.toLowerCase()} ${form.priority_level === p ? 'active' : ''}`}
                  onClick={() => set('priority_level', p)}
                >
                  {p}
                </button>
              ))}
            </div>
            {errors.priority_level && <span className="form-error"><AlertCircle size={12} /> {errors.priority_level}</span>}
          </Field>
        </div>
      </FormSection>

      {/* ── SECTION 3: Medical History (Dynamic) ── */}
      <FormSection
        title="Medical History"
        icon={Stethoscope}
        isOpen={openSections.history}
        onToggle={() => toggleSection('history')}
        badge={medicalHistory.length > 0 ? `${medicalHistory.length} added` : 'Optional'}
      >
        {/* Category selector */}
        <div className="history-add-row">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="form-input history-select"
            disabled={availableCategories.length === 0}
          >
            <option value="">
              {availableCategories.length === 0 ? 'All categories added' : 'Select a category to add...'}
            </option>
            {availableCategories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn-add-category"
            onClick={addHistoryCategory}
            disabled={!selectedCategory}
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Dynamic history entries */}
        {medicalHistory.length === 0 && (
          <div className="history-empty">
            <Stethoscope size={24} style={{ opacity: 0.4 }} />
            <p>No medical history added yet. Select a category above to start.</p>
          </div>
        )}

        <div className="history-entries">
          {medicalHistory.map((entry, i) => (
            <div key={entry.category} className="history-entry">
              <div className="history-entry-header">
                <span className="history-entry-label">{entry.label}</span>
                <button
                  type="button"
                  className="history-remove-btn"
                  onClick={() => removeHistoryEntry(i)}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
              <textarea
                className="form-input form-textarea"
                placeholder={`Enter details about ${entry.label.toLowerCase()}...`}
                value={entry.details}
                onChange={e => updateHistoryDetails(i, e.target.value)}
                rows={2}
              />
            </div>
          ))}
        </div>
      </FormSection>

      {/* ── Form Actions ── */}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={handleReset}>
          <RotateCcw size={16} /> Reset Form
        </button>
        <button type="submit" className="btn-primary">
          <Save size={16} /> Register Patient
        </button>
      </div>
    </form>
  )
}
