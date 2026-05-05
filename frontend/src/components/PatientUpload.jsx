/**
 * PatientUpload — Upload PDF, TXT, CSV patient data files
 * Calls POST /api/upload to ingest lab/vital/culture data
 */
import { useState, useRef, useCallback } from 'react'
import { UploadCloud, FileText, CheckCircle, XCircle, AlertCircle, X, FilePlus } from 'lucide-react'

const API_BASE = 'http://localhost:8000/api'

const FILE_ICONS = {
  pdf: '📄',
  csv: '📊',
  txt: '📝',
}

const DATA_TYPE_LABELS = {
  auto:    'Auto-detect',
  lab:     'Lab Report',
  vital:   'Vital Signs',
  note:    'Clinical Note',
  culture: 'Culture / Microbiology',
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function FileRow({ file, onRemove }) {
  const ext = file.name.split('.').pop().toLowerCase()
  return (
    <div style={styles.fileRow}>
      <span style={styles.fileIcon}>{FILE_ICONS[ext] || '📁'}</span>
      <div style={styles.fileInfo}>
        <div style={styles.fileName}>{file.name}</div>
        <div style={styles.fileSize}>{formatBytes(file.size)}</div>
      </div>
      <button onClick={onRemove} style={styles.removeBtn} title="Remove file">
        <X size={14} />
      </button>
    </div>
  )
}

export default function PatientUpload({ patients, currentUser }) {
  const [selectedPatient, setSelectedPatient] = useState('')
  const [dataType, setDataType] = useState('auto')
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [results, setResults] = useState([])  // [{filename, status, message}]
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const ALLOWED = ['.pdf', '.csv', '.txt']

  const addFiles = useCallback((incoming) => {
    const valid = Array.from(incoming).filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase()
      return ALLOWED.includes(ext)
    })
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !names.has(f.name))]
    })
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const onFileInput = (e) => {
    addFiles(e.target.files)
    e.target.value = ''
  }

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const handleUpload = async () => {
    if (!selectedPatient) { alert('Please select a patient first.'); return }
    if (files.length === 0) { alert('Please attach at least one file.'); return }

    setUploading(true)
    setResults([])

    const uploadResults = []

    for (const file of files) {
      const formData = new FormData()
      formData.append('patient_id', selectedPatient)
      formData.append('data_type', dataType)
      formData.append('file', file)
      if (currentUser?.id) formData.append('uploader_id', currentUser.id)

      try {
        const res = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) {
          uploadResults.push({ filename: file.name, status: 'error', message: data.detail || 'Upload failed' })
        } else {
          uploadResults.push({ filename: file.name, status: 'success', message: data.message || 'Uploaded successfully' })
        }
      } catch (err) {
        uploadResults.push({ filename: file.name, status: 'error', message: 'Network error: ' + err.message })
      }
    }

    setResults(uploadResults)
    setUploading(false)
    // Clear successfully uploaded files
    const failedNames = new Set(uploadResults.filter(r => r.status === 'error').map(r => r.filename))
    setFiles(prev => prev.filter(f => failedNames.has(f.name)))
  }

  const allDone = results.length > 0 && results.every(r => r.status === 'success')

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <UploadCloud size={22} color="#0284c7" />
        <div>
          <h2 style={styles.title}>Upload Patient Data</h2>
          <p style={styles.subtitle}>Upload lab reports, vitals, culture results or clinical notes as PDF, CSV, or TXT files</p>
        </div>
      </div>

      {/* Patient + Data Type selectors */}
      <div style={styles.selectors}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Patient *</label>
          <select
            style={styles.select}
            value={selectedPatient}
            onChange={e => setSelectedPatient(e.target.value)}
          >
            <option value="">Select a patient…</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Report Type</label>
          <select
            style={styles.select}
            value={dataType}
            onChange={e => setDataType(e.target.value)}
          >
            {Object.entries(DATA_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        style={{
          ...styles.dropzone,
          ...(dragging ? styles.dropzoneActive : {}),
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.csv,.txt"
          style={{ display: 'none' }}
          onChange={onFileInput}
        />
        <FilePlus size={36} color={dragging ? '#0284c7' : '#94a3b8'} />
        <p style={styles.dropText}>
          {dragging ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
        </p>
        <p style={styles.dropHint}>Supported: PDF, CSV, TXT — multiple files allowed</p>
      </div>

      {/* Attached files list */}
      {files.length > 0 && (
        <div style={styles.fileList}>
          <div style={styles.fileListHeader}>
            <span style={styles.fileListTitle}>Attached Files ({files.length})</span>
          </div>
          {files.map((f, idx) => (
            <FileRow key={idx} file={f} onRemove={() => removeFile(idx)} />
          ))}
        </div>
      )}

      {/* Upload button */}
      <button
        style={{
          ...styles.uploadBtn,
          ...(uploading || files.length === 0 || !selectedPatient ? styles.uploadBtnDisabled : {}),
        }}
        onClick={handleUpload}
        disabled={uploading || files.length === 0 || !selectedPatient}
      >
        {uploading ? (
          <>
            <span style={styles.spinner} /> Uploading…
          </>
        ) : (
          <>
            <UploadCloud size={16} /> Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
          </>
        )}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div style={styles.resultsSection}>
          <div style={styles.resultsTitle}>Upload Results</div>
          {results.map((r, i) => (
            <div key={i} style={{ ...styles.resultRow, borderColor: r.status === 'success' ? '#059669' : '#ef4444' }}>
              <span>
                {r.status === 'success'
                  ? <CheckCircle size={16} color="#059669" />
                  : <XCircle size={16} color="#ef4444" />}
              </span>
              <div style={styles.resultInfo}>
                <div style={styles.resultFilename}>{r.filename}</div>
                <div style={{
                  ...styles.resultMessage,
                  color: r.status === 'success' ? '#059669' : '#ef4444'
                }}>{r.message}</div>
              </div>
            </div>
          ))}

          {allDone && (
            <div style={styles.successNote}>
              <CheckCircle size={14} color="#059669" />
              All files uploaded. Run Clinical Analysis on the Patient Overview tab to see updated results.
            </div>
          )}
        </div>
      )}

      {/* Format guide */}
      <div style={styles.guide}>
        <div style={styles.guideTitle}><AlertCircle size={13} /> File Format Guide</div>
        <div style={styles.guideGrid}>
          <div style={styles.guideCard}>
            <div style={styles.guideCardTitle}>📊 CSV</div>
            <div style={styles.guideCardText}>
              Columns: <code>Parameter, Value, Unit</code><br />
              Example row: <code>Potassium, 4.2, mmol/L</code>
            </div>
          </div>
          <div style={styles.guideCard}>
            <div style={styles.guideCardTitle}>📝 TXT</div>
            <div style={styles.guideCardText}>
              Free text with values.<br />
              Example: <code>HR: 95 bpm, Creatinine: 1.4</code>
            </div>
          </div>
          <div style={styles.guideCard}>
            <div style={styles.guideCardTitle}>📄 PDF</div>
            <div style={styles.guideCardText}>
              Digital lab reports with tables are auto-extracted. Scanned PDFs use OCR.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '20px 24px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: 800,
    color: '#1e293b',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '4px 0 0',
  },
  selectors: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  select: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: '0.9rem',
    fontFamily: 'Outfit, sans-serif',
    color: '#1e293b',
    outline: 'none',
    cursor: 'pointer',
  },
  dropzone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    background: '#f8fafc',
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  dropzoneActive: {
    border: '2px dashed #0284c7',
    background: '#e0f2fe',
  },
  dropText: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#475569',
    margin: 0,
  },
  dropHint: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    margin: 0,
  },
  fileList: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#fff',
  },
  fileListHeader: {
    padding: '10px 16px',
    background: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
  },
  fileListTitle: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  fileIcon: {
    fontSize: '1.3rem',
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1e293b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSize: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '2px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  uploadBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 32px',
    background: '#0284c7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: 'Outfit, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.2s',
    alignSelf: 'flex-start',
  },
  uploadBtnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  resultsSection: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#fff',
  },
  resultsTitle: {
    padding: '10px 16px',
    background: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  resultRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    borderLeft: '3px solid',
  },
  resultInfo: {
    flex: 1,
  },
  resultFilename: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  resultMessage: {
    fontSize: '0.8rem',
    marginTop: '2px',
  },
  successNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#059669',
    background: '#d1fae5',
  },
  guide: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '18px',
    background: '#fff',
  },
  guideTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '14px',
  },
  guideGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  guideCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px',
  },
  guideCardTitle: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '6px',
  },
  guideCardText: {
    fontSize: '0.8rem',
    color: '#64748b',
    lineHeight: 1.6,
  },
}
