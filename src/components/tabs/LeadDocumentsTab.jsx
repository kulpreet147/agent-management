import { useState, useEffect } from 'react'
import { FileText, Trash2, RefreshCw, Download, Calendar, User } from 'lucide-react'
import { getDocuments, removeDocument } from '../../utils/persons.js'

const docCategoryStyles = {
  Application: { badge: 'bg-blue-50 text-blue-600' },
  ID: { badge: 'bg-green-50 text-green-600' },
  'Policy Docs': { badge: 'bg-sky-50 text-sky-600' },
  'Signed Forms': { badge: 'bg-purple-50 text-purple-600' },
  Supporting: { badge: 'bg-amber-50 text-amber-600' },
}

export default function LeadDocumentsTab({ personId, lead }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDocuments = () => {
    if (!personId) return
    setLoading(true)
    getDocuments(personId)
      .then((data) => setDocuments(Array.isArray(data) ? data : []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadDocuments() }, [personId])

  const handleRemove = async (docId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return
    try {
      await removeDocument(personId, docId)
      loadDocuments()
    } catch (err) { alert(err.message || 'Failed to delete document') }
  }

  const getFileIcon = (mimeType) => {
    if (!mimeType) return FileText
    if (mimeType.includes('pdf')) return FileText
    if (mimeType.includes('image')) return FileText
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileText
    return FileText
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Documents</h3>
        </div>
        <button onClick={loadDocuments} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <RefreshCw size={15} className="text-slate-500" />
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><RefreshCw size={18} className="animate-spin text-blue-600 mr-2" /><span className="text-sm text-slate-500">Loading documents...</span></div>
      ) : documents.length === 0 ? (
        <div className="py-12 text-center">
          <FileText size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {documents.map((doc) => {
            const catStyle = docCategoryStyles[doc.category] || { badge: 'bg-slate-50 text-slate-600' }
            return (
              <div key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <FileText size={20} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{doc.fileName || doc.name || 'Unnamed Document'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {doc.category && <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${catStyle.badge}`}>{doc.category}</span>}
                      {doc.uploadedAt && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar size={11} />
                          {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      {doc.uploadedBy && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <User size={11} />
                          {doc.uploadedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-blue-50 rounded transition-colors" title="Download">
                      <Download size={14} className="text-blue-600" />
                    </a>
                  )}
                  <button onClick={() => handleRemove(doc.id, doc.fileName || doc.name)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Delete">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
