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

export default function HistoryChart({ runs: initialRuns }: { runs: Run[] }) {
  const [runs, setRuns] = useState(initialRuns)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteValue, setEditNoteValue] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const router = useRouter()

  async function saveNote(id: string) {
    setSavingNote(true)
    try {
      const res = await fetch(`/api/runs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNoteValue || null }),
      })
      if (res.ok) {
        setRuns(prev => prev.map(r => r.id === id ? { ...r, notes: editNoteValue || null } : r))
        setEditingNoteId(null)
        router.refresh()
      }
    } finally {
      setSavingNote(false)
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
                {editingNoteId === r.id ? (
                  <div className="mt-1 space-y-1">
                    <textarea
                      value={editNoteValue}
                      onChange={e => setEditNoteValue(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs resize-none focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-1">
                      <button onClick={() => saveNote(r.id)} disabled={savingNote} className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded disabled:opacity-60">שמור</button>
                      <button onClick={() => setEditingNoteId(null)} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">ביטול</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-0.5">
                    {r.notes && <p className="text-xs text-slate-500 truncate max-w-[200px]">{r.notes}</p>}
                    <button
                      onClick={() => { setEditingNoteId(r.id); setEditNoteValue(r.notes || '') }}
                      className="text-xs text-slate-600 hover:text-indigo-400 transition-colors"
                      title="ערוך הערה"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mr-2">
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-300">{formatPace(r.paceMinPerKm)} דק&apos;/ק&quot;מ</p>
                  <p className="text-xs text-slate-500">{r.durationMin} דקות</p>
                  {r.feeling && <p className="text-xs text-slate-500">תחושה {r.feeling}/10</p>}
                </div>
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
    </div>
  )
}
