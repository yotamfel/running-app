'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Run = {
  id: string
  date: string
  distanceKm: number
  paceMinPerKm: number
  durationMin: number
  feeling: number | null
  notes: string | null
}

function formatPace(pace: number) {
  const min = Math.floor(pace)
  const sec = Math.round((pace - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
}

const inputClass = "w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-base placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"

type EditForm = {
  date: string
  distanceKm: string
  durationMinutes: string
  durationSeconds: string
  feeling: string
  notes: string
}

export default function HistoryChart({ runs: initialRuns }: { runs: Run[] }) {
  const [runs, setRuns] = useState(initialRuns)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ date: '', distanceKm: '', durationMinutes: '', durationSeconds: '', feeling: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  function startEdit(r: Run) {
    const totalMin = r.durationMin
    const mins = Math.floor(totalMin)
    const secs = Math.round((totalMin - mins) * 60)
    setEditForm({
      date: new Date(r.date).toISOString().slice(0, 10),
      distanceKm: String(r.distanceKm),
      durationMinutes: String(mins),
      durationSeconds: String(secs),
      feeling: r.feeling ? String(r.feeling) : '',
      notes: r.notes || '',
    })
    setEditingId(r.id)
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    try {
      const durationMin = (parseFloat(editForm.durationMinutes) || 0) + (parseFloat(editForm.durationSeconds) || 0) / 60
      const res = await fetch(`/api/runs/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editForm.date,
          distanceKm: editForm.distanceKm,
          durationMin,
          feeling: editForm.feeling || null,
          notes: editForm.notes || null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setRuns(prev => prev.map(r => r.id === editingId ? {
          ...r,
          date: updated.date,
          distanceKm: updated.distanceKm,
          durationMin: updated.durationMin,
          paceMinPerKm: updated.paceMinPerKm,
          feeling: updated.feeling,
          notes: updated.notes,
        } : r))
        setEditingId(null)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteRun(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/runs/${id}`, { method: 'DELETE' })
      setRuns(prev => prev.filter(r => r.id !== id))
      setConfirmId(null)
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  const chartData = [...runs].reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
    'מרחק': r.distanceKm,
    'קצב': parseFloat(r.paceMinPerKm.toFixed(2)),
  }))

  if (runs.length === 0) {
    return <p className="text-slate-500 text-center py-8">עדיין אין ריצות מתועדות</p>
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <p className="text-sm font-semibold text-slate-200 mb-3">מרחק לאורך זמן (ק&quot;מ)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="מרחק" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <p className="text-sm font-semibold text-slate-200 mb-3">קצב לאורך זמן (דק&apos;/ק&quot;מ)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} reversed />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => typeof v === 'number' ? formatPace(v) : v} />
            <Line type="monotone" dataKey="קצב" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: '#34d399' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-slate-200">כל הריצות</p>
        </div>
        {runs.map(r => (
          <div key={r.id} className="px-4 py-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-white">{r.distanceKm} ק&quot;מ</p>
                <p className="text-xs text-slate-400">
                  {new Date(r.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {r.notes && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{r.notes}</p>}
              </div>
              <div className="flex items-center gap-3 mr-2">
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-300">{formatPace(r.paceMinPerKm)} דק&apos;/ק&quot;מ</p>
                  <p className="text-xs text-slate-500">{r.durationMin} דקות</p>
                  {r.feeling && <p className="text-xs text-slate-500">תחושה {r.feeling}/10</p>}
                </div>
                <button
                  onClick={() => startEdit(r)}
                  className="text-slate-600 hover:text-indigo-400 transition-colors p-1"
                  title="ערוך ריצה"
                >
                  ✏️
                </button>
                {confirmId === r.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => deleteRun(r.id)}
                      disabled={deleting === r.id}
                      className="text-xs bg-red-900/60 text-red-300 border border-red-700 px-2 py-1 rounded-lg disabled:opacity-60"
                    >
                      {deleting === r.id ? '...' : 'מחק'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs bg-slate-700 text-slate-400 border border-slate-600 px-2 py-1 rounded-lg"
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(r.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                    title="מחק ריצה"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
          <div className="bg-slate-800 rounded-t-2xl w-full max-w-lg max-h-[85vh] flex flex-col border-t border-slate-700">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-700">
              <h2 className="font-bold text-lg text-white">עריכת ריצה</h2>
              <button
                onClick={() => setEditingId(null)}
                className="text-slate-400 text-2xl leading-none hover:text-slate-200"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">תאריך</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">מרחק (ק&quot;מ)</label>
                  <input type="number" step="0.01" min="0" value={editForm.distanceKm} onChange={e => setEditForm(f => ({ ...f, distanceKm: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">זמן</label>
                  <div className="flex gap-2 items-center">
                    <input type="number" min="0" value={editForm.durationMinutes} onChange={e => setEditForm(f => ({ ...f, durationMinutes: e.target.value }))} placeholder="דק'" className={inputClass + ' text-center'} />
                    <span className="text-slate-400">:</span>
                    <input type="number" min="0" max="59" value={editForm.durationSeconds} onChange={e => setEditForm(f => ({ ...f, durationSeconds: e.target.value }))} placeholder="שנ'" className={inputClass + ' text-center'} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">תחושה (1–10)</label>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, feeling: f.feeling === String(n) ? '' : String(n) }))}
                      className={`w-9 h-9 rounded-full text-sm font-medium border transition-colors ${
                        editForm.feeling === String(n)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">הערות</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={4}
                  placeholder="איך הרגשת, מה עבד, מה היה קשה..."
                  className={inputClass + ' resize-none'}
                />
              </div>
            </div>
            <div className="px-5 pb-8 flex gap-3" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold text-base disabled:opacity-60 transition-colors"
              >
                {saving ? 'שומר...' : 'שמור'}
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl py-3 font-semibold text-base transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
