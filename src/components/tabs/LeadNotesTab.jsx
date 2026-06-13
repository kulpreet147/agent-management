import { useState, useEffect } from 'react'
import { StickyNote, Plus, Trash2, RefreshCw, X, Clock, User } from 'lucide-react'
import { getNotes, addNote, deleteNote } from '../../utils/persons.js'

export default function LeadNotesTab({ personId, lead, refreshKey }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [noteContent, setNoteContent] = useState('')

  const loadNotes = () => {
    if (!personId) return
    setLoading(true)
    getNotes(personId)
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadNotes() }, [personId, refreshKey])

  const handleAdd = async () => {
    if (!noteContent.trim()) return
    try {
      await addNote(personId, noteContent.trim())
      setNoteContent('')
      setShowAdd(false)
      loadNotes()
    } catch (err) { alert(err.message || 'Failed to add note') }
  }

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return
    try {
      await deleteNote(personId, noteId)
      loadNotes()
    } catch (err) { alert(err.message || 'Failed to delete note') }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Notes</h3>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">{notes.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadNotes} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><RefreshCw size={15} className="text-slate-500" /></button>
          <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-blue-700"><Plus size={14} /> Add Note</button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><RefreshCw size={18} className="animate-spin text-blue-600 mr-2" /><span className="text-sm text-slate-500">Loading notes...</span></div>
      ) : notes.length === 0 ? (
        <div className="py-12 text-center">
          <StickyNote size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No notes yet.</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-blue-600 font-semibold hover:underline">Add a note</button>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="px-6 py-4 hover:bg-slate-50 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock size={11} />
                      {formatTimeAgo(note.createdAt)}
                    </span>
                    {note.createdByName && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <User size={11} />
                        {note.createdByName}
                      </span>
                    )}
                    {note.noteType && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">{note.noteType}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(note.id)} className="p-1.5 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add Note</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-slate-100 rounded-full"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                placeholder="Write your note..." rows={5} autoFocus />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAdd(false)}
                  className="px-5 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
                <button onClick={handleAdd} disabled={!noteContent.trim()}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:opacity-90 disabled:opacity-50">Save Note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
